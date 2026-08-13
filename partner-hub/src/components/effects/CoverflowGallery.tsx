"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

export interface CoverflowSlide {
  image?: { src?: string; srcSet?: string; alt?: string };
  title?: string;
  id?: string;
}

type AutoplayDir = "leftToRight" | "rightToLeft";
type TitleCorner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

export interface CoverflowGalleryProps {
  slides?: CoverflowSlide[];
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  tilt?: number;
  sideTilt?: number;
  gap?: number;
  opacity?: number;
  transition?: {
    type?: string;
    duration?: number;
    delay?: number;
    ease?: string | number[];
  };
  autoplay?: boolean;
  autoplayDirection?: AutoplayDir;
  showTitle?: boolean;
  titleFont?: CSSProperties;
  titleColor?: string;
  titlePosition?: {
    position?: TitleCorner;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
  };
  style?: CSSProperties;
  className?: string;
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
}

const PERSPECTIVE = 1600;
const SCALE_STEP = 0.16;
const MAX_VISIBLE = 2;
const DEPTH = 240;

function cssTransition(t: CoverflowGalleryProps["transition"]): {
  dur: number;
  ease: string;
} {
  const dur = t && typeof t.duration === "number" ? t.duration : 0.6;
  let ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  const e = t?.ease;
  if (Array.isArray(e) && e.length === 4) {
    ease = `cubic-bezier(${e[0]}, ${e[1]}, ${e[2]}, ${e[3]})`;
  } else if (typeof e === "string") {
    const map: Record<string, string> = {
      linear: "linear",
      easeIn: "ease-in",
      easeOut: "ease-out",
      easeInOut: "ease-in-out",
    };
    ease = map[e] || "ease";
  }
  return { dur, ease };
}

