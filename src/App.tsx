import { useState, useEffect, type MouseEvent } from 'react';

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

const stopPropagation = (fn: () => void) => (e: MouseEvent) => {
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
  const bg = team === 'red' ? 'bg-red-600 active:bg-red-500' : 'bg-blue-600 active:bg-blue-500';

  return (
    <div
      className={`flex-1 flex items-center justify-center ${bg} transition-colors cursor-pointer`}
      onClick={onClick}
    >
      <span className="text-[35vw] landscape:text-[20vw] font-black text-white tabular-nums drop-shadow-2xl">
        {score}
      </span>
    </div>
  );
};

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
    className={`text-white font-bold ${className}`}
    onClick={stopPropagation(onClick)}
  >
    {children}
  </button>
);

// Main App
const App = () => {
  const [state, setState] = useState<ScoreState>(getInitialState);

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

  const containerClass = `flex h-screen w-screen overflow-hidden select-none touch-none ${state.swapped ? 'flex-col-reverse landscape:flex-row-reverse' : 'flex-col landscape:flex-row'
    }`;

  return (
    <div className={containerClass}>
      <ScorePanel team="red" score={state.red} onClick={() => updateScore('red', 1)} />
      <ScorePanel team="blue" score={state.blue} onClick={() => updateScore('blue', 1)} />

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-10 hover:opacity-100 transition-opacity duration-300 px-6 py-3 bg-black/40 rounded-full backdrop-blur-md border border-white/20">
        <ControlButton
          onClick={() => updateScore('red', -1)}
          className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full"
        >
          -
        </ControlButton>

        <ControlButton
          onClick={swap}
          className="text-[10px] tracking-widest font-black uppercase px-4"
        >
          Swap
        </ControlButton>

        <ControlButton
          onClick={reset}
          className="text-[10px] tracking-widest font-black uppercase px-4"
        >
          Reset
        </ControlButton>

        <ControlButton
          onClick={() => updateScore('blue', -1)}
          className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full"
        >
          -
        </ControlButton>
      </div>
    </div>
  );
};

export default App;