import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronRight, X, Search, Minus, BookOpen } from 'lucide-react';
import type { Recipe, RecipeIngredient, Food, MealType } from '../types';
import { getRecipes, saveRecipe, deleteRecipe, getFoods, addLogEntry } from '../utils/storage';

interface RecipeMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

function computeRecipeTotals(ingredients: RecipeIngredient[], foods: Food[]): RecipeMacros {
  return ingredients.reduce((acc, ing) => {
    const food = foods.find(f => f.id === ing.food_id);
    if (!food) return acc;
    const ratio = ing.quantity_g / 100;
    return {
      calories: acc.calories + food.calories_per_100g * ratio,
      protein: acc.protein + food.protein * ratio,
      carbs: acc.carbs + food.carbs * ratio,
      fat: acc.fat + food.fat * ratio,
      fiber: acc.fiber + food.fiber * ratio,
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
}

const MEALS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snacks', label: 'Snacks' },
];

// Recipe Builder Modal
function RecipeBuilder({ recipe, onSave, onClose }: {
  recipe: Recipe | null;
  onSave: (r: Recipe) => void;
  onClose: () => void;
}) {
  const foods = getFoods();
  const [name, setName] = useState(recipe?.name || '');
  const [servings, setServings] = useState(recipe?.servings?.toString() || '1');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(recipe?.ingredients || []);
  const [ingSearch, setIngSearch] = useState('');
  const [ingGrams, setIngGrams] = useState<Record<string, string>>({});

  const filteredFoods = ingSearch.length > 1
    ? foods.filter(f => f.name.toLowerCase().includes(ingSearch.toLowerCase())).slice(0, 8)
    : [];

  const totals = computeRecipeTotals(ingredients, foods);
  const servingsNum = parseFloat(servings) || 1;
  const perServing = {
    calories: totals.calories / servingsNum,
    protein: totals.protein / servingsNum,
    carbs: totals.carbs / servingsNum,
    fat: totals.fat / servingsNum,
    fiber: totals.fiber / servingsNum,
  };

  function addIngredient(food: Food) {
    const grams = parseFloat(ingGrams[food.id] || '100');
    const existing = ingredients.findIndex(i => i.food_id === food.id);
    if (existing >= 0) {
      const updated = [...ingredients];
      updated[existing] = { ...updated[existing], quantity_g: updated[existing].quantity_g + grams };
      setIngredients(updated);
    } else {
      setIngredients(prev => [...prev, { food_id: food.id, food_name: food.name, quantity_g: grams }]);
    }
    setIngSearch('');
  }

  function removeIngredient(foodId: string) {
    setIngredients(prev => prev.filter(i => i.food_id !== foodId));
  }

  function updateIngredientGrams(foodId: string, grams: string) {
    setIngredients(prev => prev.map(i =>
      i.food_id === foodId ? { ...i, quantity_g: parseFloat(grams) || 0 } : i
    ));
  }

  function handleSave() {
    if (!name.trim() || ingredients.length === 0) return;
    onSave({
      id: recipe?.id || crypto.randomUUID(),
      name: name.trim(),
      servings: servingsNum,
      ingredients,
      created_at: recipe?.created_at || new Date().toISOString(),
    });
  }

  const inputCls = "w-full rounded-input px-3 py-2.5 text-sm outline-none";
  const inputStyle = { background: '#2f2f2f', border: '1px solid #3d3d3d', color: '#ececec' };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#1a1a1a' }}>
      <div className="flex items-center px-4 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', borderBottom: '1px solid #3d3d3d' }}>
        <h2 className="font-bold text-lg flex-1" style={{ fontFamily: 'Plus Jakarta Sans', color: '#ececec' }}>
          {recipe ? 'Edit Recipe' : 'New Recipe'}
        </h2>
        <button className="active-scale p-2 rounded-xl" style={{ background: '#242424' }} onClick={onClose}>
          <X size={18} color="#ececec" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {/* Name & Servings */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#9b9b9b' }}>Recipe Name</label>
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="e.g. Chicken Fried Rice"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#9b9b9b' }}>Servings</label>
            <input
              className={`${inputCls} w-24`}
              style={inputStyle}
              type="number"
              inputMode="decimal"
              min="1"
              value={servings}
              onChange={e => setServings(e.target.value)}
            />
          </div>
        </div>

        {/* Nutrition summary */}
        {ingredients.length > 0 && (
          <div className="mt-4 p-4 rounded-card" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: '#9b9b9b' }}>Per Serving ({servingsNum} total)</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Calories', val: Math.round(perServing.calories), color: '#d97706', unit: 'kcal' },
                { label: 'Protein', val: perServing.protein.toFixed(1), color: '#60a5fa', unit: 'g' },
                { label: 'Carbs', val: perServing.carbs.toFixed(1), color: '#f97316', unit: 'g' },
                { label: 'Fat', val: perServing.fat.toFixed(1), color: '#facc15', unit: 'g' },
                { label: 'Fiber', val: perServing.fiber.toFixed(1), color: '#a78bfa', unit: 'g' },
              ].map(m => (
                <div key={m.label} className="flex-1 min-w-[60px] text-center p-2 rounded-input" style={{ background: '#2f2f2f' }}>
                  <p className="text-xs font-bold font-tabular" style={{ color: m.color }}>{m.val}{m.unit}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#9b9b9b' }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add ingredient */}
        <div className="mt-4">
          <p className="text-xs font-semibold mb-2" style={{ color: '#9b9b9b' }}>Add Ingredients</p>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9b9b9b' }} />
            <input
              className={`${inputCls} pl-8`}
              style={inputStyle}
              placeholder="Search foods to add..."
              value={ingSearch}
              onChange={e => setIngSearch(e.target.value)}
            />
          </div>
          {filteredFoods.length > 0 && (
            <div className="mt-2 rounded-card overflow-hidden" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
              {filteredFoods.map((food, i) => (
                <div
                  key={food.id}
                  className="flex items-center gap-2 px-3 py-2.5"
                  style={{ borderTop: i > 0 ? '1px solid #3d3d3d' : 'none' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#ececec' }}>{food.name}</p>
                    <p className="text-xs" style={{ color: '#9b9b9b' }}>{food.calories_per_100g} kcal/100g</p>
                  </div>
                  <input
                    className="w-16 rounded-input px-2 py-1.5 text-xs outline-none text-center"
                    style={{ background: '#2f2f2f', border: '1px solid #3d3d3d', color: '#ececec' }}
                    type="number"
                    inputMode="decimal"
                    placeholder="100"
                    value={ingGrams[food.id] || ''}
                    onChange={e => setIngGrams(prev => ({ ...prev, [food.id]: e.target.value }))}
                  />
                  <span className="text-xs" style={{ color: '#9b9b9b' }}>g</span>
                  <button
                    onClick={() => addIngredient(food)}
                    className="active-scale p-1.5 rounded-lg"
                    style={{ background: '#d97706' }}
                  >
                    <Plus size={14} color="#1a1a1a" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ingredient list */}
        {ingredients.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold mb-2" style={{ color: '#9b9b9b' }}>Ingredients ({ingredients.length})</p>
            <div className="rounded-card overflow-hidden" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
              {ingredients.map((ing, i) => {
                const food = foods.find(f => f.id === ing.food_id);
                const cal = food ? Math.round(food.calories_per_100g * ing.quantity_g / 100) : 0;
                return (
                  <div
                    key={ing.food_id}
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ borderTop: i > 0 ? '1px solid #3d3d3d' : 'none' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#ececec' }}>{ing.food_name}</p>
                      <p className="text-xs" style={{ color: '#d97706' }}>{cal} kcal</p>
                    </div>
                    <input
                      className="w-16 rounded-input px-2 py-1.5 text-xs outline-none text-center"
                      style={{ background: '#2f2f2f', border: '1px solid #3d3d3d', color: '#ececec' }}
                      type="number"
                      inputMode="decimal"
                      value={ing.quantity_g}
                      onChange={e => updateIngredientGrams(ing.food_id, e.target.value)}
                    />
                    <span className="text-xs" style={{ color: '#9b9b9b' }}>g</span>
                    <button
                      onClick={() => removeIngredient(ing.food_id)}
                      className="active-scale p-1.5 rounded-lg"
                      style={{ background: '#3d3d3d', color: '#9b9b9b' }}
                    >
                      <Minus size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!name.trim() || ingredients.length === 0}
          className="active-scale w-full py-3 rounded-input font-semibold text-sm mt-6"
          style={{
            background: name.trim() && ingredients.length > 0 ? '#d97706' : '#3d3d3d',
            color: name.trim() && ingredients.length > 0 ? '#1a1a1a' : '#9b9b9b',
          }}
        >
          {recipe ? 'Update Recipe' : 'Save Recipe'}
        </button>
      </div>
    </div>
  );
}

// Recipe Detail Modal
function RecipeDetail({ recipe, onClose, onDelete, onEdit }: {
  recipe: Recipe;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const foods = getFoods();
  const [meal, setMeal] = useState<MealType>('dinner');
  const [servingsToLog, setServingsToLog] = useState('1');
  const [logged, setLogged] = useState(false);

  const totals = computeRecipeTotals(recipe.ingredients, foods);
  const perServing = {
    calories: totals.calories / recipe.servings,
    protein: totals.protein / recipe.servings,
    carbs: totals.carbs / recipe.servings,
    fat: totals.fat / recipe.servings,
    fiber: totals.fiber / recipe.servings,
  };

  async function handleLog() {
    const srv = parseFloat(servingsToLog) || 1;
    const today = new Date().toISOString().slice(0, 10);
    await addLogEntry({
      id: crypto.randomUUID(),
      date: today,
      meal_type: meal,
      entry_type: 'recipe',
      name: `${recipe.name} (${srv > 1 ? srv + ' servings' : '1 serving'})`,
      calories: Math.round(perServing.calories * srv),
      protein: parseFloat((perServing.protein * srv).toFixed(1)),
      carbs: parseFloat((perServing.carbs * srv).toFixed(1)),
      fat: parseFloat((perServing.fat * srv).toFixed(1)),
      fiber: parseFloat((perServing.fiber * srv).toFixed(1)),
    });
    setLogged(true);
    setTimeout(onClose, 800);
  }

  const inputStyle = { background: '#2f2f2f', border: '1px solid #3d3d3d', color: '#ececec' };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#1a1a1a' }}>
      <div className="flex items-center px-4 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', borderBottom: '1px solid #3d3d3d' }}>
        <h2 className="font-bold text-lg flex-1 truncate" style={{ fontFamily: 'Plus Jakarta Sans', color: '#ececec' }}>{recipe.name}</h2>
        <button className="active-scale p-2 rounded-xl mr-2" style={{ background: '#242424', color: '#ececec' }} onClick={onEdit}>
          <span className="text-xs font-semibold">Edit</span>
        </button>
        <button className="active-scale p-2 rounded-xl" style={{ background: '#242424' }} onClick={onClose}>
          <X size={18} color="#ececec" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {/* Per-serving macros */}
        <div className="mt-4 p-4 rounded-card" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#9b9b9b' }}>Per Serving ({recipe.servings} servings total)</p>
          <div className="flex gap-2">
            {[
              { label: 'kcal', val: Math.round(perServing.calories), color: '#d97706' },
              { label: 'protein', val: perServing.protein.toFixed(1) + 'g', color: '#60a5fa' },
              { label: 'carbs', val: perServing.carbs.toFixed(1) + 'g', color: '#f97316' },
              { label: 'fat', val: perServing.fat.toFixed(1) + 'g', color: '#facc15' },
              { label: 'fiber', val: perServing.fiber.toFixed(1) + 'g', color: '#a78bfa' },
            ].map(m => (
              <div key={m.label} className="flex-1 text-center p-2 rounded-input" style={{ background: '#2f2f2f' }}>
                <p className="text-xs font-bold font-tabular" style={{ color: m.color }}>{m.val}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#9b9b9b' }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Log this recipe */}
        <div className="mt-4 p-4 rounded-card space-y-3" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
          <p className="text-sm font-semibold" style={{ color: '#ececec' }}>Log this Recipe</p>
          <div className="flex gap-2">
            {MEALS.map(m => (
              <button
                key={m.key}
                onClick={() => setMeal(m.key)}
                className="active-scale flex-1 py-1.5 rounded-pill text-xs font-semibold"
                style={{
                  background: meal === m.key ? '#d97706' : '#2f2f2f',
                  color: meal === m.key ? '#1a1a1a' : '#9b9b9b',
                  border: '1px solid ' + (meal === m.key ? '#d97706' : '#3d3d3d'),
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: '#9b9b9b' }}>Servings:</span>
            <input
              className="w-20 rounded-input px-3 py-2 text-sm outline-none"
              style={inputStyle}
              type="number"
              inputMode="decimal"
              min="0.25"
              step="0.25"
              value={servingsToLog}
              onChange={e => setServingsToLog(e.target.value)}
            />
          </div>
          <button
            onClick={handleLog}
            disabled={logged}
            className="active-scale w-full py-3 rounded-input font-semibold text-sm"
            style={{ background: logged ? '#b45309' : '#d97706', color: '#1a1a1a' }}
          >
            {logged ? '✓ Logged!' : `Log to ${meal}`}
          </button>
        </div>

        {/* Ingredients */}
        <div className="mt-4">
          <p className="text-xs font-semibold mb-2" style={{ color: '#9b9b9b' }}>Ingredients</p>
          <div className="rounded-card overflow-hidden" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
            {recipe.ingredients.map((ing, i) => {
              const food = foods.find(f => f.id === ing.food_id);
              const cal = food ? Math.round(food.calories_per_100g * ing.quantity_g / 100) : 0;
              return (
                <div
                  key={ing.food_id}
                  className="flex items-center px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid #3d3d3d' : 'none' }}
                >
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: '#ececec' }}>{ing.food_name}</p>
                    <p className="text-xs" style={{ color: '#9b9b9b' }}>{cal} kcal</p>
                  </div>
                  <p className="text-sm font-tabular font-medium" style={{ color: '#ececec' }}>{ing.quantity_g}g</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="active-scale w-full py-3 rounded-input font-semibold text-sm mt-6 flex items-center justify-center gap-2"
          style={{ background: '#242424', border: '1px solid #3d3d3d', color: '#ef4444' }}
        >
          <Trash2 size={15} />
          Delete Recipe
        </button>
      </div>
    </div>
  );
}

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const foods = getFoods();

  const load = async () => {
    setLoading(true);
    setRecipes(await getRecipes());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  async function handleSave(recipe: Recipe) {
    await saveRecipe(recipe);
    await load();
    setShowBuilder(false);
    setEditingRecipe(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this recipe?')) return;
    await deleteRecipe(id);
    await load();
    setViewingRecipe(null);
  }

  function handleEdit(recipe: Recipe) {
    setViewingRecipe(null);
    setEditingRecipe(recipe);
    setShowBuilder(true);
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#1a1a1a' }}>

      {/* ── Fixed header ──────────────────────────────────────── */}
      <div
        className="shrink-0 px-4 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)', borderBottom: '1px solid #2a2a2a' }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#ececec' }}>Recipes</h1>
          <button
            onClick={() => { setEditingRecipe(null); setShowBuilder(true); }}
            className="active-scale flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-semibold"
            style={{ background: '#d97706', color: '#1a1a1a' }}
          >
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────── */}
      <div className="scroll-area flex-1 px-4 py-5">
      <div className="max-w-lg mx-auto">

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 rounded-card animate-pulse" style={{ background: '#242424' }} />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen size={48} style={{ color: '#3d3d3d' }} className="mb-4" />
          <p className="font-semibold text-lg mb-2" style={{ color: '#ececec' }}>No recipes yet</p>
          <p className="text-sm mb-6" style={{ color: '#9b9b9b' }}>Create your first recipe to track meals you make regularly</p>
          <button
            onClick={() => { setEditingRecipe(null); setShowBuilder(true); }}
            className="active-scale px-6 py-3 rounded-pill font-semibold text-sm"
            style={{ background: '#d97706', color: '#1a1a1a' }}
          >
            Create Recipe
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map(recipe => {
            const totals = computeRecipeTotals(recipe.ingredients, foods);
            const perServing = {
              calories: totals.calories / recipe.servings,
              protein: totals.protein / recipe.servings,
            };
            return (
              <button
                key={recipe.id}
                className="active-scale w-full rounded-card p-4 text-left"
                style={{ background: '#242424', border: '1px solid #3d3d3d' }}
                onClick={() => setViewingRecipe(recipe)}
              >
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: '#ececec' }}>{recipe.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9b9b9b' }}>
                      {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''} · {recipe.ingredients.length} ingredients
                    </p>
                  </div>
                  <div className="text-right mr-3">
                    <p className="text-sm font-bold font-tabular" style={{ color: '#d97706' }}>
                      {Math.round(perServing.calories)} kcal
                    </p>
                    <p className="text-xs" style={{ color: '#60a5fa' }}>P {perServing.protein.toFixed(1)}g / serving</p>
                  </div>
                  <ChevronRight size={16} style={{ color: '#9b9b9b' }} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      </div>{/* max-w-lg */}
      </div>{/* scroll-area */}

      {/* Modals — fixed overlays, unaffected by shell layout */}
      {showBuilder && (
        <RecipeBuilder
          recipe={editingRecipe}
          onSave={handleSave}
          onClose={() => { setShowBuilder(false); setEditingRecipe(null); }}
        />
      )}

      {viewingRecipe && (
        <RecipeDetail
          recipe={viewingRecipe}
          onClose={() => setViewingRecipe(null)}
          onDelete={() => handleDelete(viewingRecipe.id)}
          onEdit={() => handleEdit(viewingRecipe)}
        />
      )}
    </div>
  );
}
