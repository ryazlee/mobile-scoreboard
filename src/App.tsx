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
  const bg = team === 'red' ? 'bg-rose-600 active:bg-rose-500' : 'bg-sky-600 active:bg-sky-500';

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

  const containerClass = `flex h-dvh w-dvw overflow-hidden select-none touch-none ${state.swapped ? 'flex-col-reverse landscape:flex-row-reverse' : 'flex-col landscape:flex-row'
    }`;

  return (
    <div className={containerClass}>
      <ScorePanel team="red" score={state.red} onClick={() => updateScore('red', 1)} />
      <ScorePanel team="blue" score={state.blue} onClick={() => updateScore('blue', 1)} />

      {/* Controls - left side in portrait, bottom center in landscape */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 landscape:left-1/2 landscape:top-auto landscape:bottom-4 landscape:-translate-x-1/2 landscape:translate-y-0 flex flex-col landscape:flex-row items-center gap-4 landscape:gap-3 px-4 py-6 landscape:px-6 landscape:py-3 bg-black/50 rounded-3xl landscape:rounded-full backdrop-blur-md border border-white/20 safe-area">
        <ControlButton
          onClick={() => updateScore(state.swapped ? 'blue' : 'red', -1)}
          className="w-12 h-12 landscape:w-10 landscape:h-10 flex items-center justify-center bg-white/10 rounded-full text-lg"
        >
          -
        </ControlButton>

        <ControlButton
          onClick={swap}
          className="text-[10px] tracking-widest font-black uppercase py-2 landscape:py-0 px-2 landscape:px-4"
        >
          Swap
        </ControlButton>

        <ControlButton
          onClick={reset}
          className="text-[10px] tracking-widest font-black uppercase py-2 landscape:py-0 px-2 landscape:px-4"
        >
          Reset
        </ControlButton>

        <ControlButton
          onClick={() => updateScore(state.swapped ? 'red' : 'blue', -1)}
          className="w-12 h-12 landscape:w-10 landscape:h-10 flex items-center justify-center bg-white/10 rounded-full text-lg"
        >
          -
        </ControlButton>
      </div>
    </div>
  );
};

export default App;