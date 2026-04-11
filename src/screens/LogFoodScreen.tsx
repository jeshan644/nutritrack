import { useState } from 'react';
import { X, Loader2, Sparkles, Search, ChevronRight } from 'lucide-react';
import type { MealType, AIFoodItem, Food } from '../types';
import { getFoods, addLogEntry } from '../utils/storage';
import type { EatingOutPreset } from '../data/seedFoods';
import { EATING_OUT_PRESETS } from '../data/seedFoods';
import { parseNaturalLanguageMeal, isAiConfigured } from '../utils/claude';
import BarcodeScanner from '../components/BarcodeScanner';
import RestaurantsTab from '../components/RestaurantsTab';

type Tab = 'ai' | 'search' | 'barcode' | 'restaurants';

const MEALS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snacks', label: 'Snacks' },
];

interface Props {
  defaultMeal?: MealType;
  onClose: () => void;
  onLogged: () => void;
}

function autoMeal(): MealType {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 20) return 'dinner';
  return 'snacks';
}

type SelectedFood = (Food & { isPreset?: false }) | (EatingOutPreset & { isPreset: true });

export default function LogFoodScreen({ defaultMeal, onClose, onLogged }: Props) {
  const [tab, setTab] = useState<Tab>('ai');
  const [meal, setMeal] = useState<MealType>(defaultMeal || autoMeal());
  const today = new Date().toISOString().slice(0, 10);

  // AI tab
  const [aiText, setAiText]     = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]   = useState('');
  const [aiItems, setAiItems]   = useState<AIFoodItem[]>([]);

  // Search tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<SelectedFood | null>(null);
  const [foodGrams, setFoodGrams] = useState('100');

  // AI parsing
  async function handleAIParse() {
    if (!aiText.trim()) { setAiError('Please describe your meal first.'); return; }
    setAiLoading(true);
    setAiError('');
    setAiItems([]);
    try {
      const items = await parseNaturalLanguageMeal(aiText);
      setAiItems(items);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to parse meal.';
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  }

  function updateAIItem(idx: number, field: keyof AIFoodItem, value: string) {
    setAiItems(prev => {
      const next = [...prev];
      const item = { ...next[idx] };
      if (field === 'quantity_g') {
        const newG = parseFloat(value) || 0;
        const oldG = item.quantity_g || 1;
        const ratio = newG / oldG;
        item.calories = Math.round(item.calories * ratio);
        item.protein_g = parseFloat((item.protein_g * ratio).toFixed(1));
        item.carbs_g = parseFloat((item.carbs_g * ratio).toFixed(1));
        item.fat_g = parseFloat((item.fat_g * ratio).toFixed(1));
        item.quantity_g = newG;
      } else if (field === 'name') {
        item.name = value;
      }
      next[idx] = item;
      return next;
    });
  }

  async function logAIItems() {
    await Promise.all(aiItems.map(item => addLogEntry({
      id: crypto.randomUUID(),
      date: today,
      meal_type: meal,
      entry_type: 'ai',
      name: item.name,
      calories: item.calories,
      protein: item.protein_g,
      carbs: item.carbs_g,
      fat: item.fat_g,
      fiber: item.fiber_g || 0,
      quantity: item.quantity_g,
    })));
    onLogged();
    onClose();
  }

  // Search tab
  const allFoods = getFoods();
  const filteredFoods = searchQuery.length > 1
    ? allFoods.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10)
    : [];
  const filteredPresets = searchQuery.length > 1
    ? EATING_OUT_PRESETS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : EATING_OUT_PRESETS.slice(0, 6);

  function selectFood(food: Food | EatingOutPreset, isPreset = false) {
    if (isPreset) {
      setSelectedFood({ ...(food as EatingOutPreset), isPreset: true });
      setFoodGrams('1');
    } else {
      setSelectedFood({ ...(food as Food), isPreset: false });
      setFoodGrams('100');
    }
  }

  async function logSelectedFood() {
    if (!selectedFood) return;
    let cal: number, prot: number, carb: number, fat: number, fiber: number;
    if (selectedFood.isPreset) {
      const srv = parseFloat(foodGrams) || 1;
      cal = Math.round(selectedFood.calories * srv);
      prot = parseFloat((selectedFood.protein * srv).toFixed(1));
      carb = parseFloat((selectedFood.carbs * srv).toFixed(1));
      fat = parseFloat((selectedFood.fat * srv).toFixed(1));
      fiber = parseFloat(((selectedFood.fiber || 0) * srv).toFixed(1));
    } else {
      const g = parseFloat(foodGrams) || 100;
      const ratio = g / 100;
      cal = Math.round((selectedFood as Food).calories_per_100g * ratio);
      prot = parseFloat((selectedFood.protein * ratio).toFixed(1));
      carb = parseFloat((selectedFood.carbs * ratio).toFixed(1));
      fat = parseFloat((selectedFood.fat * ratio).toFixed(1));
      fiber = parseFloat(((selectedFood.fiber || 0) * ratio).toFixed(1));
    }
    await addLogEntry({
      id: crypto.randomUUID(),
      date: today,
      meal_type: meal,
      entry_type: 'food',
      name: selectedFood.name,
      calories: cal,
      protein: prot,
      carbs: carb,
      fat,
      fiber,
      quantity: parseFloat(foodGrams),
    });
    onLogged();
    onClose();
  }

  const inputCls = "w-full rounded-input px-3 py-2.5 text-sm outline-none transition-colors focus:ring-1 focus:ring-amber-600/50";
  const inputStyle = { background: '#2f2f2f', border: '1px solid #3d3d3d', color: '#ececec' };

  // Compute macro preview for selected food
  const previewMacros = (() => {
    if (!selectedFood) return null;
    if (selectedFood.isPreset) {
      const srv = parseFloat(foodGrams) || 1;
      return {
        cal: Math.round(selectedFood.calories * srv),
        prot: (selectedFood.protein * srv).toFixed(1),
        carb: (selectedFood.carbs * srv).toFixed(1),
        fat: (selectedFood.fat * srv).toFixed(1),
      };
    } else {
      const g = parseFloat(foodGrams) || 100;
      const ratio = g / 100;
      return {
        cal: Math.round((selectedFood as Food).calories_per_100g * ratio),
        prot: (selectedFood.protein * ratio).toFixed(1),
        carb: (selectedFood.carbs * ratio).toFixed(1),
        fat: (selectedFood.fat * ratio).toFixed(1),
      };
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#1a1a1a' }}>
      {/* Header */}
      <div className="flex items-center px-4 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', borderBottom: '1px solid #3d3d3d' }}>
        <h2 className="font-bold text-lg flex-1" style={{ fontFamily: 'Plus Jakarta Sans', color: '#ececec' }}>Log Food</h2>
        <button
          className="active-scale p-2 rounded-xl"
          style={{ background: '#242424' }}
          onClick={onClose}
        >
          <X size={18} color="#ececec" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {/* Meal selector */}
        <div className="flex gap-2 mt-4 mb-5">
          {MEALS.map(m => (
            <button
              key={m.key}
              onClick={() => setMeal(m.key)}
              className="active-scale flex-1 py-2 rounded-pill text-xs font-semibold transition-all duration-200"
              style={{
                background: meal === m.key ? '#d97706' : '#242424',
                color: meal === m.key ? '#1a1a1a' : '#9b9b9b',
                border: '1px solid ' + (meal === m.key ? '#d97706' : '#3d3d3d'),
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-card" style={{ background: '#242424' }}>
          {[
            { id: 'ai' as Tab,          label: '✨ AI'    },
            { id: 'search' as Tab,      label: '🔍 Search' },
            { id: 'barcode' as Tab,     label: '📷 Scan'   },
            { id: 'restaurants' as Tab, label: '🏪 Eats'   },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="active-scale flex-1 py-2 rounded-input text-xs font-semibold transition-all duration-200"
              style={{
                background: tab === t.id ? '#3d3d3d' : 'transparent',
                color: tab === t.id ? '#ececec' : '#9b9b9b',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* AI Tab */}
        {tab === 'ai' && (
          <div className="space-y-4">
            {!isAiConfigured() && (
              <div className="rounded-card p-4 text-center" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
                <p className="text-sm" style={{ color: '#9b9b9b' }}>
                  AI meal parsing is not configured. Please contact the app administrator.
                </p>
              </div>
            )}
            {isAiConfigured() && (
              <>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#9b9b9b' }}>Describe your meal</label>
                  <textarea
                    className={`${inputCls} min-h-[100px] resize-none`}
                    style={inputStyle}
                    placeholder="e.g. 2 scrambled eggs on sourdough toast with butter, and a flat white"
                    value={aiText}
                    onChange={e => setAiText(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleAIParse}
                  disabled={aiLoading}
                  className="active-scale w-full py-3 rounded-input font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{ background: aiLoading ? '#3d3d3d' : '#d97706', color: aiLoading ? '#9b9b9b' : '#1a1a1a' }}
                >
                  {aiLoading
                    ? <><Loader2 size={16} className="animate-spin" /> Parsing...</>
                    : <><Sparkles size={16} /> Parse with AI</>
                  }
                </button>
                {aiError && <p className="text-sm text-center" style={{ color: '#ef4444' }}>{aiError}</p>}

                {/* Parsed items */}
                {aiItems.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold" style={{ color: '#9b9b9b' }}>
                      Found {aiItems.length} item{aiItems.length > 1 ? 's' : ''} — edit if needed:
                    </p>
                    {aiItems.map((item, i) => (
                      <div key={i} className="rounded-card p-3 space-y-2.5" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
                        <input
                          className={inputCls}
                          style={inputStyle}
                          value={item.name}
                          onChange={e => updateAIItem(i, 'name', e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            className="rounded-input px-3 py-2 text-sm outline-none w-24 font-tabular"
                            style={inputStyle}
                            type="number"
                            inputMode="decimal"
                            value={item.quantity_g}
                            onChange={e => updateAIItem(i, 'quantity_g', e.target.value)}
                          />
                          <span className="text-xs" style={{ color: '#9b9b9b' }}>g</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                          {[
                            { label: 'Protein', value: `${item.protein_g.toFixed(1)}g`, color: '#60a5fa' },
                            { label: 'Carbs',   value: `${item.carbs_g.toFixed(1)}g`,   color: '#f97316' },
                            { label: 'Fat',     value: `${item.fat_g.toFixed(1)}g`,     color: '#facc15' },
                            { label: 'Calories',value: `${Math.round(item.calories)}`,  color: '#d97706' },
                          ].map(m => (
                            <div key={m.label} className="rounded-input py-1.5 text-center" style={{ background: '#2f2f2f' }}>
                              <p className="text-xs font-bold font-tabular leading-tight" style={{ color: m.color }}>{m.value}</p>
                              <p className="text-[10px] mt-0.5" style={{ color: '#6b6b6b' }}>{m.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={logAIItems}
                      className="active-scale w-full py-3 rounded-input font-semibold text-sm"
                      style={{ background: '#d97706', color: '#1a1a1a' }}
                    >
                      Add {aiItems.length} item{aiItems.length > 1 ? 's' : ''} to {meal}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Search Tab */}
        {tab === 'search' && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9b9b9b' }} />
              <input
                className={`${inputCls} pl-8`}
                style={inputStyle}
                placeholder="Search foods..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSelectedFood(null); }}
                autoFocus
              />
            </div>

            {/* Selected food detail */}
            {selectedFood && previewMacros && (
              <div className="rounded-card p-4 space-y-3" style={{ background: '#242424', border: '1px solid #d97706' }}>
                <p className="font-semibold text-sm" style={{ color: '#ececec' }}>{selectedFood.name}</p>
                <div className="flex gap-2 items-center">
                  <input
                    className={`${inputCls} w-28`}
                    style={inputStyle}
                    type="number"
                    inputMode="decimal"
                    value={foodGrams}
                    onChange={e => setFoodGrams(e.target.value)}
                  />
                  <span className="text-xs" style={{ color: '#9b9b9b' }}>
                    {selectedFood.isPreset ? 'servings' : 'grams'}
                  </span>
                </div>
                <div className="flex gap-3 text-xs font-tabular flex-wrap">
                  <span style={{ color: '#d97706' }}>{previewMacros.cal} kcal</span>
                  <span style={{ color: '#60a5fa' }}>P {previewMacros.prot}g</span>
                  <span style={{ color: '#f97316' }}>C {previewMacros.carb}g</span>
                  <span style={{ color: '#facc15' }}>F {previewMacros.fat}g</span>
                </div>
                <button
                  onClick={logSelectedFood}
                  className="active-scale w-full py-2.5 rounded-input text-sm font-semibold"
                  style={{ background: '#d97706', color: '#1a1a1a' }}
                >
                  Add to {meal}
                </button>
              </div>
            )}

            {/* Food search results */}
            {filteredFoods.length > 0 && (
              <div>
                <p className="text-xs mb-2" style={{ color: '#9b9b9b' }}>Foods</p>
                <div className="rounded-card overflow-hidden" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
                  {filteredFoods.map((food, i) => (
                    <button
                      key={food.id}
                      className="active-scale w-full flex items-center px-4 py-3 text-left transition-colors"
                      style={{ borderTop: i > 0 ? '1px solid #3d3d3d' : 'none' }}
                      onClick={() => selectFood(food, false)}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: '#ececec' }}>{food.name}</p>
                        <p className="text-xs" style={{ color: '#9b9b9b' }}>{food.calories_per_100g} kcal / 100g</p>
                      </div>
                      <ChevronRight size={14} style={{ color: '#9b9b9b' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Eating out presets */}
            <div>
              <p className="text-xs mb-2" style={{ color: '#9b9b9b' }}>
                {searchQuery.length > 1 ? 'Eating Out Matches' : 'Eating Out Presets'}
              </p>
              {filteredPresets.length === 0 ? (
                <p className="text-sm" style={{ color: '#9b9b9b' }}>No presets found</p>
              ) : (
                <div className="rounded-card overflow-hidden" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
                  {filteredPresets.map((preset, i) => (
                    <button
                      key={preset.id}
                      className="active-scale w-full flex items-center px-4 py-3 text-left transition-colors"
                      style={{ borderTop: i > 0 ? '1px solid #3d3d3d' : 'none' }}
                      onClick={() => selectFood(preset, true)}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: '#ececec' }}>{preset.name}</p>
                        <p className="text-xs" style={{ color: '#9b9b9b' }}>{preset.calories} kcal · {preset.serving_desc}</p>
                      </div>
                      <ChevronRight size={14} style={{ color: '#9b9b9b' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Barcode Tab */}
        {tab === 'barcode' && (
          <BarcodeScanner
            meal={meal}
            onMealChange={setMeal}
            onLogged={() => { onLogged(); onClose(); }}
          />
        )}

        {/* Restaurants Tab */}
        {tab === 'restaurants' && (
          <RestaurantsTab
            meal={meal}
            onMealChange={setMeal}
            onLogged={() => { onLogged(); onClose(); }}
          />
        )}
      </div>
    </div>
  );
}
