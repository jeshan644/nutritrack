import { supabase, isSupabaseReady, getSessionId } from '../lib/supabase';
import type { Food, Recipe, FoodLogEntry, Settings } from '../types';
import { SEED_FOODS } from '../data/seedFoods';

// ─── Default settings ─────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  sex: 'male',
  age: 25,
  weight_kg: 75,
  height_cm: 175,
  activity_level: 'moderate',
  calorie_goal: 2000,
  protein_goal: 150,
  carbs_goal: 200,
  fat_goal: 65,
  fiber_goal: 30,
  onboarded: false,
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch { return fallback; }
}
function lsSet<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ─── Custom Foods — localStorage only ────────────────────────────────────────

export function getFoods(): Food[] {
  const stored = lsGet<Food[]>('nt_foods', []);
  if (stored.length === 0) { lsSet('nt_foods', SEED_FOODS); return SEED_FOODS; }
  return stored;
}
export function saveFood(food: Food) {
  const foods = getFoods();
  const idx = foods.findIndex(f => f.id === food.id);
  if (idx >= 0) foods[idx] = food; else foods.push(food);
  lsSet('nt_foods', foods);
}
export function deleteFood(id: string) {
  lsSet('nt_foods', getFoods().filter(f => f.id !== id));
}

// ─── Settings ─────────────────────────────────────────────────────────────────

/** Migrate old single-key storage format on first run after upgrade. */
function migrateOldSettings() {
  const old = localStorage.getItem('nt_settings');
  if (!old) return;
  try {
    const parsed = JSON.parse(old) as Partial<Settings> & { onboarded?: boolean };
    if (parsed.onboarded) localStorage.setItem('nt_onboarded', 'true');
    lsSet('nt_settings_cache', parsed);
    localStorage.removeItem('nt_settings');
  } catch { /* ignore */ }
}

/**
 * Sync read from localStorage cache — safe to call in useState() initialiser.
 * Always returns a full Settings object instantly.
 */
export function getSettingsSync(): Settings {
  migrateOldSettings();
  const cached    = lsGet<Partial<Settings>>('nt_settings_cache', {});
  const onboarded = localStorage.getItem('nt_onboarded') === 'true';
  return { ...DEFAULT_SETTINGS, ...cached, onboarded };
}

/**
 * Async: fetches from Supabase and updates the localStorage cache.
 * Falls back to getSettingsSync() if Supabase is not configured or errors.
 */
export async function getSettings(): Promise<Settings> {
  if (!isSupabaseReady) return getSettingsSync();
  try {
    const sid = getSessionId();
    const { data, error } = await supabase!
      .from('settings')
      .select('*')
      .eq('session_id', sid)
      .single();
    if (!error && data) {
      lsSet('nt_settings_cache', data);
      const onboarded = localStorage.getItem('nt_onboarded') === 'true';
      return { ...DEFAULT_SETTINGS, ...data, onboarded };
    }
  } catch { /* fall through */ }
  return getSettingsSync();
}

/**
 * Async: writes to Supabase + updates localStorage cache.
 * API key and onboarded flag stay in localStorage only.
 */
export async function saveSettings(s: Settings): Promise<void> {
  localStorage.setItem('nt_onboarded', s.onboarded ? 'true' : 'false');
  lsSet('nt_settings_cache', s);

  if (!isSupabaseReady) return;
  const sid = getSessionId();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onboarded, ...supabaseFields } = s;
  await supabase!.from('settings').upsert({
    ...supabaseFields,
    session_id: sid,
    updated_at: new Date().toISOString(),
  });
}

// ─── Session verification ─────────────────────────────────────────────────────

/**
 * Verify a backup code (full UUID or 8-char prefix).
 * Returns the canonical full session_id if found, null otherwise.
 */
export async function verifySessionId(input: string): Promise<string | null> {
  if (!isSupabaseReady) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try exact match in settings first
  const { data: settingsRow } = await supabase!
    .from('settings')
    .select('session_id')
    .eq('session_id', trimmed)
    .maybeSingle();
  if (settingsRow?.session_id) return settingsRow.session_id;

  // Try exact match in food_log
  const { data: logRows } = await supabase!
    .from('food_log')
    .select('session_id')
    .eq('session_id', trimmed)
    .limit(1);
  if (logRows?.[0]?.session_id) return logRows[0].session_id;

  // Try 8-char prefix match (for short display code)
  if (trimmed.replace(/-/g, '').length <= 8) {
    const prefix = trimmed.toLowerCase();
    const { data: prefixRows } = await supabase!
      .from('food_log')
      .select('session_id')
      .ilike('session_id', prefix + '%')
      .limit(1);
    if (prefixRows?.[0]?.session_id) return prefixRows[0].session_id;
  }

  return null;
}

// ─── Food Log ─────────────────────────────────────────────────────────────────

function rowToEntry(row: Record<string, unknown>): FoodLogEntry {
  return {
    id:         row.id as string,
    date:       row.date as string,
    meal_type:  row.meal_type as FoodLogEntry['meal_type'],
    entry_type: (row.source as FoodLogEntry['entry_type']) || 'food',
    name:       row.name as string,
    calories:   Number(row.calories),
    protein:    Number(row.protein),
    carbs:      Number(row.carbs),
    fat:        Number(row.fat),
    fiber:      Number(row.fiber) || 0,
    quantity:   row.quantity_g ? Number(row.quantity_g) : undefined,
  };
}

