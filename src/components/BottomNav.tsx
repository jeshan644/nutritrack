import { Home, BookOpen, History, Settings, Plus } from 'lucide-react';

type Screen = 'dashboard' | 'log' | 'recipes' | 'history' | 'settings';

interface Props {
  active: Screen;
  onNavigate: (s: Screen) => void;
  onOpenLog: () => void;
}

const LEFT_TABS  = [
  { id: 'dashboard' as Screen, icon: Home,     label: 'Home'    },
  { id: 'recipes'   as Screen, icon: BookOpen, label: 'Recipes' },
];
const RIGHT_TABS = [
  { id: 'history'  as Screen, icon: History,  label: 'History'  },
  { id: 'settings' as Screen, icon: Settings, label: 'Settings' },
];

function NavTab({ id, icon: Icon, label, active, onNavigate }: {
  id: Screen; icon: React.ElementType; label: string; active: boolean; onNavigate: (s: Screen) => void;
}) {
  return (
    <button
      onClick={() => onNavigate(id)}
      className="active-scale flex flex-col items-center gap-1 flex-1 py-2"
      style={{ color: active ? '#d97706' : '#9b9b9b' }}
    >
      <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}

export default function BottomNav({ active, onNavigate, onOpenLog }: Props) {
  return (
    <nav
      className="glass shrink-0"
      style={{
        background: 'rgba(36,36,36,0.95)',
        borderTop: '1px solid #3d3d3d',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-end justify-around max-w-lg mx-auto px-2 pt-2">

        {/* Left tabs */}
        {LEFT_TABS.map(tab => (
          <NavTab key={tab.id} {...tab} active={active === tab.id} onNavigate={onNavigate} />
        ))}

        {/* Centre + button */}
        <div className="flex flex-col items-center flex-1" style={{ paddingBottom: '6px' }}>
          <button
            onClick={onOpenLog}
            className="active-scale flex items-center justify-center rounded-full"
            style={{
              width: 56,
              height: 56,
              background: '#d97706',
              boxShadow: '0 4px 16px rgba(217,119,6,0.5)',
              marginTop: -28,
              flexShrink: 0,
            }}
            aria-label="Log food"
          >
            <Plus size={28} color="#1a1a1a" strokeWidth={2.8} />
          </button>
        </div>

        {/* Right tabs */}
        {RIGHT_TABS.map(tab => (
          <NavTab key={tab.id} {...tab} active={active === tab.id} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
  );
}
