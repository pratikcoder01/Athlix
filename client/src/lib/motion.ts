export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

export const DURATION = {
  instant: 0.12,
  fast: 0.2,
  base: 0.35,
  slow: 0.35,
  signature: 0.35,
} as const;

export const fadeUp = (delay = 0) => ({
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay, duration: DURATION.base, ease: EASE_OUT_EXPO },
  },
});

export const reveal = (delay = 0) => ({
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay, duration: DURATION.base, ease: EASE_OUT_EXPO },
  },
});

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: DURATION.base, ease: EASE_OUT_EXPO },
};

export const cardHover = {
  y: -2,
  transition: { duration: DURATION.fast, ease: EASE_OUT_EXPO },
};

export const pressScale = {
  scale: 0.99,
  transition: { duration: DURATION.instant, ease: EASE_OUT_EXPO },
};
