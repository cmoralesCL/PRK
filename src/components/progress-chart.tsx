
'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Line, LineChart } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

interface ProgressChartProps {
  data: { date: string; Progreso: number }[];
}

export function ProgressChart({ data }: ProgressChartProps) {
    const chartConfig = {
      Progreso: {
        label: "Progreso",
        color: "hsl(var(--primary))",
      },
    }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-80">
      <LineChart
        accessibilityLayer
        data={data}
        margin={{
          top: 5,
          right: 20,
          left: -10,
          bottom: 5,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
        />
        <ChartTooltip
          cursor={true}
          content={<ChartTooltipContent indicator="line" />}
        />
         <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="Progreso"
          type="monotone"
          stroke="var(--color-Progreso)"
          strokeWidth={2}
          dot={{
            r: 4,
            fill: "var(--color-Progreso)",
            strokeWidth: 2,
            stroke: 'hsl(var(--background))'
          }}
        />
      </LineChart>
    </ChartContainer>
  );
}
