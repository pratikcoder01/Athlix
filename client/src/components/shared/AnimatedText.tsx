'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface AnimatedTextProps extends HTMLMotionProps<"div"> {
  text: string;
  as?: React.ElementType;
  className?: string;
  delay?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  as: Component = 'h1',
  className,
  delay = 0,
  ...props
}) => {
  const MotionComponent = React.useMemo(
    () => motion.create(Component as React.ComponentType<React.HTMLAttributes<HTMLElement>>),
    [Component],
  );

  return (
    <MotionComponent
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {text}
    </MotionComponent>
  );
};
