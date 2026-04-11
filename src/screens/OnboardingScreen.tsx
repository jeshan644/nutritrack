import { useState } from 'react';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { getSettingsSync, saveSettings, verifySessionId } from '../utils/storage';
import { setSessionId, isSupabaseReady } from '../lib/supabase';
import type { ActivityLevel, Sex } from '../types';

interface Props {
  onComplete: () => void;
}

const ACTIVITY_OPTIONS: { key: ActivityLevel; label: string; desc: string; multiplier: number }[] = [
  { key: 'sedentary',    label: 'Sedentary',        desc: 'Desk job, little or no exercise',      multiplier: 1.2   },
  { key: 'light',        label: 'Lightly Active',   desc: 'Light exercise 1–3 days/week',          multiplier: 1.375 },
  { key: 'moderate',     label: 'Moderately Active', desc: 'Moderate exercise 3–5 days/week',       multiplier: 1.55  },
  { key: 'very_active',  label: 'Very Active',       desc: 'Hard exercise 6–7 days/week',           multiplier: 1.725 },
  { key: 'extra_active', label: 'Extra Active',      desc: 'Physical job or 2× training daily',     multiplier: 1.9   },
];

function calcBMR(sex: Sex, weight: number, height: number, age: number): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

function calcGoals(sex: Sex, weight: number, height: number, age: number, activity: ActivityLevel) {
  const multiplier = ACTIVITY_OPTIONS.find(a => a.key === activity)!.multiplier;
  const bmr     = calcBMR(sex, weight, height, age);
  const tdee    = Math.round(bmr * multiplier);
  const cutting = tdee - 500;
  const protein = Math.round(weight * 2);
  const fat     = Math.round(weight * 0.8);
  const carbs   = Math.max(50, Math.round((cutting - protein * 4 - fat * 9) / 4));
  return { tdee, cutting, protein, fat, carbs, fiber: 30 };
}

