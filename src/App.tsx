import { useState, useEffect, useRef } from 'react';

// Types
interface ScoreState {
  red: number;
  blue: number;
  swapped: boolean;
}

type Team = 'red' | 'blue';

// Helpers
const parseState = (str: string): ScoreState | null => {
  try {
    return JSON.parse(str) as ScoreState;
  } catch {
    return null;
  }
};

const getInitialState = (): ScoreState => {
  const hash = window.location.hash.slice(1);
  if (hash) {
    const parsed = parseState(decodeURIComponent(hash));
    if (parsed) return parsed;
  }

  const saved = localStorage.getItem('vball-score');
  if (saved) {
    const parsed = parseState(saved);
    if (parsed) return parsed;
  }

  return { red: 0, blue: 0, swapped: false };
};

const vibrate = () => navigator.vibrate?.(50);

const stopPropagation = (fn: () => void) => (e: React.SyntheticEvent) => {
  e.stopPropagation();
  fn();
};

// Components
const ScorePanel = ({
  team,
  score,
  onClick
}: {
  team: Team;
  score: number;
  onClick: () => void;
}) => {
  // Softer, modern pastel-toned dark colors for minimal aesthetic
  const bg = team === 'red' ? 'bg-rose-500 active:bg-rose-600' : 'bg-sky-500 active:bg-sky-600';

  return (
    <div
      className={`flex-1 flex items-center justify-center ${bg} transition-colors duration-300 cursor-pointer select-none`}
      onClick={onClick}
    >
      <span className="text-[35vw] landscape:text-[20vw] font-black text-white tabular-nums drop-shadow-2xl">
        {score}
      </span>
    </div>
  );
};

// Text-only control button
const ControlButton = ({
  children,
  onClick,
  className = ''
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) => (
  <button
    className={`inline-flex min-h-10 min-w-10 items-center justify-center px-3 py-2 text-white/90 font-semibold text-xs tracking-[0.16em] transition-opacity duration-150 hover:opacity-100 active:opacity-60 ${className}`}
    onClick={stopPropagation(onClick)}
  >
    {children}
  </button>
);

const MinusGlyph = () => <span aria-hidden="true" className="block h-0.5 w-5 rounded-full bg-white/90" />;

// Main App
const App = () => {
  const [state, setState] = useState<ScoreState>(getInitialState);
  const tapTimeoutRef = useRef<number | null>(null);
  const tappedTeamRef = useRef<Team | null>(null);

  useEffect(() => {
    const json = JSON.stringify(state);
    localStorage.setItem('vball-score', json);
    window.history.replaceState(null, '', `#${encodeURIComponent(json)}`);
  }, [state]);

  const updateScore = (team: Team, delta: number) => {
    setState(prev => ({ ...prev, [team]: Math.max(0, prev[team] + delta) }));
    vibrate();
  };

  const reset = () => {
    if (confirm('Reset scores?')) {
      setState(prev => ({ ...prev, red: 0, blue: 0 }));
    }
  };

  const swap = () => setState(prev => ({ ...prev, swapped: !prev.swapped }));

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current !== null) {
        window.clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  const handleScoreTap = (team: Team) => {
    if (tapTimeoutRef.current !== null) {
      window.clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
      tappedTeamRef.current = null;
      swap();
      vibrate();
      return;
    }

    tappedTeamRef.current = team;
    tapTimeoutRef.current = window.setTimeout(() => {
      if (tappedTeamRef.current) {
        updateScore(tappedTeamRef.current, 1);
      }
      tapTimeoutRef.current = null;
      tappedTeamRef.current = null;
    }, 200);
  };

  const containerClass = `flex h-dvh w-dvw overflow-hidden select-none touch-none ${state.swapped ? 'flex-col-reverse landscape:flex-row-reverse' : 'flex-col landscape:flex-row'
    }`;

  return (
    <div className={containerClass}>
      <ScorePanel team="red" score={state.red} onClick={() => handleScoreTap('red')} />
      <ScorePanel team="blue" score={state.blue} onClick={() => handleScoreTap('blue')} />

      {/* Top Floating Reset Button */}
      <div className="absolute top-6 inset-x-0 px-4 z-10 flex justify-center">
        <ControlButton
          onClick={reset}
          className="text-[11px]"
        >
          RESET
        </ControlButton>
      </div>

      {/* Bottom Floating Control Dock */}
      <div className="absolute inset-x-0 bottom-6 px-4 z-10 flex justify-center safe-area">
        <div className="flex items-center gap-7">
          {/* Minus Red */}
          <ControlButton
            onClick={() => updateScore(state.swapped ? 'blue' : 'red', -1)}
            className="px-4 py-3"
            aria-label="Decrease score left"
          >
            <MinusGlyph />
          </ControlButton>

          {/* Swap Sides */}
          <ControlButton
            onClick={swap}
            className="text-[11px]"
          >
            SWAP
          </ControlButton>

          {/* Minus Blue */}
          <ControlButton
            onClick={() => updateScore(state.swapped ? 'red' : 'blue', -1)}
            className="px-4 py-3"
            aria-label="Decrease score right"
          >
            <MinusGlyph />
          </ControlButton>
        </div>
      </div>
    </div>
  );
};

export default App;