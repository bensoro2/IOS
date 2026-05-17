import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

const NAV_BTN: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 10,
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.2)',
  border: 'none',
  color: 'white',
  fontSize: '28px',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
};

const ImageLightbox = ({ images, initialIndex, onClose }: ImageLightboxProps) => {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const goPrev = () => setIndex(i => Math.max(0, i - 1));
  const goNext = () => setIndex(i => Math.min(images.length - 1, i + 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    didSwipe.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -50) { goNext(); didSwipe.current = true; }
    else if (dx > 50) { goPrev(); didSwipe.current = true; }
  };

  const handleOverlayClick = () => {
    if (didSwipe.current) { didSwipe.current = false; return; }
    onClose();
  };

  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;
  const showNav = images.length > 1;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
      }}
      onClick={handleOverlayClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Image */}
      <img
        key={images[index]}
        src={images[index]}
        alt="Full size"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          paddingLeft: showNav ? '52px' : '16px',
          paddingRight: showNav ? '52px' : '16px',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Close button */}
      <button
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          right: '16px',
          zIndex: 10,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        ✕
      </button>

      {/* Counter */}
      {showNav && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 20px)',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            fontSize: '13px',
            backgroundColor: 'rgba(0,0,0,0.45)',
            padding: '2px 12px',
            borderRadius: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {index + 1} / {images.length}
        </div>
      )}

      {/* Prev button */}
      {showNav && (
        <button
          style={{ ...NAV_BTN, left: '8px', opacity: hasPrev ? 1 : 0.2 }}
          onClick={(e) => { e.stopPropagation(); if (hasPrev) goPrev(); }}
          disabled={!hasPrev}
        >
          ‹
        </button>
      )}

      {/* Next button */}
      {showNav && (
        <button
          style={{ ...NAV_BTN, right: '8px', opacity: hasNext ? 1 : 0.2 }}
          onClick={(e) => { e.stopPropagation(); if (hasNext) goNext(); }}
          disabled={!hasNext}
        >
          ›
        </button>
      )}
    </div>,
    document.body
  );
};

export default ImageLightbox;
