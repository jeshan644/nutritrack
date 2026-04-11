import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import CalorieRing from '../components/CalorieRing';
import MacroPill from '../components/MacroPill';
import type { FoodLogEntry, MealType, Settings } from '../types';
import {
  getLogForDate, deleteLogEntry, todayStr, getDayTotals,
  copyDayLog, getSettings, getSettingsSync,
} from '../utils/storage';

const MEALS: { key: MealType; label: string; emoji: string }[] = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { key: 'lunch',     label: 'Lunch',     emoji: '☀️' },
  { key: 'dinner',    label: 'Dinner',    emoji: '🌙' },
  { key: 'snacks',    label: 'Snacks',    emoji: '🍿' },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

interface Props {
  onOpenLog: (mealType?: MealType) => void;
  refreshKey: number;
}

function SkeletonCard() {
  return (
    <div className="rounded-card p-3" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
      <div className="h-4 w-2/3 rounded animate-pulse mb-2" style={{ background: '#3d3d3d' }} />
      <div className="h-3 w-1/3 rounded animate-pulse" style={{ background: '#3d3d3d' }} />
    </div>
  );
}

export default function DashboardScreen({ onOpenLog, refreshKey }: Props) {
  const [entries, setEntries]               = useState<FoodLogEntry[]>([]);
  const [settings, setSettings]             = useState<Settings>(getSettingsSync());
  const [loading, setLoading]               = useState(true);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [collapsedMeals, setCollapsedMeals] = useState<Set<string>>(new Set());
  const today = todayStr();

  const load = async () => {
    setLoading(true);
    const [newEntries, newSettings] = await Promise.all([
      getLogForDate(today),
      getSettings(),
    ]);
    setEntries(newEntries);
    setSettings(newSettings);
    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshKey]);

  const totals    = getDayTotals(entries);
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  async function handleDelete(id: string) {
    await deleteLogEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    setDeletingId(null);
  }

  async function handleCopyYesterday() {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const count = await copyDayLog(yesterday, today);
    if (count === 0) alert('No entries found from yesterday.');
    else load();
  }

  function toggleMeal(key: string) {
    setCollapsedMeals(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#1a1a1a' }}>

      {/* ── Fixed header ─────────────────────────────────────── */}
      <div
        className="shrink-0 px-4 pb-3"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          borderBottom: '1px solid #2a2a2a',
        }}
      >
        <div className="max-w-lg mx-auto">
          <p className="text-xs" style={{ color: '#9b9b9b' }}>{todayDate}</p>
          <h1 className="text-xl font-bold mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans', color: '#ececec' }}>
            {getGreeting()}{settings.name ? `, ${settings.name}` : ''} 👋
          </h1>
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────── */}
      <div className="scroll-area flex-1 px-4" style={{ paddingTop: 12, paddingBottom: 12 }}>
        <div className="max-w-lg mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {loading ? (
            <>
              <div className="flex justify-center">
                <div className="w-[160px] h-[160px] rounded-full animate-pulse" style={{ background: '#242424' }} />
              </div>
              <div className="flex gap-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex-1 h-14 rounded-card animate-pulse" style={{ background: '#242424' }} />
                ))}
              </div>
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </>
          ) : (
            <>
              {/* Calorie ring */}
              <div className="flex justify-center" style={{ marginBottom: 0 }}>
                <CalorieRing consumed={totals.calories} goal={settings.calorie_goal} size={160} />
              </div>

              {/* Macro pills — all 4 in one row */}
              <div className="flex gap-2">
                <MacroPill label="Protein" consumed={totals.protein} goal={settings.protein_goal} color="#60a5fa" bgColor="#60a5fa20" />
                <MacroPill label="Carbs"   consumed={totals.carbs}   goal={settings.carbs_goal}   color="#f97316" bgColor="#f9731620" />
                <MacroPill label="Fat"     consumed={totals.fat}     goal={settings.fat_goal}     color="#facc15" bgColor="#facc1520" />
                <MacroPill label="Fiber"   consumed={totals.fiber}   goal={settings.fiber_goal}   color="#a78bfa" bgColor="#a78bfa20" />
              </div>

              {/* Meal sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Section heading + subtle copy-yesterday link */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: '#ececec' }}>Today's Meals</span>
                  <button
                    onClick={handleCopyYesterday}
                    className="active-scale flex items-center gap-1"
                    style={{ background: 'none', border: 'none', color: '#6b6b6b', fontSize: 12, padding: '4px 0', cursor: 'pointer' }}
                  >
                    ↩ Copy yesterday
                  </button>
                </div>

                {MEALS.map(meal => {
                  const mealEntries = entries.filter(e => e.meal_type === meal.key);
                  const mealCal     = mealEntries.reduce((s, e) => s + e.calories, 0);
                  const collapsed   = collapsedMeals.has(meal.key);

                  return (
                    <div key={meal.key} className="rounded-card overflow-hidden" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
                      {/* Meal header */}
                      <div className="flex items-center px-4 cursor-pointer" style={{ paddingTop: 10, paddingBottom: 10 }} onClick={() => toggleMeal(meal.key)}>
                        <span className="text-sm mr-2">{meal.emoji}</span>
                        <span className="font-semibold text-sm flex-1" style={{ color: '#ececec' }}>{meal.label}</span>
                        {mealCal > 0 && (
                          <span className="text-xs font-tabular mr-2" style={{ color: '#d97706' }}>
                            {Math.round(mealCal)} kcal
                          </span>
                        )}
                        <button
                          className="active-scale p-1 rounded-lg mr-1"
                          style={{ background: '#3d3d3d', color: '#9b9b9b' }}
                          onClick={e => { e.stopPropagation(); onOpenLog(meal.key); }}
                        >
                          <Plus size={14} />
                        </button>
                        {collapsed
                          ? <ChevronDown size={14} style={{ color: '#9b9b9b' }} />
                          : <ChevronUp   size={14} style={{ color: '#9b9b9b' }} />}
                      </div>

                      {/* Entries */}
                      {!collapsed && (
                        <div>
                          {mealEntries.length === 0 ? (
                            <p className="text-xs px-4 pb-2.5" style={{ color: '#9b9b9b' }}>
                              Nothing logged — tap + to add 🍽️
                            </p>
                          ) : (
                            mealEntries.map(entry => (
                              <div
                                key={entry.id}
                                className="flex items-center gap-2"
                                style={{ borderTop: '1px solid #3d3d3d', padding: '10px 16px' }}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate" style={{ color: '#ececec' }}>{entry.name}</p>
                                  <p className="text-xs mt-0.5" style={{ color: '#9b9b9b' }}>
                                    P {entry.protein.toFixed(1)}g · C {entry.carbs.toFixed(1)}g · F {entry.fat.toFixed(1)}g
                                  </p>
                                </div>
                                <span className="text-sm font-tabular font-semibold" style={{ color: '#f97316' }}>
                                  {Math.round(entry.calories)}
                                </span>
                                <button
                                  className="active-scale p-1.5 rounded-lg transition-colors"
                                  style={{
                                    background: deletingId === entry.id ? '#450a0a' : '#3d3d3d',
                                    color:      deletingId === entry.id ? '#fca5a5' : '#9b9b9b',
                                  }}
                                  onClick={() => {
                                    if (deletingId === entry.id) handleDelete(entry.id);
                                    else setDeletingId(entry.id);
                                  }}
                                  onBlur={() => setDeletingId(null)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
