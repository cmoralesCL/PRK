'use client';

import { TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { LifePrkProgressPoint } from '@/lib/types';

interface ProgressChartProps {
    chartData: LifePrkProgressPoint[];
    lifePrkNames: Record<string, string>;
    timeRangeDescription: string;
}

// Generate an array of HSL colors for the chart
const generateHslColors = (count: number): string[] => {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * (360 / (count + 1))) % 360;
        // Using high saturation and mid-lightness for vibrant but not neon colors
        colors.push(`hsl(${hue}, 90%, 55%)`);
    }
    return colors;
};


export function ProgressChart({ chartData, lifePrkNames, timeRangeDescription }: ProgressChartProps) {
  const lifePrkIds = Object.keys(lifePrkNames);
  const colors = generateHslColors(lifePrkIds.length);
  
  const chartConfig = lifePrkIds.reduce((config, id, index) => {
    config[id] = {
      label: lifePrkNames[id],
      color: colors[index],
    };
    return config;
  }, {} as any);

  if (chartData.length === 0 || lifePrkIds.length === 0) {
    return (
        <Card className="bg-card/70 shadow-md">
            <CardHeader>
                <CardTitle>Progreso de PRKs de Vida</CardTitle>
                <CardDescription>No hay datos suficientes para mostrar el gráfico.</CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center">
                 <p className="text-muted-foreground">Crea un PRK de Vida y registra progreso para ver la evolución.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="bg-card/70 shadow-md">
      <CardHeader>
        <CardTitle>Progreso de PRKs de Vida</CardTitle>
        <CardDescription>{timeRangeDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-96 w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 20, // Increased bottom margin for angled labels
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={50} // Adjust height to fit labels
            />
            <YAxis 
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            {lifePrkIds.map(id => (
                <Line
                    key={id}
                    dataKey={id}
                    type="monotone"
                    stroke={`var(--color-${id})`}
                    strokeWidth={2}
                    dot={false}
                    name={lifePrkNames[id]}
                />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Tu progreso general tiende a subir <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Análisis de la tendencia de cumplimiento.
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
