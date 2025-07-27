
'use client';

import { BarChart, BookCheck, Gauge, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaPrk, LifePrk } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, CartesianGrid, XAxis, YAxis, BarChart as RechartsBarChart } from "recharts"

interface AnalyticsData {
  stats: {
    overallProgress: number;
    lifePrksCount: number;
    areaPrksCount: number;
    tasksCompleted: number;
  };
  lifePrks: (LifePrk & { progress: number })[];
  areaPrks: (AreaPrk & { progress: number })[];
  progressOverTime: { date: string; Progreso: number }[];
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

const chartConfig = {
  Progreso: {
    label: "Progreso",
    color: "hsl(var(--primary))",
  },
} satisfies import('@/components/ui/chart').ChartConfig;


export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const { stats, lifePrks, areaPrks, progressOverTime } = data;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Progreso General" value={`${stats.overallProgress}%`} icon={Gauge} />
        <StatCard title="PRKs de Vida Activos" value={stats.lifePrksCount.toString()} icon={Target} />
        <StatCard title="PRKs de Área Activos" value={stats.areaPrksCount.toString()} icon={BarChart} />
        <StatCard title="Acciones Completadas" value={stats.tasksCompleted.toString()} icon={BookCheck} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progreso en los Últimos 30 Días</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <RechartsBarChart accessibilityLayer data={progressOverTime}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 6)}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        unit="%"
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                    />
                    <Bar dataKey="Progreso" fill="var(--color-Progreso)" radius={4} />
                </RechartsBarChart>
            </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PrkTable title="Resumen de PRKs de Vida" items={lifePrks} />
        <PrkTable title="Resumen de PRKs de Área" items={areaPrks} />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
}

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

interface PrkTableProps {
    title: string;
    items: (LifePrk & { progress: number })[] | (AreaPrk & { progress: number })[];
}

function PrkTable({ title, items }: PrkTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60%]">Nombre</TableHead>
                            <TableHead className="text-right">Progreso</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.title}</TableCell>
                                <TableCell className="text-right space-y-2">
                                    <span className="font-bold text-lg">{Math.round(item.progress)}%</span>
                                    <Progress value={item.progress} className="h-2" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
