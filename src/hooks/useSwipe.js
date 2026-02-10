import { useState, useCallback } from 'react';

export const useSwipe = (onSwipeLeft, onSwipeRight, threshold = 50) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swiping, setSwiping] = useState(false);

  const onTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwiping(false);
  }, []);

  const onTouchMove = useCallback(
    (e) => {
      const currentTouch = e.targetTouches[0].clientX;
      setTouchEnd(currentTouch);
      if (touchStart && Math.abs(touchStart - currentTouch) > 10) {
        setSwiping(true);
      }
    },
    [touchStart]
  );

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;

    if (isLeftSwipe && onSwipeLeft) {
      navigator.vibrate?.(50);
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      navigator.vibrate?.(50);
      onSwipeRight();
    }

    setSwiping(false);
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight]);

  const swipeOffset =
    swiping && touchStart && touchEnd ? touchEnd - touchStart : 0;

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeOffset,
    isSwiping: swiping,
  };
};
