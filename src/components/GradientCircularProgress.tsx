import { cn } from "@/lib/utils";

interface GradientCircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  gradientId: string;
  gradientColors: { offset: string; color: string }[];
  backgroundColor?: string;
  children?: React.ReactNode;
  className?: string;
}

export const GradientCircularProgress = ({
  value,
  max = 100,
  size = 240,
  strokeWidth = 16,
  gradientId,
  gradientColors,
  backgroundColor = "rgba(255, 255, 255, 0.2)",
  children,
  className,
}: GradientCircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = (value / max) * 100;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {gradientColors.map((color, index) => (
              <stop key={index} offset={color.offset} stopColor={color.color} />
            ))}
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};
