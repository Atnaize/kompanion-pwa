import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}

export const ProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#FF4B00',
  backgroundColor = '#E5E7EB',
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  // Calculate font size proportional to ring size (roughly 20% of size)
  const fontSize = Math.max(12, size * 0.2);

  // Rotate only the arcs (so progress starts at 12 o'clock) using SVG's own
  // transform attribute. We deliberately don't rotate the whole <svg> via CSS:
  // iOS Safari resolves `transform-origin: center` on inner SVG nodes against
  // the SVG viewport, not the element's bounding box, which threw the % label
  // off-screen on iPhone. Keeping the text un-rotated avoids the issue
  // entirely.
  const rotateArc = `rotate(-90 ${size / 2} ${size / 2})`;

  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
        fill="none"
        transform={rotateArc}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeLinecap="round"
        transform={rotateArc}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-gray-900 font-bold dark:fill-gray-50"
        style={{ fontSize: `${fontSize}px` }}
      >
        <AnimatedNumber value={progress} format={(n) => `${Math.round(n)}%`} duration={1} />
      </text>
    </svg>
  );
};