function entryToRow(entry: FoodLogEntry, sessionId: string) {
  return {
    id:         entry.id,
    session_id: sessionId,
    date:       entry.date,
    meal_type:  entry.meal_type,
    name:       entry.name,
    calories:   entry.calories,
    protein:    entry.protein,
    carbs:      entry.carbs,
    fat:        entry.fat,
    fiber:      entry.fiber || 0,
    quantity_g: entry.quantity ?? null,
    source:     entry.entry_type,
  };
}

export async function getLogForDate(date: string): Promise<FoodLogEntry[]> {
  if (!isSupabaseReady) {
    return lsGet<FoodLogEntry[]>('nt_log', []).filter(e => e.date === date);
  }
  const sid = getSessionId();
  const { data } = await supabase!
    .from('food_log')
    .select('*')
    .eq('session_id', sid)
    .eq('date', date)
    .order('logged_at', { ascending: true });
  return (data || []).map(rowToEntry);
}

export async function getAllLog(): Promise<FoodLogEntry[]> {
  if (!isSupabaseReady) {
    return lsGet<FoodLogEntry[]>('nt_log', []);
  }
  const sid = getSessionId();
  const { data } = await supabase!
    .from('food_log')
    .select('*')
    .eq('session_id', sid)
    .order('logged_at', { ascending: true });
  return (data || []).map(rowToEntry);
}

export async function addLogEntry(entry: FoodLogEntry): Promise<void> {
  if (!isSupabaseReady) {
    const log = lsGet<FoodLogEntry[]>('nt_log', []);
    log.push(entry);
    lsSet('nt_log', log);
    return;
  }
  const sid = getSessionId();
  await supabase!.from('food_log').insert(entryToRow(entry, sid));
}

export async function updateLogEntry(entry: FoodLogEntry): Promise<void> {
  if (!isSupabaseReady) {
    const log = lsGet<FoodLogEntry[]>('nt_log', []);
    const idx = log.findIndex(e => e.id === entry.id);
    if (idx >= 0) { log[idx] = entry; lsSet('nt_log', log); }
    return;
  }
  const sid = getSessionId();
  await supabase!
    .from('food_log')
    .update(entryToRow(entry, sid))
    .eq('id', entry.id)
    .eq('session_id', sid);
}

export async function deleteLogEntry(id: string): Promise<void> {
  if (!isSupabaseReady) {
    lsSet('nt_log', lsGet<FoodLogEntry[]>('nt_log', []).filter(e => e.id !== id));
    return;
  }
  const sid = getSessionId();
  await supabase!.from('food_log').delete().eq('id', id).eq('session_id', sid);
}

export async function clearAllLogs(): Promise<void> {
  if (!isSupabaseReady) { localStorage.removeItem('nt_log'); return; }
  const sid = getSessionId();
  await supabase!.from('food_log').delete().eq('session_id', sid);
}

export async function copyDayLog(fromDate: string, toDate: string): Promise<number> {
  const entries = await getLogForDate(fromDate);
  if (entries.length === 0) return 0;

  if (!isSupabaseReady) {
    const log = lsGet<FoodLogEntry[]>('nt_log', []);
    const newEntries = entries.map(e => ({ ...e, id: crypto.randomUUID(), date: toDate }));
    log.push(...newEntries);
    lsSet('nt_log', log);
    return newEntries.length;
  }

  const sid = getSessionId();
  const rows = entries.map(e =>
    entryToRow({ ...e, id: crypto.randomUUID(), date: toDate }, sid)
  );
  await supabase!.from('food_log').insert(rows);
  return rows.length;
}

// ─── Recipes ──────────────────────────────────────────────────────────────────

function rowToRecipe(row: Record<string, unknown>): Recipe {
  return {
    id:          row.id as string,
    name:        row.name as string,
    servings:    Number(row.servings),
    ingredients: row.ingredients as Recipe['ingredients'],
    created_at:  row.created_at as string,
  };
}

export async function getRecipes(): Promise<Recipe[]> {
  if (!isSupabaseReady) return lsGet<Recipe[]>('nt_recipes', []);
  const sid = getSessionId();
  const { data } = await supabase!
    .from('recipes')
    .select('*')
    .eq('session_id', sid)
    .order('created_at', { ascending: true });
  return (data || []).map(rowToRecipe);
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  if (!isSupabaseReady) {
    const recipes = lsGet<Recipe[]>('nt_recipes', []);
    const idx = recipes.findIndex(r => r.id === recipe.id);
    if (idx >= 0) recipes[idx] = recipe; else recipes.push(recipe);
    lsSet('nt_recipes', recipes);
    return;
  }
  const sid = getSessionId();
  await supabase!.from('recipes').upsert({
    id:          recipe.id,
    session_id:  sid,
    name:        recipe.name,
    servings:    recipe.servings,
    ingredients: recipe.ingredients,
    created_at:  recipe.created_at,
  });
}

export async function deleteRecipe(id: string): Promise<void> {
  if (!isSupabaseReady) {
    lsSet('nt_recipes', lsGet<Recipe[]>('nt_recipes', []).filter(r => r.id !== id));
    return;
  }
  const sid = getSessionId();
  await supabase!.from('recipes').delete().eq('id', id).eq('session_id', sid);
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dateLabel(date: string): string {
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (date === today) return 'Today';
  if (date === yesterday) return 'Yesterday';
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export function getDayTotals(entries: FoodLogEntry[]) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein:  acc.protein  + e.protein,
      carbs:    acc.carbs    + e.carbs,
      fat:      acc.fat      + e.fat,
      fiber:    acc.fiber    + e.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
}
