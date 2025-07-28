
'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

interface ChartDataItem {
    [key: string]: string | number;
    Progreso: number;
}

interface ProgressChartProps {
  data: ChartDataItem[];
  dataKey: string;
}

export function ProgressChart({ data, dataKey }: ProgressChartProps) {
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
          dataKey={dataKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.toString()}
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
