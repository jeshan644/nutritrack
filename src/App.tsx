import { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import DashboardScreen from './screens/DashboardScreen';
import RecipesScreen from './screens/RecipesScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import LogFoodScreen from './screens/LogFoodScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { getSettingsSync } from './utils/storage';
import type { MealType } from './types';

type Screen = 'dashboard' | 'log' | 'recipes' | 'history' | 'settings';

const BACKUP_REMINDED_KEY = 'nt_backup_reminded';

export default function App() {
  const [screen, setScreen]         = useState<Screen>('dashboard');
  const [showLog, setShowLog]       = useState(false);
  const [logMeal, setLogMeal]       = useState<MealType | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [onboarded, setOnboarded]   = useState(() => getSettingsSync().onboarded);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // If SW controller changes (new SW activated) — reload once for fresh content
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register(
          '/sw.js',
          { updateViaCache: 'none' }, // Never cache the SW file itself
        );

        // Check for updates immediately on every load
        await reg.update();

        // When a new SW version is found, activate it immediately
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Tell new SW to skip waiting and take control now
              newWorker.postMessage('skipWaiting');
            }
          });
        });
      } catch {
        // SW registration failure is non-fatal
      }
    });
  }, []);

  // Force SW update check on every app load
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) reg.update();
      });
    }
  }, []);

  // Show banner once after onboarding if user hasn't dismissed it
  useEffect(() => {
    if (onboarded && !localStorage.getItem(BACKUP_REMINDED_KEY)) {
      // Small delay so it doesn't pop up before the UI settles
      const t = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(t);
    }
  }, [onboarded]);

  function dismissBanner() {
    localStorage.setItem(BACKUP_REMINDED_KEY, 'true');
    setShowBanner(false);
  }

  if (!onboarded) {
    return <OnboardingScreen onComplete={() => setOnboarded(true)} />;
  }

  function openLog(meal?: MealType) {
    setLogMeal(meal);
    setShowLog(true);
  }

  function handleLogged() {
    setRefreshKey(k => k + 1);
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: '#1a1a1a', overflow: 'hidden' }}>

      {/* Screen area */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {screen === 'dashboard' && <DashboardScreen onOpenLog={openLog} refreshKey={refreshKey} />}
        {screen === 'recipes'   && <RecipesScreen />}
        {screen === 'history'   && <HistoryScreen />}
        {screen === 'settings'  && <SettingsScreen onSaved={handleLogged} />}
      </div>

      {/* ── One-time backup reminder banner ──────────────────── */}
      {showBanner && (
        <div className="shrink-0 px-4 py-2" style={{ borderTop: '1px solid #2a2a2a' }}>
          <div className="rounded-card p-3 flex items-start gap-3 max-w-lg mx-auto"
            style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.3)' }}>
            <span className="text-lg mt-0.5 flex-shrink-0">💾</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: '#d97706' }}>Save your backup code</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#9b9b9b' }}>
                Go to Settings to copy your backup code — you'll need it if you ever reinstall the app.
              </p>
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={() => { setScreen('settings'); dismissBanner(); }}
                  className="active-scale px-3 py-1.5 rounded-pill text-xs font-bold"
                  style={{ background: '#d97706', color: '#1a1a1a' }}
                >
                  Go to Settings
                </button>
                <button
                  onClick={dismissBanner}
                  className="active-scale px-3 py-1.5 rounded-pill text-xs font-medium"
                  style={{ background: '#3d3d3d', color: '#9b9b9b' }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <BottomNav active={screen} onNavigate={s => setScreen(s)} onOpenLog={() => openLog()} />

      {/* Log food overlay */}
      {showLog && (
        <LogFoodScreen
          defaultMeal={logMeal}
          onClose={() => setShowLog(false)}
          onLogged={handleLogged}
        />
      )}
    </div>
  );
}
