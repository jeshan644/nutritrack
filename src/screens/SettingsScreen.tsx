import { useState, useEffect } from 'react';
import { Save, RotateCcw, Trash2, RefreshCw, Copy, Check, Share2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { getSettings, getSettingsSync, saveSettings, clearAllLogs, DEFAULT_SETTINGS, verifySessionId } from '../utils/storage';
import { getSessionId, setSessionId, isSupabaseReady } from '../lib/supabase';
import type { Settings, Sex, ActivityLevel } from '../types';

const ACTIVITY_OPTIONS: { key: ActivityLevel; label: string; multiplier: number }[] = [
  { key: 'sedentary',    label: 'Sedentary',         multiplier: 1.2   },
  { key: 'light',        label: 'Lightly Active',    multiplier: 1.375 },
  { key: 'moderate',     label: 'Moderately Active', multiplier: 1.55  },
  { key: 'very_active',  label: 'Very Active',       multiplier: 1.725 },
  { key: 'extra_active', label: 'Extra Active',      multiplier: 1.9   },
];

function recalcGoals(s: Settings) {
  const { sex, weight_kg: w, height_cm: h, age, activity_level } = s;
  const base = 10 * w + 6.25 * h - 5 * age;
  const bmr  = sex === 'male' ? base + 5 : base - 161;
  const mult = ACTIVITY_OPTIONS.find(a => a.key === activity_level)!.multiplier;
  const tdee = Math.round(bmr * mult);
  const cutting = tdee - 500;
  return {
    calorie_goal: cutting,
    protein_goal: Math.round(w * 2),
    fat_goal: Math.round(w * 0.8),
    carbs_goal: Math.max(50, Math.round((cutting - Math.round(w * 2) * 4 - Math.round(w * 0.8) * 9) / 4)),
  };
}

interface Props {
  onSaved: () => void;
}

type SwitchStatus = 'idle' | 'checking' | 'success' | 'error';

export default function SettingsScreen({ onSaved }: Props) {
  const [settings, setSettings]           = useState<Settings>(getSettingsSync());
  const [saved, setSaved]                 = useState(false);
  const [sessionId, setSessionIdState]    = useState(getSessionId());
  const [copied, setCopied]               = useState(false);

  // Switch backup code
  const [showSwitch, setShowSwitch]       = useState(false);
  const [switchInput, setSwitchInput]     = useState('');
  const [switchStatus, setSwitchStatus]   = useState<SwitchStatus>('idle');
  const [switchError, setSwitchError]     = useState('');

  useEffect(() => {
    getSettings().then(s => setSettings(s));
  }, []);

  function update(field: keyof Settings, value: string | number | boolean) {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    await saveSettings(settings);
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleClearLogs() {
    if (!confirm('This will delete ALL food log entries. Are you sure?')) return;
    await clearAllLogs();
    onSaved();
    alert('All log entries cleared.');
  }

  async function handleReset() {
    if (!confirm('Reset all settings to defaults?')) return;
    const reset = { ...DEFAULT_SETTINGS, onboarded: true };
    setSettings(reset);
    await saveSettings(reset);
    onSaved();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleCopy() {
    navigator.clipboard.writeText(sessionId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleShare() {
    const text = `My NutriTrack backup code:\n${sessionId}\n\nSave this to restore your data after reinstalling the app.`;
    if (navigator.share) {
      await navigator.share({ text }).catch(() => {});
    } else {
      handleCopy();
    }
  }

  async function handleSwitchCode() {
    if (!switchInput.trim()) return;
    setSwitchStatus('checking');
    setSwitchError('');
    const found = await verifySessionId(switchInput);
    if (found) {
      setSessionId(found);
      setSessionIdState(found);
      setSwitchStatus('success');
      setSwitchInput('');
      setTimeout(() => {
        setShowSwitch(false);
        setSwitchStatus('idle');
        onSaved(); // trigger a data refresh
      }, 1500);
    } else {
      setSwitchStatus('error');
      setSwitchError('Code not found — check it and try again.');
    }
  }

  const displayCode = sessionId.slice(0, 8).toUpperCase();
  const inputCls    = "w-full rounded-input px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-600/50";
  const inputStyle  = { background: '#2f2f2f', border: '1px solid #3d3d3d', color: '#ececec' };
  const labelCls    = "text-xs mb-1 block font-medium";

  return (
    <div className="flex flex-col h-full" style={{ background: '#1a1a1a' }}>
      {/* ── Fixed header ──────────────────────────────────────── */}
      <div
        className="shrink-0 px-4 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)', borderBottom: '1px solid #2a2a2a' }}
      >
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#ececec' }}>Settings</h1>
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────── */}
      <div className="scroll-area flex-1 px-4 py-5">
      <div className="max-w-lg mx-auto">

      {/* Profile & Body Stats */}
      <section className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9b9b9b' }}>Your Profile</p>
        <div className="rounded-card p-4 space-y-4" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
          <div>
            <label className={labelCls} style={{ color: '#9b9b9b' }}>Name</label>
            <input className={inputCls} style={inputStyle} placeholder="e.g. Alex" value={settings.name} onChange={e => update('name', e.target.value)} />
          </div>

          {/* Sex */}
          <div>
            <label className={labelCls} style={{ color: '#9b9b9b' }}>Biological sex</label>
            <div className="flex gap-2">
              {(['male', 'female'] as Sex[]).map(s => (
                <button
                  key={s}
                  onClick={() => update('sex', s)}
                  className="active-scale flex-1 py-2.5 rounded-input text-sm font-semibold capitalize transition-all"
                  style={{
                    background: settings.sex === s ? '#d97706' : '#2f2f2f',
                    color: settings.sex === s ? '#1a1a1a' : '#9b9b9b',
                    border: '1px solid ' + (settings.sex === s ? '#d97706' : '#3d3d3d'),
                  }}
                >
                  {s === 'male' ? '♂ Male' : '♀ Female'}
                </button>
              ))}
            </div>
          </div>

          {/* Age / Weight / Height */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Age',    field: 'age'       as keyof Settings, unit: 'yrs' },
              { label: 'Weight', field: 'weight_kg' as keyof Settings, unit: 'kg'  },
              { label: 'Height', field: 'height_cm' as keyof Settings, unit: 'cm'  },
            ].map(f => (
              <div key={f.field}>
                <label className={labelCls} style={{ color: '#9b9b9b' }}>{f.label}</label>
                <div className="relative">
                  <input
                    className={`${inputCls} pr-7 text-sm`}
                    style={inputStyle}
                    type="number"
                    inputMode="decimal"
                    value={settings[f.field] as number}
                    onChange={e => update(f.field, parseFloat(e.target.value) || 0)}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#6b6b6b' }}>{f.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Activity level */}
          <div>
            <label className={labelCls} style={{ color: '#9b9b9b' }}>Activity level</label>
            <select
              className={`${inputCls} appearance-none`}
              style={inputStyle}
              value={settings.activity_level}
              onChange={e => update('activity_level', e.target.value as ActivityLevel)}
            >
              {ACTIVITY_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Recalculate button */}
          <button
            onClick={() => { setSettings(prev => ({ ...prev, ...recalcGoals(settings) })); setSaved(false); }}
            className="active-scale w-full py-2.5 rounded-input text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ background: 'rgba(217,119,6,0.10)', color: '#d97706', border: '1px solid rgba(217,119,6,0.35)' }}
          >
            <RefreshCw size={14} /> Recalculate goals from stats
          </button>
        </div>
      </section>

      {/* Daily Goals */}
      <section className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9b9b9b' }}>Daily Goals</p>
        <div className="rounded-card p-4 space-y-3" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
          <div>
            <label className={labelCls} style={{ color: '#d97706' }}>Calories (kcal)</label>
            <input
              className={inputCls} style={inputStyle} type="number" inputMode="decimal"
              value={settings.calorie_goal}
              onChange={e => update('calorie_goal', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'protein_goal' as keyof Settings, label: 'Protein (g)', color: '#60a5fa' },
              { key: 'carbs_goal'   as keyof Settings, label: 'Carbs (g)',   color: '#f97316' },
              { key: 'fat_goal'     as keyof Settings, label: 'Fat (g)',     color: '#facc15' },
              { key: 'fiber_goal'   as keyof Settings, label: 'Fiber (g)',   color: '#a78bfa' },
            ].map(f => (
              <div key={f.key}>
                <label className={labelCls} style={{ color: f.color }}>{f.label}</label>
                <input
                  className={inputCls} style={inputStyle} type="number" inputMode="decimal"
                  value={settings[f.key] as number}
                  onChange={e => update(f.key, parseInt(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Backup Code ───────────────────────────────────────── */}
      <section className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9b9b9b' }}>Your Data Backup Code</p>
        <div className="rounded-card p-4 space-y-4" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>

          {/* Large display code */}
          <div className="rounded-card p-4 text-center" style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.3)' }}>
            <p className="text-xs mb-2" style={{ color: '#9b9b9b' }}>Your code</p>
            <p className="text-3xl font-bold font-mono tracking-widest" style={{ color: '#d97706', letterSpacing: '0.15em' }}>
              {displayCode}
            </p>
            <p className="text-[10px] mt-2 font-mono truncate px-2" style={{ color: '#6b6b6b' }}>{sessionId}</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="active-scale flex-1 flex items-center justify-center gap-2 py-2.5 rounded-input text-sm font-semibold transition-all"
              style={{
                background: copied ? 'rgba(217,119,6,0.15)' : '#2f2f2f',
                color: copied ? '#d97706' : '#9b9b9b',
                border: '1px solid ' + (copied ? 'rgba(217,119,6,0.4)' : '#3d3d3d'),
              }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleShare}
              className="active-scale flex-1 flex items-center justify-center gap-2 py-2.5 rounded-input text-sm font-semibold"
              style={{ background: '#2f2f2f', color: '#9b9b9b', border: '1px solid #3d3d3d' }}
            >
              <Share2 size={15} /> Share
            </button>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: '#9b9b9b' }}>
            Save this code somewhere safe — you can use it to restore all your data if you reinstall the app or switch devices.
          </p>

          {/* Switch to a different code */}
          {isSupabaseReady && (
            <div>
              <button
                onClick={() => { setShowSwitch(s => !s); setSwitchStatus('idle'); setSwitchError(''); setSwitchInput(''); }}
                className="active-scale w-full flex items-center justify-center gap-2 py-2.5 rounded-input text-sm font-semibold"
                style={{ background: '#2f2f2f', color: '#9b9b9b', border: '1px solid #3d3d3d' }}
              >
                Use a different backup code
                {showSwitch ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showSwitch && (
                <div className="mt-3 space-y-2">
                  <input
                    className={inputCls}
                    style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.8rem' }}
                    placeholder="Paste backup code or 8-char code…"
                    value={switchInput}
                    onChange={e => { setSwitchInput(e.target.value); setSwitchStatus('idle'); setSwitchError(''); }}
                  />

                  {switchStatus === 'error' && (
                    <p className="text-xs" style={{ color: '#ef4444' }}>{switchError}</p>
                  )}
                  {switchStatus === 'success' && (
                    <p className="text-xs font-semibold" style={{ color: '#4ade80' }}>✅ Data restored! Your data is back.</p>
                  )}

                  <button
                    onClick={handleSwitchCode}
                    disabled={!switchInput.trim() || switchStatus === 'checking' || switchStatus === 'success'}
                    className="active-scale w-full py-2.5 rounded-input text-sm font-semibold flex items-center justify-center gap-2"
                    style={{
                      background: switchInput.trim() && switchStatus !== 'success' ? '#d97706' : '#3d3d3d',
                      color: switchInput.trim() && switchStatus !== 'success' ? '#1a1a1a' : '#9b9b9b',
                    }}
                  >
                    {switchStatus === 'checking'
                      ? <><Loader2 size={15} className="animate-spin" /> Checking…</>
                      : switchStatus === 'success'
                      ? '✅ Restored!'
                      : 'Restore Data'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Data */}
      <section className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9b9b9b' }}>Data</p>
        <div className="rounded-card overflow-hidden" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
          <button
            onClick={handleClearLogs}
            className="active-scale w-full flex items-center gap-3 px-4 py-4 text-left transition-colors"
            style={{ borderBottom: '1px solid #3d3d3d' }}
          >
            <Trash2 size={18} style={{ color: '#ef4444' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>Clear All Logs</p>
              <p className="text-xs" style={{ color: '#9b9b9b' }}>Permanently delete all food log entries</p>
            </div>
          </button>
          <button
            onClick={handleReset}
            className="active-scale w-full flex items-center gap-3 px-4 py-4 text-left transition-colors"
          >
            <RotateCcw size={18} style={{ color: '#9b9b9b' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#ececec' }}>Reset to Defaults</p>
              <p className="text-xs" style={{ color: '#9b9b9b' }}>Reset all settings to default values</p>
            </div>
          </button>
        </div>
      </section>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="active-scale w-full py-3.5 rounded-input font-bold text-sm flex items-center justify-center gap-2"
        style={{ background: saved ? '#b45309' : '#d97706', color: '#1a1a1a' }}
      >
        {saved ? <>✓ Saved!</> : <><Save size={16} /> Save Settings</>}
      </button>

      {/* App info */}
      <p className="text-center text-xs mt-8 mb-2" style={{ color: '#3d3d3d' }}>NutriTrack v1.0</p>
      </div>{/* max-w-lg */}
      </div>{/* scroll-area */}
    </div>
  );
}
