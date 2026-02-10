import { useState, useCallback } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import { calculateNextReview, DEFAULT_PROGRESS } from '../utils/srs';

export default function FlashcardMode({
  cards,
  direction,
  progressMap,
  onUpdateProgress,
  onComplete,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
    startTime: Date.now(),
  });

  const card = cards[currentIndex];
  const total = cards.length;

  const front =
    direction === 'de-it' ? card?.german : card?.italian;
  const back =
    direction === 'de-it' ? card?.italian : card?.german;
  const exampleFront =
    direction === 'de-it' ? card?.exampleDE : card?.exampleIT;
  const exampleBack =
    direction === 'de-it' ? card?.exampleIT : card?.exampleDE;

  const handleAnswer = useCallback(
    (quality) => {
      if (!card) return;
      const progress = progressMap[card.id] || DEFAULT_PROGRESS;
      const result = calculateNextReview(
        progress.interval,
        progress.easeFactor,
        progress.repetitions,
        quality
      );

      onUpdateProgress(card.id, result);

      const isCorrect = quality !== 'again';
      const newStats = {
        ...sessionStats,
        total: sessionStats.total + 1,
        correct: sessionStats.correct + (isCorrect ? 1 : 0),
      };
      setSessionStats(newStats);

      if (currentIndex + 1 >= total) {
        onComplete(newStats);
      } else {
        setCurrentIndex((i) => i + 1);
        setFlipped(false);
      }
    },
    [card, progressMap, onUpdateProgress, currentIndex, total, onComplete, sessionStats]
  );

  const handleSwipeLeft = useCallback(() => {
    if (flipped) handleAnswer('again');
  }, [flipped, handleAnswer]);

  const handleSwipeRight = useCallback(() => {
    if (flipped) handleAnswer('easy');
  }, [flipped, handleAnswer]);

  const { onTouchStart, onTouchMove, onTouchEnd, swipeOffset, isSwiping } =
    useSwipe(handleSwipeLeft, handleSwipeRight);

  if (!card) return null;

  const progress = ((currentIndex + 1) / total) * 100;

  // Swipe visual feedback
  const swipeBg =
    isSwiping && swipeOffset < -30
      ? 'bg-error/10'
      : isSwiping && swipeOffset > 30
        ? 'bg-success/10'
        : '';

  return (
    <div className={`min-h-dvh flex flex-col ${swipeBg} transition-colors duration-150`}>
      {/* Header */}
      <div className="px-4 py-3 safe-area-top">
        <p className="text-sm text-dark/50 mb-1">
          Card {currentIndex + 1} of {total}
        </p>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card area */}
      <div
        className="flex-1 flex items-center justify-center p-4"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => !isSwiping && setFlipped(!flipped)}
        style={{
          transform: isSwiping ? `translateX(${swipeOffset * 0.3}px) rotate(${swipeOffset * 0.05}deg)` : '',
          transition: isSwiping ? 'none' : 'transform 0.3s ease',
        }}
      >
        <div className="w-full max-w-sm">
          {!flipped ? (
            /* Front */
            <div className="card text-center py-12">
              <p className="text-2xl md:text-3xl font-bold text-dark leading-relaxed">
                {front}
              </p>
              <p className="text-sm text-dark/30 mt-8">
                Tap to reveal
              </p>
            </div>
          ) : (
            /* Back */
            <div className="card text-center py-8 space-y-4">
              <p className="text-xl text-dark/60">{front}</p>
              <p className="text-2xl font-bold text-primary leading-relaxed">
                {back}
              </p>
              {exampleFront && (
                <div className="pt-2 text-left">
                  <p className="text-base text-secondary italic">
                    🇩🇪 {direction === 'de-it' ? exampleFront : exampleBack}
                  </p>
                  <p className="text-base text-dark/50 italic mt-1">
                    🇮🇹 {direction === 'de-it' ? exampleBack : exampleFront}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Answer buttons (only when flipped) */}
      {flipped && (
        <div className="px-4 pb-4 safe-area-bottom">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleAnswer('again')}
              className="bg-error/10 text-error font-semibold rounded-xl py-3 active:scale-95 transition-transform"
            >
              <span className="block text-base">← Again</span>
              <span className="block text-xs mt-0.5 opacity-60">{'<'}1min</span>
            </button>
            <button
              onClick={() => handleAnswer('good')}
              className="bg-warning/20 text-dark font-semibold rounded-xl py-3 active:scale-95 transition-transform"
            >
              <span className="block text-base">Good ✓</span>
              <span className="block text-xs mt-0.5 opacity-60">{'<'}10min</span>
            </button>
            <button
              onClick={() => handleAnswer('easy')}
              className="bg-success/10 text-success font-semibold rounded-xl py-3 active:scale-95 transition-transform"
            >
              <span className="block text-base">Easy →</span>
              <span className="block text-xs mt-0.5 opacity-60">4 days</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
