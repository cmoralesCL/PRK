"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressCircleProps extends React.SVGProps<SVGSVGElement> {
  progress: number
}

export const ProgressCircle = React.forwardRef<
  SVGSVGElement,
  ProgressCircleProps
>(({ className, progress, ...props }, ref) => {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

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
        className="text-primary transition-all duration-500 ease-in-out"
        style={{
            strokeDashoffset: offset,
            strokeDasharray: circumference,
        }}
        strokeWidth="4"
        strokeLinecap="round"
        stroke="currentColor"
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
        className="text-sm font-bold fill-current text-foreground"
      >
        {`${Math.round(progress)}%`}
      </text>
    </svg>
  )
})
ProgressCircle.displayName = "ProgressCircle"
