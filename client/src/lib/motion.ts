export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

export const DURATION = {
  instant: 0.12,
  fast: 0.2,
  base: 0.32,
  slow: 0.48,
  signature: 0.8,
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
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.28, ease: EASE_OUT_EXPO },
};

export const cardHover = {
  y: -2,
  transition: { duration: DURATION.fast, ease: EASE_OUT_EXPO },
};

export const pressScale = {
  scale: 0.98,
  transition: { duration: DURATION.instant },
};