type Step = 1 | 2 | 3 | 'restore';
type RestoreStatus = 'idle' | 'checking' | 'success' | 'error';

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState<Step>(1);

  // Step 1 — name
  const [name, setName] = useState('');

  // Step 2 — body stats
  const [sex, setSex]       = useState<Sex>('male');
  const [age, setAge]       = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // Step 3 — activity level
  const [activity, setActivity] = useState<ActivityLevel>('moderate');

  // Restore flow
  const [restoreInput, setRestoreInput]   = useState('');
  const [restoreStatus, setRestoreStatus] = useState<RestoreStatus>('idle');
  const [restoreError, setRestoreError]   = useState('');

  const statsValid = parseFloat(weight) > 0 && parseFloat(height) > 0 && parseInt(age) > 0;
  const goals = statsValid
    ? calcGoals(sex, parseFloat(weight), parseFloat(height), parseInt(age), activity)
    : null;

  function canGoToStep2() { return name.trim().length > 0; }
  function canGoToStep3() { return statsValid; }

  async function handleRestore() {
    if (!restoreInput.trim()) return;
    setRestoreStatus('checking');
    setRestoreError('');
    const found = await verifySessionId(restoreInput);
    if (found) {
      setSessionId(found);
      setRestoreStatus('success');
      await saveSettings({ ...getSettingsSync(), onboarded: true });
      setTimeout(onComplete, 1200);
    } else {
      setRestoreStatus('error');
      setRestoreError('Code not found — check it and try again.');
    }
  }

  async function handleFinish() {
    const g = goals ?? { cutting: 2000, protein: 150, carbs: 200, fat: 65, fiber: 30, tdee: 2500 };
    await saveSettings({
      ...getSettingsSync(),
      name: name.trim(),
      sex,
      age: parseInt(age) || 25,
      weight_kg: parseFloat(weight) || 75,
      height_cm: parseFloat(height) || 175,
      activity_level: activity,
      calorie_goal: g.cutting,
      protein_goal: g.protein,
      carbs_goal: g.carbs,
      fat_goal: g.fat,
      fiber_goal: g.fiber,
      onboarded: true,
    });
    onComplete();
  }

  async function handleSkip() {
    await saveSettings({ ...getSettingsSync(), name: name.trim() || '', onboarded: true });
    onComplete();
  }

  const inputCls    = "w-full rounded-input px-3 py-3 text-base outline-none focus:ring-1 focus:ring-amber-600/50";
  const inputStyle: React.CSSProperties = { background: '#2f2f2f', border: '1px solid #3d3d3d', color: '#ececec' };
  const TOTAL_STEPS = 3;

  // ── Restore screen ─────────────────────────────────────────────────────────
  if (step === 'restore') {
    return (
      <div className="flex flex-col px-6 pb-12 max-w-lg mx-auto w-full scroll-area"
        style={{ background: '#1a1a1a', height: '100dvh', overflowY: 'auto' }}>

        <div style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 40px)' }}>
          <button
            onClick={() => { setStep(1); setRestoreStatus('idle'); setRestoreError(''); setRestoreInput(''); }}
            className="active-scale flex items-center gap-1 text-sm font-medium mb-8"
            style={{ color: '#9b9b9b' }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="w-16 h-16 rounded-card flex items-center justify-center mb-6"
            style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
            <span className="text-3xl">🔑</span>
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Plus Jakarta Sans', color: '#ececec' }}>
            Restore your data
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#9b9b9b' }}>
            Enter the backup code from your previous device or from Settings → Your Data Backup Code.
          </p>

          <div className="space-y-3">
            <input
              className={inputCls}
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.85rem' }}
              placeholder="Paste your backup code…"
              value={restoreInput}
              onChange={e => { setRestoreInput(e.target.value); setRestoreStatus('idle'); setRestoreError(''); }}
              autoFocus
            />

            {restoreStatus === 'error' && (
              <p className="text-sm" style={{ color: '#ef4444' }}>{restoreError}</p>
            )}

            {restoreStatus === 'success' && (
              <div className="rounded-card p-4 text-center" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)' }}>
                <p className="text-base font-semibold" style={{ color: '#4ade80' }}>✅ Your data has been restored!</p>
                <p className="text-sm mt-1" style={{ color: '#9b9b9b' }}>Taking you to the app…</p>
              </div>
            )}

            {restoreStatus !== 'success' && (
              <button
                onClick={handleRestore}
                disabled={!restoreInput.trim() || restoreStatus === 'checking'}
                className="active-scale w-full py-4 rounded-input font-bold text-base flex items-center justify-center gap-2 transition-all"
                style={{
                  background: restoreInput.trim() ? '#d97706' : '#242424',
                  color: restoreInput.trim() ? '#1a1a1a' : '#444',
                }}
              >
                {restoreStatus === 'checking'
                  ? <><Loader2 size={18} className="animate-spin" /> Checking…</>
                  : 'Restore My Data'}
              </button>
            )}

            {!isSupabaseReady && (
              <p className="text-xs text-center" style={{ color: '#6b6b6b' }}>
                Restore requires a Supabase connection. Contact the app administrator.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Normal onboarding steps ────────────────────────────────────────────────
  return (
    <div className="flex flex-col px-6 pb-12 max-w-lg mx-auto w-full scroll-area"
      style={{ background: '#1a1a1a', height: '100dvh', overflowY: 'auto' }}>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-10" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 40px)' }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(i => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === step ? 28 : 8,
              height: 8,
              background: i < step ? '#b45309' : i === step ? '#d97706' : '#3d3d3d',
            }}
          />
        ))}
      </div>

      {/* ── STEP 1: Welcome + Name ── */}
      {step === 1 && (
        <div className="flex-1 flex flex-col">
          <div className="mb-8">
            <div className="w-20 h-20 rounded-card flex items-center justify-center mb-6 mx-auto"
              style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
              <span className="text-4xl">🥗</span>
            </div>
            <h1 className="text-3xl font-bold text-center mb-3"
              style={{ fontFamily: 'Plus Jakarta Sans', color: '#ececec' }}>
              Welcome to NutriTrack
            </h1>
            <p className="text-center text-base leading-relaxed" style={{ color: '#9b9b9b' }}>
              Track your food, understand your body, and hit your goals. Let's set you up in 3 quick steps.
            </p>
          </div>

          <div className="flex-1">
            <label className="text-sm font-semibold mb-2 block" style={{ color: '#9b9b9b' }}>
              What's your name?
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="e.g. Jeshan"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && canGoToStep2() && setStep(2)}
            />
          </div>

          <div className="pt-6 space-y-3">
            <button
              onClick={() => setStep(2)}
              disabled={!canGoToStep2()}
              className="active-scale w-full py-4 rounded-input font-bold text-base flex items-center justify-center gap-2 transition-all"
              style={{ background: canGoToStep2() ? '#d97706' : '#242424', color: canGoToStep2() ? '#1a1a1a' : '#444' }}
            >
              Get Started <ChevronRight size={20} />
            </button>

            {/* Restore option */}
            <button
              onClick={() => setStep('restore')}
              className="active-scale w-full py-3.5 rounded-input text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: '#242424', border: '1px solid #3d3d3d', color: '#9b9b9b' }}
            >
              🔑 Already have an account? Restore my data
            </button>

            <button onClick={handleSkip} className="active-scale w-full py-3 text-sm font-medium" style={{ color: '#6b6b6b' }}>
              Skip setup
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Body stats ── */}
      {step === 2 && (
        <div className="flex-1 flex flex-col">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Plus Jakarta Sans', color: '#ececec' }}>
              Your body stats
            </h1>
            <p className="text-sm" style={{ color: '#9b9b9b' }}>
              Used to calculate your personal calorie target.
            </p>
          </div>

          <div className="flex-1 space-y-5">
            {/* Sex */}
            <div>
              <label className="text-sm font-semibold mb-2 block" style={{ color: '#9b9b9b' }}>Biological sex</label>
              <div className="flex gap-3">
                {(['male', 'female'] as Sex[]).map(s => (
                  <button key={s} onClick={() => setSex(s)}
                    className="active-scale flex-1 py-3 rounded-input text-sm font-semibold capitalize transition-all"
                    style={{
                      background: sex === s ? '#d97706' : '#242424',
                      color: sex === s ? '#1a1a1a' : '#9b9b9b',
                      border: '1px solid ' + (sex === s ? '#d97706' : '#3d3d3d'),
                    }}
                  >
                    {s === 'male' ? '♂ Male' : '♀ Female'}
                  </button>
                ))}
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="text-sm font-semibold mb-2 block" style={{ color: '#9b9b9b' }}>Age</label>
              <input className={inputCls} style={inputStyle} type="number" inputMode="numeric"
                placeholder="e.g. 28" value={age} onChange={e => setAge(e.target.value)} />
            </div>

            {/* Weight + Height */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: '#9b9b9b' }}>Weight</label>
                <div className="relative">
                  <input className={inputCls} style={{ ...inputStyle, paddingRight: '2.5rem' }}
                    type="number" inputMode="decimal" placeholder="75"
                    value={weight} onChange={e => setWeight(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: '#6b6b6b' }}>kg</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: '#9b9b9b' }}>Height</label>
                <div className="relative">
                  <input className={inputCls} style={{ ...inputStyle, paddingRight: '2.5rem' }}
                    type="number" inputMode="decimal" placeholder="175"
                    value={height} onChange={e => setHeight(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: '#6b6b6b' }}>cm</span>
                </div>
              </div>
            </div>

            {/* Formula hint */}
            <div className="rounded-card p-3" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
              <p className="text-xs leading-relaxed" style={{ color: '#6b6b6b' }}>
                🔬 We use the <span style={{ color: '#9b9b9b' }}>Mifflin-St Jeor</span> equation to estimate your BMR, then apply your activity level and a <span style={{ color: '#d97706' }}>−500 kcal</span> deficit for a safe, steady cut.
              </p>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <button onClick={() => setStep(3)} disabled={!canGoToStep3()}
              className="active-scale w-full py-4 rounded-input font-bold text-base flex items-center justify-center gap-2 transition-all"
              style={{ background: canGoToStep3() ? '#d97706' : '#242424', color: canGoToStep3() ? '#1a1a1a' : '#444' }}>
              Continue <ChevronRight size={20} />
            </button>
            <button onClick={() => setStep(1)} className="active-scale w-full py-3 text-sm font-medium flex items-center justify-center gap-1" style={{ color: '#6b6b6b' }}>
              <ChevronLeft size={15} /> Back
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Activity level + results ── */}
      {step === 3 && (
        <div className="flex-1 flex flex-col">
          <div className="mb-5">
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Plus Jakarta Sans', color: '#ececec' }}>
              Activity level
            </h1>
            <p className="text-sm" style={{ color: '#9b9b9b' }}>How active are you on a typical week?</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pb-4">
            {ACTIVITY_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => setActivity(opt.key)}
                className="active-scale w-full text-left px-4 py-3.5 rounded-card transition-all"
                style={{
                  background: activity === opt.key ? 'rgba(217,119,6,0.10)' : '#242424',
                  border: '1px solid ' + (activity === opt.key ? '#d97706' : '#3d3d3d'),
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: activity === opt.key ? '#d97706' : '#ececec' }}>{opt.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#666' }}>{opt.desc}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3 flex-shrink-0"
                    style={{ borderColor: activity === opt.key ? '#d97706' : '#3d3d3d' }}>
                    {activity === opt.key && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#d97706' }} />}
                  </div>
                </div>
              </button>
            ))}

            {goals && (
              <div className="rounded-card p-4 mt-2" style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.35)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#d97706' }}>Your calculated targets</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-3">
                  <div>
                    <p className="text-xs" style={{ color: '#666' }}>Maintenance (TDEE)</p>
                    <p className="text-base font-bold font-tabular" style={{ color: '#9b9b9b' }}>{goals.tdee.toLocaleString()} kcal</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: '#666' }}>Cutting target</p>
                    <p className="text-base font-bold font-tabular" style={{ color: '#d97706' }}>{goals.cutting.toLocaleString()} kcal</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-3" style={{ borderTop: '1px solid rgba(217,119,6,0.35)' }}>
                  {[
                    { val: goals.protein + 'g', label: 'Protein', color: '#60a5fa' },
                    { val: goals.carbs   + 'g', label: 'Carbs',   color: '#f97316' },
                    { val: goals.fat     + 'g', label: 'Fat',     color: '#facc15' },
                    { val: goals.fiber   + 'g', label: 'Fiber',   color: '#a78bfa' },
                  ].map(m => (
                    <div key={m.label} className="flex-1 text-center">
                      <p className="text-sm font-bold font-tabular" style={{ color: m.color }}>{m.val}</p>
                      <p className="text-xs" style={{ color: '#6b6b6b' }}>{m.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-3 text-center" style={{ color: '#444' }}>Protein set at 2 g/kg · Fat at 0.8 g/kg · Carbs fill the rest</p>
              </div>
            )}
          </div>

          <div className="pt-4 space-y-3">
            <button onClick={handleFinish}
              className="active-scale w-full py-4 rounded-input font-bold text-base"
              style={{ background: '#d97706', color: '#1a1a1a' }}>
              Start Tracking 🚀
            </button>
            <button onClick={() => setStep(2)} className="active-scale w-full py-3 text-sm font-medium flex items-center justify-center gap-1" style={{ color: '#6b6b6b' }}>
              <ChevronLeft size={15} /> Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