export default function CoverflowGallery(props: CoverflowGalleryProps) {
  const merged = { ...COMPONENT_DEFAULTS, ...props };
  const {
    slides = COMPONENT_DEFAULTS.slides,
    cardWidth = 400,
    cardHeight = 400,
    radius = 3,
    tilt = 12,
    sideTilt = 8,
    gap = 8,
    opacity = 60,
    transition,
    autoplay = false,
    autoplayDirection = "rightToLeft",
    showTitle = true,
    titleFont,
    titleColor = "#ffffff",
    titlePosition,
    style,
    className,
    activeIndex,
    onActiveChange,
  } = merged;

  const tp = titlePosition || {};
  const corner: TitleCorner = tp.position || "bottomLeft";
  const isTop = corner === "topLeft" || corner === "topRight";
  const isRight = corner === "topRight" || corner === "bottomRight";
  const padLeft = tp.paddingLeft ?? 22;
  const padRight = tp.paddingRight ?? 22;
  const padTop = tp.paddingTop ?? 24;
  const padBottom = tp.paddingBottom ?? 24;

  const list = slides && slides.length ? slides : COMPONENT_DEFAULTS.slides;
  const n = list.length;
  const loop = true;
  const [active, setActive] = useState(activeIndex ?? 0);

  useEffect(() => {
    if (typeof activeIndex === "number") {
      setActive(Math.max(0, Math.min(n - 1, activeIndex)));
    }
  }, [activeIndex, n]);

  useEffect(() => {
    setActive((a) => Math.max(0, Math.min(n - 1, a)));
  }, [n]);

  const moveDur =
    transition && typeof transition.duration === "number"
      ? transition.duration
      : 0.6;
  const lockRef = useRef(false);
  const lock = useCallback(() => {
    lockRef.current = true;
    window.setTimeout(
      () => {
        lockRef.current = false;
      },
      Math.max(50, moveDur * 1000),
    );
  }, [moveDur]);

  const commitActive = useCallback(
    (next: number | ((prev: number) => number)) => {
      setActive((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        onActiveChange?.(value);
        return value;
      });
    },
    [onActiveChange],
  );

  const step = useCallback(
    (dir: number) => {
      if (lockRef.current) return;
      lock();
      commitActive((a) => (((a + dir) % n) + n) % n);
    },
    [n, lock, commitActive],
  );

  const handleCardClick = useCallback(
    (i: number) => {
      if (autoplay || lockRef.current) return;
      lock();
      commitActive((a) => (i === a ? (a + 1) % n : i));
    },
    [autoplay, n, lock, commitActive],
  );

  const delay =
    transition && typeof transition.delay === "number"
      ? transition.delay
      : 2.5;
  useEffect(() => {
    if (!autoplay || n < 2) return;
    const ms = Math.max(0.3, delay) * 1000;
    const dir = autoplayDirection === "leftToRight" ? -1 : 1;
    const id = window.setInterval(() => step(dir), ms);
    return () => window.clearInterval(id);
  }, [autoplay, autoplayDirection, delay, n, step]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    },
    [step],
  );

  const { dur, ease } = cssTransition(transition);
  const transitionCss = `transform ${dur}s ${ease}, opacity ${dur}s ${ease}`;

  const effectiveRadius =
    (Math.max(0, Math.min(20, radius)) / 20) *
    (Math.min(cardWidth, cardHeight) / 2);
  const dim = 1 - Math.max(0, Math.min(100, opacity)) / 100;

  const rootStyle: CSSProperties = {
    ...(style || {}),
    position: "relative",
    width: "100%",
    height: "100%",
    minWidth: 280,
    minHeight: 320,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    perspective: `${PERSPECTIVE}px`,
    overflow: "hidden",
    outline: "none",
  };

  return (
    <div
      className={className}
      style={rootStyle}
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      onKeyDown={onKeyDown}
    >
      <div
        style={{
          position: "relative",
          width: cardWidth,
          height: cardHeight,
          transformStyle: "preserve-3d",
        }}
      >
        {list.map((slide, i) => {
          let rel = i - active;
          if (loop) {
            if (rel > n / 2) rel -= n;
            if (rel < -n / 2) rel += n;
          }
          const ax = Math.abs(rel);
          const visible = ax <= MAX_VISIBLE;
          const isActive = rel === 0;
          const sc = Math.max(0.4, 1 - ax * SCALE_STEP);
          const tx = rel * (gap * 30);
          const tz = -ax * DEPTH;
          const ry = -rel * tilt;
          const rz = rel * sideTilt;
          const src = slide.image?.src || "";

          const cardStyle: CSSProperties = {
            position: "absolute",
            left: "50%",
            top: "50%",
            width: cardWidth,
            height: cardHeight,
            borderRadius: effectiveRadius,
            overflow: "hidden",
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
            transform: `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`,
            transition: transitionCss,
            opacity: visible ? 1 : 0,
            cursor: autoplay || isActive ? "default" : "pointer",
            pointerEvents: visible && !autoplay ? "auto" : "none",
            backgroundColor: "#0A1628",
          };

          return (
            <div
              key={slide.id ?? i}
              style={cardStyle}
              onClick={() => handleCardClick(i)}
              aria-label={slide.title}
              aria-hidden={!visible}
            >
              {src ? (
                <img
                  src={src}
                  alt={slide.image?.alt || slide.title || ""}
                  draggable={false}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    userSelect: "none",
                  }}
                />
              ) : null}

              {showTitle && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: isTop
                        ? "linear-gradient(0deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)"
                        : "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: padLeft,
                      right: padRight,
                      [isTop ? "top" : "bottom"]: isTop ? padTop : padBottom,
                      textAlign: isRight ? "right" : "left",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        color: titleColor,
                        fontSize: 28,
                        fontWeight: 700,
                        lineHeight: "1.1em",
                        letterSpacing: "-0.02em",
                        whiteSpace: "pre-line",
                        textShadow: "0 2px 10px rgba(0,0,0,0.4)",
                        ...(titleFont || {}),
                      }}
                    >
                      {slide.title}
                    </span>
                  </div>
                </>
              )}

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#000000",
                  opacity: isActive ? 0 : dim,
                  transition: `opacity ${dur}s ${ease}`,
                  pointerEvents: "none",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const COMPONENT_DEFAULTS = {
  slides: [] as CoverflowSlide[],
  cardWidth: 360,
  cardHeight: 420,
  radius: 3,
  tilt: 12,
  sideTilt: 8,
  gap: 8,
  opacity: 60,
  autoplay: false,
  autoplayDirection: "rightToLeft" as AutoplayDir,
  transition: {
    type: "tween",
    duration: 0.6,
    delay: 2.5,
    ease: [0.22, 1, 0.36, 1] as number[],
  },
  showTitle: true,
  titleFont: {
    fontFamily: "inherit",
    fontSize: "1.35rem",
    letterSpacing: "-0.02em",
    lineHeight: "1.1em",
  } as CSSProperties,
  titleColor: "#ffffff",
  titlePosition: {
    position: "bottomLeft" as TitleCorner,
    paddingLeft: 22,
    paddingRight: 22,
    paddingTop: 24,
    paddingBottom: 24,
  },
};
