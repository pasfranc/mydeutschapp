import { useMemo } from 'react';

function Confetti() {
  const pieces = useMemo(() => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#51CF66', '#FF6B6B'];
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 1.5}s`,
      size: `${6 + Math.random() * 8}px`,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

export default function CompleteScreen({ stats, onStudyAgain, onBackToDecks }) {
  const elapsed = Math.round((Date.now() - stats.startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const accuracy =
    stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <div className="min-h-dvh bg-white flex flex-col items-center justify-center p-4 relative">
      <Confetti />

      <div className="text-center max-w-sm w-full z-10">
        <div className="text-7xl mb-4">🎉</div>

        <h1 className="text-2xl font-bold text-primary mb-1">
          Session complete!
        </h1>
        <p className="text-lg text-dark/50 mb-8">Great job!</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-light rounded-xl p-4">
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
            <p className="text-sm text-dark/40">Studied</p>
          </div>
          <div className="bg-light rounded-xl p-4">
            <p className="text-3xl font-bold text-primary">{stats.correct}</p>
            <p className="text-sm text-dark/40">Correct</p>
          </div>
          <div className="bg-light rounded-xl p-4">
            <p className="text-3xl font-bold text-primary">{accuracy}%</p>
            <p className="text-sm text-dark/40">Accuracy</p>
          </div>
          <div className="bg-light rounded-xl p-4">
            <p className="text-3xl font-bold text-primary">{timeStr}</p>
            <p className="text-sm text-dark/40">Time</p>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={onStudyAgain} className="btn-primary w-full">
            Study again
          </button>
          <button onClick={onBackToDecks} className="btn-secondary w-full">
            Back to decks
          </button>
        </div>
      </div>
    </div>
  );
}
