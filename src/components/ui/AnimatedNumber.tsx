import { useEffect, useState } from 'react';
import { animate, useMotionValue } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  /** Format the intermediate numeric value into display text. */
  format?: (n: number) => string;
  /** Tween duration in seconds. */
  duration?: number;
}

export const AnimatedNumber = ({
  value,
  format = (n) => Math.round(n).toString(),
  duration = 0.8,
}: AnimatedNumberProps) => {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(() => format(0));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(format(latest)),
    });
    return () => controls.stop();
    // format is intentionally omitted — we want re-animation only on value change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, motionValue]);

  return <>{display}</>;
};
