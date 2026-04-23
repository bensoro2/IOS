import { useRef } from "react";
import { useNavigate } from "react-router-dom";

interface SwipeConfig {
  left?: string;  // path to navigate when swiping left (go forward/right)
  right?: string; // path to navigate when swiping right (go back/left)
  minDistance?: number;
}

export const useSwipeNavigation = ({ left, right, minDistance = 80 }: SwipeConfig) => {
  const navigate = useNavigate();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    // Only trigger if horizontal is dominant and distance is sufficient
    if (Math.abs(deltaX) < minDistance) return;
    if (Math.abs(deltaY) > Math.abs(deltaX) * 0.6) return;

    if (deltaX > 0 && right) {
      navigate(right);
    } else if (deltaX < 0 && left) {
      navigate(left);
    }
  };

  return { onTouchStart, onTouchEnd };
};
