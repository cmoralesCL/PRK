
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressCircleProps extends React.SVGProps<SVGSVGElement> {
  progress: number
}

// Function to get color based on progress percentage
const getProgressColor = (progress: number): string => {
  const p = Math.max(0, Math.min(100, progress)); // Cap progress between 0 and 100 for color calculation
  // Hue starts at red (0), goes to orange/yellow (around 40-60), and ends at cyan (183)
  // We'll make it simple: 0 -> 0 (red), 50 -> 40 (orange), 100 -> 183 (cyan)
  let hue;
  if (p < 50) {
    // Interpolate between red (0) and orange (40)
    hue = (p / 50) * 40;
  } else {
    // Interpolate between orange (40) and cyan (183)
    hue = 40 + ((p - 50) / 50) * (183 - 40);
  }
  // Keep saturation and lightness constant for a vibrant look
  const saturation = 90;
  const lightness = 55;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};


export const ProgressCircle = React.forwardRef<
  SVGSVGElement,
  ProgressCircleProps
>(({ className, progress, ...props }, ref) => {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  // We allow progress to go over 100% for the visual effect, but cap it at a high number to avoid weird rendering
  const effectiveProgress = Math.min(progress, 1000); 
  const offset = circumference - (effectiveProgress / 100) * circumference
  const color = getProgressColor(progress);

  return (
    <svg
      ref={ref}
      className={cn("h-16 w-16", className)}
      viewBox="0 0 40 40"
      {...props}
    >
      <circle
        className="text-muted/20"
        strokeWidth="4"
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx="20"
        cy="20"
      />
      <circle
        className="transition-all duration-500 ease-in-out"
        style={{
            strokeDashoffset: offset,
            strokeDasharray: circumference,
            stroke: color,
        }}
        strokeWidth="4"
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx="20"
        cy="20"
        transform="rotate(-90 20 20)"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        className="text-[0.6rem] font-bold fill-current text-foreground"
      >
        {`${Math.round(progress)}%`}
      </text>
    </svg>
  )
})
ProgressCircle.displayName = "ProgressCircle"
