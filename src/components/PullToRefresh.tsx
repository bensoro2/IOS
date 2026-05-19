import { forwardRef, useState, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const PULL_THRESHOLD = 70;

const PullToRefresh = forwardRef<HTMLDivElement, PullToRefreshProps>(
  ({ onRefresh, children, className, style }, forwardedRef) => {
    const [pullY, setPullY] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startYRef = useRef(0);
    const isPullingRef = useRef(false);
    const internalRef = useRef<HTMLDivElement>(null);

    const setRefs = useCallback(
      (el: HTMLDivElement | null) => {
        (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        if (typeof forwardedRef === "function") {
          forwardedRef(el);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }
      },
      [forwardedRef]
    );

    const handleTouchStart = (e: React.TouchEvent) => {
      const el = internalRef.current;
      if (!el || el.scrollTop > 5 || isRefreshing) return;
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        isPullingRef.current = false;
        setPullY(0);
        return;
      }
      setPullY(Math.min(dy * 0.5, PULL_THRESHOLD * 1.5));
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;
      const captured = pullY;
      setPullY(0);
      if (captured >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    const indicatorH = isRefreshing ? 48 : Math.min(pullY * (48 / PULL_THRESHOLD), 48);
    const indicatorOpacity = isRefreshing ? 1 : Math.min(pullY / PULL_THRESHOLD, 1);
    const shouldSpin = isRefreshing || pullY >= PULL_THRESHOLD;

    return (
      <div
        ref={setRefs}
        className={className}
        style={style}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            height: `${indicatorH}px`,
            opacity: indicatorOpacity,
            transition: pullY === 0 ? "height 0.3s ease, opacity 0.3s ease" : "none",
          }}
        >
          {(pullY > 8 || isRefreshing) && (
            <Loader2
              className={cn(
                "w-5 h-5 text-muted-foreground",
                shouldSpin && "animate-spin"
              )}
            />
          )}
        </div>
        {children}
      </div>
    );
  }
);

PullToRefresh.displayName = "PullToRefresh";
export default PullToRefresh;
