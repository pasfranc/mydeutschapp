/**
 * SM-2 Spaced Repetition Algorithm
 */

export const calculateNextReview = (
  interval,
  easeFactor,
  repetitions,
  quality
) => {
  let newInterval = interval;
  let newEaseFactor = easeFactor;
  let newRepetitions = repetitions;

  const qualityMap = { again: 0, good: 3, easy: 5 };
  const q = qualityMap[quality];

  newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  if (q < 3) {
    newRepetitions = 0;
    newInterval = 0;
  } else {
    newRepetitions += 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }

    if (quality === 'easy') {
      newInterval = Math.round(newInterval * 1.3);
    }
  }

  const now = new Date();
  const nextReview = new Date(
    now.getTime() + newInterval * 24 * 60 * 60 * 1000
  );

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    nextReview: nextReview.toISOString(),
    lastReviewed: now.toISOString(),
  };
};

export const getCardsToReview = (progressArray) => {
  const now = new Date();

  return progressArray
    .filter((p) => {
      const nextReview = new Date(p.nextReview);
      return nextReview <= now;
    })
    .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview));
};

export const DEFAULT_PROGRESS = {
  interval: 0,
  easeFactor: 2.5,
  repetitions: 0,
  lastReviewed: null,
  nextReview: new Date(0).toISOString(),
};
