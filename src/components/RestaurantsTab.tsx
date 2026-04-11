import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { RESTAURANT_DB } from '../data/restaurantDB';
import type { RestaurantItem } from '../data/restaurantDB';
import type { MealType } from '../types';
import { addLogEntry, todayStr } from '../utils/storage';

interface TaggedItem extends RestaurantItem {
  brand: string;
  emoji: string;
}

interface Props {
  meal: MealType;
  onMealChange: (m: MealType) => void;
  onLogged: () => void;
}

const MEALS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch',     label: 'Lunch'     },
  { key: 'dinner',    label: 'Dinner'    },
  { key: 'snacks',    label: 'Snacks'    },
];

const inputStyle = { background: '#2f2f2f', border: '1px solid #3d3d3d', color: '#ececec' };

export default function RestaurantsTab({ meal, onMealChange, onLogged }: Props) {
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedKey, setSelectedKey]   = useState<string | null>(null); // `${brand}::${name}`
  const [servings, setServings]         = useState(1);

  // Flat search/filter results (null = grouped "All" mode)
  const flatItems = useMemo<TaggedItem[] | null>(() => {
    if (searchQuery.length > 1) {
      const q = searchQuery.toLowerCase();
      return RESTAURANT_DB.flatMap(b =>
        b.items
          .filter(it => it.name.toLowerCase().includes(q))
          .map(it => ({ ...it, brand: b.brand, emoji: b.emoji }))
      );
    }
    if (selectedBrand) {
      const b = RESTAURANT_DB.find(b => b.brand === selectedBrand);
      return b ? b.items.map(it => ({ ...it, brand: b.brand, emoji: b.emoji })) : [];
    }
    return null;
  }, [searchQuery, selectedBrand]);

  function itemKey(item: TaggedItem) { return `${item.brand}::${item.name}`; }

  function handleSelect(item: TaggedItem) {
    const key = itemKey(item);
    if (selectedKey === key) { setSelectedKey(null); return; }
    setSelectedKey(key);
    setServings(1);
  }

  function adjustServings(delta: number) {
    setServings(s => Math.max(0.5, Math.round((s + delta) * 2) / 2));
  }

  async function handleAdd(item: TaggedItem) {
    await addLogEntry({
      id: crypto.randomUUID(),
      date: todayStr(),
      meal_type: meal,
      entry_type: 'food',
      name: `${item.name} (${item.brand})`,
      calories: Math.round(item.cal * servings),
      protein:  parseFloat((item.protein * servings).toFixed(1)),
      carbs:    parseFloat((item.carbs   * servings).toFixed(1)),
      fat:      parseFloat((item.fat     * servings).toFixed(1)),
      fiber:    0,
      quantity: servings,
    });
    setSelectedKey(null);
    onLogged();
  }

  // ── Item row ──────────────────────────────────────────────────────
  function ItemRow({ item, showBrand }: { item: TaggedItem; showBrand: boolean }) {
    const key       = itemKey(item);
    const expanded  = selectedKey === key;

    return (
      <div>
        {/* Summary row */}
        <button
          className="active-scale w-full text-left px-4 py-3 transition-colors"
          style={{ background: expanded ? 'rgba(217,119,6,0.07)' : 'transparent' }}
          onClick={() => handleSelect(item)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug" style={{ color: '#ececec' }}>{item.name}</p>
              {showBrand && (
                <p className="text-[10px] mt-0.5" style={{ color: '#6b6b6b' }}>
                  {item.emoji} {item.brand}
                </p>
              )}
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded font-tabular" style={{ background: '#2f2f2f', color: '#60a5fa' }}>P {item.protein}g</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-tabular" style={{ background: '#2f2f2f', color: '#f97316' }}>C {item.carbs}g</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-tabular" style={{ background: '#2f2f2f', color: '#facc15' }}>F {item.fat}g</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-bold font-tabular" style={{ color: '#d97706' }}>{item.cal}</span>
              <p className="text-[10px] mt-0.5" style={{ color: '#6b6b6b' }}>kcal</p>
            </div>
          </div>
        </button>

        {/* Expanded panel */}
        {expanded && (
          <div className="mx-3 mb-3 p-3 rounded-card space-y-3" style={{ background: '#1a1a1a', border: '1px solid #3d3d3d' }}>
            {/* Servings stepper */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: '#9b9b9b' }}>Servings</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjustServings(-0.5)}
                  className="active-scale w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: '#2f2f2f', color: '#ececec' }}
                >−</button>
                <span className="w-10 text-center text-sm font-bold font-tabular" style={{ color: '#ececec' }}>
                  {servings % 1 === 0 ? servings : servings.toFixed(1)}
                </span>
                <button
                  onClick={() => adjustServings(0.5)}
                  className="active-scale w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: '#2f2f2f', color: '#ececec' }}
                >+</button>
              </div>
            </div>

            {/* Live macro grid */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Cal',     value: String(Math.round(item.cal     * servings)),             color: '#d97706' },
                { label: 'Protein', value: `${(item.protein * servings).toFixed(1)}g`,              color: '#60a5fa' },
                { label: 'Carbs',   value: `${(item.carbs   * servings).toFixed(1)}g`,              color: '#f97316' },
                { label: 'Fat',     value: `${(item.fat     * servings).toFixed(1)}g`,              color: '#facc15' },
              ].map(m => (
                <div key={m.label} className="text-center py-2 rounded-input" style={{ background: '#2f2f2f' }}>
                  <p className="text-xs font-bold font-tabular leading-tight" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#6b6b6b' }}>{m.label}</p>
                </div>
              ))}
            </div>

            {/* Meal selector */}
            <div className="flex gap-1">
              {MEALS.map(m => (
                <button
                  key={m.key}
                  onClick={() => onMealChange(m.key)}
                  className="active-scale flex-1 py-1.5 rounded-pill text-[11px] font-semibold transition-all"
                  style={{
                    background: meal === m.key ? '#d97706' : '#2f2f2f',
                    color:      meal === m.key ? '#1a1a1a' : '#9b9b9b',
                    border: '1px solid ' + (meal === m.key ? '#d97706' : '#3d3d3d'),
                  }}
                >{m.label}</button>
              ))}
            </div>

            {/* Add button */}
            <button
              onClick={() => handleAdd(item)}
              className="active-scale w-full py-2.5 rounded-input text-sm font-bold"
              style={{ background: '#d97706', color: '#1a1a1a' }}
            >
              Add to {meal.charAt(0).toUpperCase() + meal.slice(1)}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9b9b9b' }} />
        <input
          className="w-full rounded-input pl-8 pr-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-600/50"
          style={inputStyle}
          placeholder="Search all restaurants…"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setSelectedKey(null); }}
        />
      </div>

      {/* Brand pills */}
      <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button
          onClick={() => { setSelectedBrand(null); setSelectedKey(null); }}
          className="active-scale shrink-0 px-3 py-1.5 rounded-pill text-xs font-semibold transition-all"
          style={{
            background: !selectedBrand && !searchQuery ? '#d97706' : '#242424',
            color:      !selectedBrand && !searchQuery ? '#1a1a1a' : '#9b9b9b',
            border: '1px solid ' + (!selectedBrand && !searchQuery ? '#d97706' : '#3d3d3d'),
          }}
        >All</button>
        {RESTAURANT_DB.map(b => (
          <button
            key={b.brand}
            onClick={() => { setSelectedBrand(b.brand); setSelectedKey(null); setSearchQuery(''); }}
            className="active-scale shrink-0 px-3 py-1.5 rounded-pill text-xs font-semibold transition-all whitespace-nowrap"
            style={{
              background: selectedBrand === b.brand ? '#d97706' : '#242424',
              color:      selectedBrand === b.brand ? '#1a1a1a' : '#9b9b9b',
              border: '1px solid ' + (selectedBrand === b.brand ? '#d97706' : '#3d3d3d'),
            }}
          >{b.emoji} {b.brand}</button>
        ))}
      </div>

      {/* Item list */}
      <div className="rounded-card overflow-hidden" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
        {flatItems !== null ? (
          // Search results or single-brand flat list
          flatItems.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#9b9b9b' }}>No items found</p>
          ) : (
            flatItems.map((item, i) => (
              <div key={itemKey(item)} style={{ borderTop: i > 0 ? '1px solid #3d3d3d' : 'none' }}>
                <ItemRow item={item} showBrand={!selectedBrand} />
              </div>
            ))
          )
        ) : (
          // Grouped "All" mode
          RESTAURANT_DB.map((brand, bi) => (
            <div key={brand.brand} style={{ borderTop: bi > 0 ? '1px solid #3d3d3d' : 'none' }}>
              {/* Brand header */}
              <div className="px-4 py-2 flex items-center gap-2 sticky top-0" style={{ background: '#1a1a1a' }}>
                <span className="text-base">{brand.emoji}</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9b9b9b' }}>{brand.brand}</span>
              </div>
              {/* Items */}
              {brand.items.map((item) => {
                const tagged: TaggedItem = { ...item, brand: brand.brand, emoji: brand.emoji };
                return (
                  <div key={item.name} style={{ borderTop: '1px solid #3d3d3d' }}>
                    <ItemRow item={tagged} showBrand={false} />
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
