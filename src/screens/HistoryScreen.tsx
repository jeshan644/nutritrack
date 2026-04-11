import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';
import CalorieRing from '../components/CalorieRing';
import MacroPill from '../components/MacroPill';
import type { FoodLogEntry, MealType } from '../types';
import { getAllLog, getDayTotals, getSettings, getSettingsSync, todayStr, dateLabel } from '../utils/storage';
import type { Settings } from '../types';

const MEALS: { key: MealType; label: string; emoji: string }[] = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { key: 'lunch',     label: 'Lunch',     emoji: '☀️' },
  { key: 'dinner',    label: 'Dinner',    emoji: '🌙' },
  { key: 'snacks',    label: 'Snacks',    emoji: '🍿' },
];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, days: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + days); return d;
}
function formatDateStr(date: Date) { return date.toISOString().slice(0, 10); }

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
interface ChartData { day: string; calories: number; date: string; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-input px-3 py-2" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
      <p className="text-xs font-semibold" style={{ color: '#ececec' }}>{label}</p>
      <p className="text-xs font-tabular" style={{ color: '#d97706' }}>{Math.round(payload[0].value)} kcal</p>
    </div>
  );
};

export default function HistoryScreen() {
  const today = todayStr();
  const [settings, setSettings]     = useState<Settings>(getSettingsSync());
  const [allLog, setAllLog]         = useState<FoodLogEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    setLoading(true);
    Promise.all([getAllLog(), getSettings()]).then(([log, s]) => {
      setAllLog(log);
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const weekStart = getWeekStart(addDays(new Date(), weekOffset * 7));
  const weekDates = Array.from({ length: 7 }, (_, i) => formatDateStr(addDays(weekStart, i)));

  const dayEntries  = allLog.filter(e => e.date === selectedDate);
  const dayTotals   = getDayTotals(dayEntries);
  const hasEntries  = (date: string) => allLog.some(e => e.date === date);

  const chartData: ChartData[] = Array.from({ length: 7 }, (_, i) => {
    const d   = formatDateStr(addDays(new Date(), -(6 - i)));
    const cal = allLog.filter(e => e.date === d).reduce((s, e) => s + e.calories, 0);
    return {
      day: new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
      calories: cal,
      date: d,
    };
  });

  return (
    <div className="flex flex-col h-full" style={{ background: '#1a1a1a' }}>

      {/* ── Fixed header ─────────────────────────────────────── */}
      <div
        className="shrink-0 px-4 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)', borderBottom: '1px solid #2a2a2a' }}
      >
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#ececec' }}>History</h1>
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────── */}
      <div className="scroll-area flex-1 px-4 py-5">
        <div className="max-w-lg mx-auto space-y-4">

          {loading ? (
            <>
              <div className="h-32 rounded-card animate-pulse" style={{ background: '#242424' }} />
              <div className="h-48 rounded-card animate-pulse" style={{ background: '#242424' }} />
            </>
          ) : (
            <>
              {/* Week navigation */}
              <div className="rounded-card p-3" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setWeekOffset(w => w - 1)} className="active-scale p-1.5 rounded-lg"
                    style={{ background: '#3d3d3d', color: '#9b9b9b' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-semibold" style={{ color: '#ececec' }}>
                    {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                    {addDays(weekStart, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {weekOffset === 0 && <span className="ml-2 text-xs" style={{ color: '#d97706' }}>This week</span>}
                  </span>
                  <button onClick={() => setWeekOffset(w => Math.min(w + 1, 0))} className="active-scale p-1.5 rounded-lg"
                    disabled={weekOffset >= 0}
                    style={{ background: '#3d3d3d', color: weekOffset >= 0 ? '#3d3d3d' : '#9b9b9b' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="flex gap-1">
                  {weekDates.map((date, i) => {
                    const isSelected = date === selectedDate;
                    const isToday    = date === today;
                    const hasDot     = hasEntries(date);
                    const isFuture   = date > today;
                    const dayObj     = new Date(date + 'T12:00:00');
                    return (
                      <button key={date} onClick={() => !isFuture && setSelectedDate(date)} disabled={isFuture}
                        className="active-scale flex-1 flex flex-col items-center py-2 rounded-input transition-all duration-200"
                        style={{ background: isSelected ? '#d97706' : isToday ? '#3d3d3d' : 'transparent', opacity: isFuture ? 0.3 : 1 }}
                      >
                        <span className="text-[10px] font-semibold mb-1"
                          style={{ color: isSelected ? '#1a1a1a' : '#9b9b9b' }}>{DAY_LABELS[i]}</span>
                        <span className="text-sm font-bold"
                          style={{ color: isSelected ? '#1a1a1a' : isToday ? '#ececec' : '#9b9b9b' }}>{dayObj.getDate()}</span>
                        <div className="w-1.5 h-1.5 rounded-full mt-1"
                          style={{ background: hasDot && !isSelected ? '#d97706' : 'transparent' }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day summary */}
              <p className="text-sm font-semibold" style={{ color: '#9b9b9b' }}>{dateLabel(selectedDate)}</p>

              {dayEntries.length === 0 ? (
                <div className="rounded-card p-6 text-center" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
                  <p className="text-sm" style={{ color: '#9b9b9b' }}>No entries for this day</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <CalorieRing consumed={dayTotals.calories} goal={settings.calorie_goal} size={160} />
                  </div>
                  <div className="flex gap-2">
                    <MacroPill label="Protein" consumed={dayTotals.protein} goal={settings.protein_goal} color="#60a5fa" bgColor="#60a5fa20" />
                    <MacroPill label="Carbs"   consumed={dayTotals.carbs}   goal={settings.carbs_goal}   color="#f97316" bgColor="#f9731620" />
                    <MacroPill label="Fat"     consumed={dayTotals.fat}     goal={settings.fat_goal}     color="#facc15" bgColor="#facc1520" />
                    <MacroPill label="Fiber"   consumed={dayTotals.fiber}   goal={settings.fiber_goal}   color="#a78bfa" bgColor="#a78bfa20" />
                  </div>

                  <div className="space-y-3">
                    {MEALS.map(meal => {
                      const me = dayEntries.filter(e => e.meal_type === meal.key);
                      if (!me.length) return null;
                      const mCal = me.reduce((s, e) => s + e.calories, 0);
                      return (
                        <div key={meal.key} className="rounded-card overflow-hidden" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
                          <div className="flex items-center px-4 py-3">
                            <span className="text-base mr-2">{meal.emoji}</span>
                            <span className="font-semibold text-sm flex-1" style={{ color: '#ececec' }}>{meal.label}</span>
                            <span className="text-xs font-tabular" style={{ color: '#d97706' }}>{Math.round(mCal)} kcal</span>
                          </div>
                          {me.map(entry => (
                            <div key={entry.id} className="flex items-center px-4 py-2" style={{ borderTop: '1px solid #3d3d3d' }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate" style={{ color: '#ececec' }}>{entry.name}</p>
                                <p className="text-xs" style={{ color: '#9b9b9b' }}>
                                  P {entry.protein.toFixed(1)}g · C {entry.carbs.toFixed(1)}g · F {entry.fat.toFixed(1)}g
                                </p>
                              </div>
                              <span className="text-sm font-tabular font-semibold ml-2" style={{ color: '#f97316' }}>
                                {Math.round(entry.calories)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* 7-day chart */}
              <div className="rounded-card p-4" style={{ background: '#242424', border: '1px solid #3d3d3d' }}>
                <p className="text-sm font-semibold mb-4" style={{ color: '#ececec' }}>Last 7 Days</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fill: '#9b9b9b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9b9b9b', fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={v => v === 0 ? '' : `${Math.round(v / 100) * 100}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <ReferenceLine y={settings.calorie_goal} stroke="#d97706" strokeDasharray="4 4" strokeWidth={1.5} />
                    <Bar dataKey="calories" fill="#d97706" opacity={0.8} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-center mt-1" style={{ color: '#9b9b9b' }}>
                  Dashed line = {settings.calorie_goal.toLocaleString()} kcal goal
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
