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

  return (
    <svg width={size} height={size} className="-rotate-90 transform">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
        fill="none"
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
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="rotate-90 transform fill-gray-900 font-bold"
        style={{ transformOrigin: 'center', fontSize: `${fontSize}px` }}
      >
        <AnimatedNumber value={progress} format={(n) => `${Math.round(n)}%`} duration={1} />
      </text>
    </svg>
  );
};
