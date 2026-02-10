import { useState, useCallback, useRef, useEffect } from 'react';
import { calculateNextReview, DEFAULT_PROGRESS } from '../utils/srs';
import { validateTranslation } from '../utils/validation';

export default function TranslationMode({
  cards,
  direction,
  progressMap,
  onUpdateProgress,
  onComplete,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
    startTime: Date.now(),
  });
  const textareaRef = useRef(null);

  const card = cards[currentIndex];
  const total = cards.length;

  // The sentence to translate
  const prompt =
    direction === 'de-it' ? card?.exampleDE || card?.german : card?.exampleIT || card?.italian;
  // The correct answer
  const correctAnswer =
    direction === 'de-it' ? card?.exampleIT || card?.italian : card?.exampleDE || card?.german;

  const promptLabel =
    direction === 'de-it' ? 'Translate to Italian:' : 'Translate to German:';

  useEffect(() => {
    if (!result && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentIndex, result]);

  const handleCheck = useCallback(() => {
    if (!answer.trim()) return;
    const validation = validateTranslation(answer, correctAnswer);
    setResult(validation);
  }, [answer, correctAnswer]);

  const handleAnswer = useCallback(
    (quality) => {
      if (!card) return;
      const progress = progressMap[card.id] || DEFAULT_PROGRESS;
      const srsResult = calculateNextReview(
        progress.interval,
        progress.easeFactor,
        progress.repetitions,
        quality
      );

      onUpdateProgress(card.id, srsResult);

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
        setAnswer('');
        setResult(null);
      }
    },
    [card, progressMap, onUpdateProgress, currentIndex, total, onComplete, sessionStats]
  );

  if (!card) return null;

  const progress = ((currentIndex + 1) / total) * 100;

  const statusColors = {
    perfect: 'bg-success/10 border-success text-success',
    close: 'bg-warning/10 border-warning text-dark',
    wrong: 'bg-error/10 border-error text-error',
  };

  const statusIcons = {
    perfect: '🎯',
    close: '💡',
    wrong: '❌',
  };

  return (
    <div className="min-h-dvh flex flex-col">
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

      {/* Content */}
      <div className="flex-1 p-4">
        {!result ? (
          /* Question */
          <div className="space-y-4">
            <p className="text-base text-dark/60 font-medium">
              ✍️ {promptLabel}
            </p>
            <p className="text-2xl font-bold text-dark leading-relaxed">
              {prompt}
            </p>
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write your translation here..."
              className="w-full h-32 p-4 text-lg rounded-xl border-2 border-gray-200
                focus:border-secondary focus:outline-none transition-colors resize-none"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        ) : (
          /* Result */
          <div className="animate-slide-up space-y-4">
            <div
              className={`p-4 rounded-xl border-2 ${statusColors[result.status]}`}
            >
              <p className="text-lg font-bold">
                {statusIcons[result.status]} {result.message}
              </p>
            </div>

            <div className="card space-y-4">
              <div>
                <p className="text-sm text-dark/40 mb-1">Your answer:</p>
                <p className="text-lg text-dark">{answer}</p>
              </div>

              <div>
                <p className="text-sm text-dark/40 mb-1">Correct answer:</p>
                <p className="text-lg text-secondary font-medium">
                  {correctAnswer}
                </p>
              </div>

              {result.differences.length > 0 && (
                <div>
                  <p className="text-sm text-dark/40 mb-1">
                    💡 Differences:
                  </p>
                  {result.differences.map((diff, i) => (
                    <p key={i} className="text-base">
                      <span className="text-error line-through">
                        {diff.user}
                      </span>{' '}
                      →{' '}
                      <span className="text-success font-medium">
                        {diff.correct}
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-4 pb-4 safe-area-bottom">
        {!result ? (
          <button
            onClick={handleCheck}
            disabled={!answer.trim()}
            className="btn-primary w-full disabled:opacity-50"
          >
            Check answer
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleAnswer('again')}
              className="bg-error/10 text-error font-semibold rounded-xl py-3 active:scale-95 transition-transform"
            >
              <span className="block text-base">← Again</span>
            </button>
            <button
              onClick={() => handleAnswer('good')}
              className="bg-warning/20 text-dark font-semibold rounded-xl py-3 active:scale-95 transition-transform"
            >
              <span className="block text-base">Good ✓</span>
            </button>
            <button
              onClick={() => handleAnswer('easy')}
              className="bg-success/10 text-success font-semibold rounded-xl py-3 active:scale-95 transition-transform"
            >
              <span className="block text-base">Easy →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
