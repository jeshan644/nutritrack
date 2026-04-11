import { useState, useRef, useCallback } from 'react';
import { useZxing } from 'react-zxing';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Search, Loader2, RotateCcw } from 'lucide-react';
import type { MealType } from '../types';
import { addLogEntry, todayStr } from '../utils/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NutrientPer100 {
  calories: number; protein: number; carbs: number; fat: number; fiber: number;
}
interface ScannedProduct {
  name: string;
  per100: NutrientPer100;
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

// ─── Open Food Facts lookup ────────────────────────────────────────────────────

async function lookupBarcode(barcode: string): Promise<ScannedProduct | null> {
  // Try Australian database first, fall back to world
  const urls = [
    `https://au.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_en,nutriments`,
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_en,nutriments`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      if (data.status !== 1 || !data.product) continue;

      const p = data.product;
      const n = p.nutriments ?? {};
      const name = (p.product_name_en || p.product_name || '').trim();
      if (!name) continue;

      const kcal = n['energy-kcal_100g']
        ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0);

      return {
        name,
        per100: {
          calories: Math.round(kcal),
          protein:  Math.round((n['proteins_100g']      ?? 0) * 10) / 10,
          carbs:    Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
          fat:      Math.round((n['fat_100g']            ?? 0) * 10) / 10,
          fiber:    Math.round((n['fiber_100g']          ?? 0) * 10) / 10,
        },
      };
    } catch { continue; }
  }
  return null;
}

// ─── Live scanner component ────────────────────────────────────────────────────

function LiveScanner({ onScan }: { onScan: (barcode: string) => void }) {
  const [permissionDenied, setPermissionDenied] = useState(false);

  const { ref } = useZxing({
    onResult(result) {
      const barcode = result.getText();
      if (barcode) {
        navigator.vibrate?.(50);
        onScan(barcode);
      }
    },
    onError(error) {
      const msg = String(error);
      if (msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('denied')) {
        setPermissionDenied(true);
      }
    },
    constraints: {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
    timeBetweenDecodingAttempts: 150,
  });

  if (permissionDenied) {
    return (
      <div className="rounded-card p-6 text-center space-y-3" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
        <p className="text-3xl">📷</p>
        <p className="text-sm font-semibold" style={{ color: '#ececec' }}>Camera access needed</p>
        <div className="text-xs space-y-1 text-left rounded-input p-3" style={{ background: '#2f2f2f' }}>
          <p style={{ color: '#9b9b9b' }}><span style={{ color: '#ececec' }}>iPhone:</span> Settings → Safari → Camera → Allow</p>
          <p style={{ color: '#9b9b9b' }}><span style={{ color: '#ececec' }}>Android:</span> Settings → Chrome → Permissions → Camera → Allow</p>
        </div>
        <button
          onClick={() => { setPermissionDenied(false); window.location.reload(); }}
          className="active-scale w-full py-2.5 rounded-input text-sm font-semibold"
          style={{ background: '#d97706', color: '#1a1a1a' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <video
        ref={ref}
        style={{
          width: '100%',
          height: '260px',
          objectFit: 'cover',
          borderRadius: '12px',
          background: '#000',
          display: 'block',
        }}
      />
      {/* Dim overlay with cutout illusion */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        borderRadius: '12px',
        pointerEvents: 'none',
        WebkitMaskImage: 'radial-gradient(ellipse 210px 130px at 50% 50%, transparent 98%, black 100%)',
        maskImage: 'radial-gradient(ellipse 210px 130px at 50% 50%, transparent 98%, black 100%)',
      }} />
      {/* Green guide box */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '200px', height: '120px',
        border: '2px solid #4ade80',
        borderRadius: '8px',
        pointerEvents: 'none',
      }}>
        {/* Corner markers */}
        {[
          { top: -2, left: -2, borderTop: '3px solid #4ade80', borderLeft: '3px solid #4ade80' },
          { top: -2, right: -2, borderTop: '3px solid #4ade80', borderRight: '3px solid #4ade80' },
          { bottom: -2, left: -2, borderBottom: '3px solid #4ade80', borderLeft: '3px solid #4ade80' },
          { bottom: -2, right: -2, borderBottom: '3px solid #4ade80', borderRight: '3px solid #4ade80' },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: 16, height: 16, borderRadius: 2, border: 'none', ...s }} />
        ))}
        {/* Animated scan line */}
        <div style={{
          position: 'absolute',
          top: '50%', left: 0, right: 0,
          height: '2px',
          background: 'linear-gradient(to right, transparent, #4ade80, transparent)',
          animation: 'scanLine 2s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      </div>
      {/* Label */}
      <p className="text-xs text-center mt-2" style={{ color: '#9b9b9b' }}>
        Aim the green box at the barcode
      </p>
    </div>
  );
}

// ─── Main BarcodeScanner component ────────────────────────────────────────────

type LookupState = 'idle' | 'loading' | 'found' | 'not_found' | 'error';

export default function BarcodeScanner({ meal, onMealChange, onLogged }: Props) {
  const [lookupState, setLookupState] = useState<LookupState>('idle');
  const [product, setProduct]         = useState<ScannedProduct | null>(null);
  const [scannedCode, setScannedCode] = useState('');

  // Result editing
  const [editName, setEditName] = useState('');
  const [grams, setGrams]       = useState(100);

  // Photo fallback
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState('');

  // Manual entry
  const [manualCode, setManualCode] = useState('');

  const handleBarcode = useCallback(async (barcode: string) => {
    if (lookupState === 'loading') return;
    setScannedCode(barcode);
    setLookupState('loading');
    setPhotoError('');
    const result = await lookupBarcode(barcode);
    if (result) {
      setProduct(result);
      setEditName(result.name);
      setGrams(100);
      setLookupState('found');
    } else {
      setLookupState('not_found');
    }
  }, [lookupState]);

  // Photo capture handler
  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    setLookupState('loading');

    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });

      let barcode: string | null = null;

      // Try native BarcodeDetector first (Android Chrome)
      if ('BarcodeDetector' in window) {
        try {
          // @ts-expect-error BarcodeDetector not in TS lib
          const detector = new BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'],
          });
          const results = await detector.detect(img);
          if (results.length > 0) barcode = results[0].rawValue;
        } catch { /* fall through to ZXing */ }
      }

      // Fall back to @zxing/library
      if (!barcode) {
        const canvas  = document.createElement('canvas');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        const reader = new BrowserMultiFormatReader();
        try {
          const result = await reader.decodeFromImageElement(img);
          barcode = result.getText();
        } catch { /* no barcode found */ }
      }

      URL.revokeObjectURL(url);

      if (barcode) {
        await handleBarcode(barcode);
      } else {
        setLookupState('idle');
        setPhotoError('No barcode found in photo — try again or enter manually.');
      }
    } catch {
      setLookupState('idle');
      setPhotoError('Could not read the photo — try again.');
    }

    // Reset input so same file can be selected again
    if (photoInputRef.current) photoInputRef.current.value = '';
  }

  function calcNutrients() {
    if (!product) return { cal: 0, prot: 0, carb: 0, fat: 0, fiber: 0 };
    const r = grams / 100;
    return {
      cal:   Math.round(product.per100.calories * r),
      prot:  parseFloat((product.per100.protein  * r).toFixed(1)),
      carb:  parseFloat((product.per100.carbs    * r).toFixed(1)),
      fat:   parseFloat((product.per100.fat      * r).toFixed(1)),
      fiber: parseFloat((product.per100.fiber    * r).toFixed(1)),
    };
  }

  async function handleAddToLog() {
    const n = calcNutrients();
    await addLogEntry({
      id:         crypto.randomUUID(),
      date:       todayStr(),
      meal_type:  meal,
      entry_type: 'food',
      name:       editName.trim() || product!.name,
      calories:   n.cal,
      protein:    n.prot,
      carbs:      n.carb,
      fat:        n.fat,
      fiber:      n.fiber,
      quantity:   grams,
    });
    onLogged();
  }

  function reset() {
    setLookupState('idle');
    setProduct(null);
    setScannedCode('');
    setManualCode('');
    setPhotoError('');
  }

  const n = calcNutrients();

  // ── Result card (shown after successful lookup) ──────────────────────────────
  if (lookupState === 'found' && product) {
    return (
      <div className="space-y-4">
        <div className="rounded-card p-4 space-y-3" style={{ background: '#242424', border: '1px solid #4ade80' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#2f2f2f', color: '#9b9b9b' }}>
              {scannedCode}
            </span>
            <button onClick={reset} className="active-scale ml-auto p-1.5 rounded-lg" style={{ background: '#3d3d3d', color: '#9b9b9b' }}>
              <RotateCcw size={13} />
            </button>
          </div>

          <input
            className="w-full rounded-input px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-600/50"
            style={inputStyle}
            value={editName}
            onChange={e => setEditName(e.target.value)}
          />

          {/* Grams stepper */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGrams(g => Math.max(10, g - 10))}
              className="active-scale w-10 h-10 rounded-input text-lg font-bold flex items-center justify-center"
              style={{ background: '#3d3d3d', color: '#ececec' }}
            >−</button>
            <div className="flex-1 text-center">
              <input
                className="w-24 rounded-input px-3 py-2 text-sm outline-none text-center font-tabular"
                style={inputStyle}
                type="number"
                inputMode="decimal"
                value={grams}
                onChange={e => setGrams(parseFloat(e.target.value) || 0)}
              />
              <span className="text-xs ml-1" style={{ color: '#9b9b9b' }}>g</span>
            </div>
            <button
              onClick={() => setGrams(g => g + 10)}
              className="active-scale w-10 h-10 rounded-input text-lg font-bold flex items-center justify-center"
              style={{ background: '#3d3d3d', color: '#ececec' }}
            >+</button>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Protein', val: `${n.prot}g`,     color: '#60a5fa' },
              { label: 'Carbs',   val: `${n.carb}g`,     color: '#f97316' },
              { label: 'Fat',     val: `${n.fat}g`,       color: '#facc15' },
              { label: 'Calories', val: `${n.cal}`,       color: '#d97706' },
            ].map(m => (
              <div key={m.label} className="rounded-input py-2 text-center" style={{ background: '#2f2f2f' }}>
                <p className="text-xs font-bold font-tabular" style={{ color: m.color }}>{m.val}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#6b6b6b' }}>{m.label}</p>
              </div>
            ))}
          </div>

          {/* Meal selector */}
          <div className="flex gap-1.5">
            {MEALS.map(m => (
              <button key={m.key} onClick={() => onMealChange(m.key)}
                className="active-scale flex-1 py-1.5 rounded-pill text-xs font-semibold"
                style={{
                  background: meal === m.key ? '#d97706' : '#2f2f2f',
                  color: meal === m.key ? '#1a1a1a' : '#9b9b9b',
                  border: '1px solid ' + (meal === m.key ? '#d97706' : '#3d3d3d'),
                }}>
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleAddToLog}
            className="active-scale w-full py-3 rounded-input font-semibold text-sm"
            style={{ background: '#d97706', color: '#1a1a1a' }}
          >
            Add to {meal}
          </button>
        </div>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (lookupState === 'loading') {
    return (
      <div className="rounded-card p-8 flex flex-col items-center gap-3" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: '#d97706' }} />
        <p className="text-sm" style={{ color: '#9b9b9b' }}>Looking up product…</p>
      </div>
    );
  }

  // ── Not found state ──────────────────────────────────────────────────────────
  if (lookupState === 'not_found') {
    return (
      <div className="space-y-4">
        <div className="rounded-card p-5 text-center space-y-3" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
          <p className="text-2xl">🔍</p>
          <p className="text-sm font-semibold" style={{ color: '#ececec' }}>Product not found</p>
          <p className="text-xs" style={{ color: '#9b9b9b' }}>
            Barcode <span className="font-mono" style={{ color: '#d97706' }}>{scannedCode}</span> wasn't in the database.
          </p>
          <button onClick={reset} className="active-scale w-full py-2.5 rounded-input text-sm font-semibold"
            style={{ background: '#d97706', color: '#1a1a1a' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main scanner UI ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Live camera scanner */}
      <div className="space-y-2">
        <p className="text-xs font-semibold" style={{ color: '#9b9b9b' }}>Point camera at barcode</p>
        <LiveScanner onScan={handleBarcode} />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: '#3d3d3d' }} />
        <span className="text-xs" style={{ color: '#6b6b6b' }}>or</span>
        <div className="flex-1 h-px" style={{ background: '#3d3d3d' }} />
      </div>

      {/* Photo fallback */}
      <div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handlePhotoCapture}
        />
        <button
          onClick={() => photoInputRef.current?.click()}
          className="active-scale w-full py-3 rounded-input text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: '#242424', border: '1px solid #3d3d3d', color: '#ececec' }}
        >
          📸 Take Photo of Barcode
        </button>
        {photoError && <p className="text-xs mt-2 text-center" style={{ color: '#ef4444' }}>{photoError}</p>}
        <p className="text-xs mt-1.5 text-center" style={{ color: '#6b6b6b' }}>Use this if live scan isn't working</p>
      </div>

      {/* Manual entry */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-input px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-600/50 font-tabular"
          style={inputStyle}
          placeholder="Enter barcode number…"
          value={manualCode}
          onChange={e => setManualCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && manualCode.trim() && handleBarcode(manualCode.trim())}
          inputMode="numeric"
        />
        <button
          onClick={() => manualCode.trim() && handleBarcode(manualCode.trim())}
          disabled={!manualCode.trim()}
          className="active-scale p-2.5 rounded-input"
          style={{ background: manualCode.trim() ? '#d97706' : '#3d3d3d', color: manualCode.trim() ? '#1a1a1a' : '#9b9b9b' }}
        >
          <Search size={18} />
        </button>
      </div>
    </div>
  );
}
