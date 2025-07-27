
'use client';

import { useState } from 'react';
import { BarChart, BookCheck, CalendarCheck, CalendarDays, Gauge, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaPrk } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, CartesianGrid, XAxis, YAxis, BarChart as RechartsBarChart } from "recharts"
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

type ChartData = { date: string; Progreso: number }[];

interface AnalyticsData {
  stats: {
    overallProgress: number;
    weeklyProgress: number;
    monthlyProgress: number;
    quarterlyProgress: number;
    lifePrksCount: number;
    areaPrksCount: number;
    tasksCompleted: number;
  };
  areaPrks: (AreaPrk & { progress: number; monthlyProgress: number })[];
  progressOverTime: {
    weekly: ChartData;
    monthly: ChartData;
    quarterly: ChartData;
    yearly: ChartData;
  };
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const { stats, areaPrks, progressOverTime } = data;
  
  return (
    <div className="space-y-8">
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Resumen de Progreso</CardTitle>
          <CardDescription>
            Tu rendimiento en diferentes períodos de tiempo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Progreso Semanal" value={`${stats.weeklyProgress}%`} icon={CalendarCheck} />
            <StatCard title="Progreso Mensual" value={`${stats.monthlyProgress}%`} icon={CalendarDays} />
            <StatCard title="Progreso Trimestral" value={`${stats.quarterlyProgress}%`} icon={TrendingUp} />
            <StatCard title="Progreso General" value={`${stats.overallProgress}%`} icon={Gauge} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Resumen de PRKs de Área</CardTitle>
            <CardDescription>
                Un desglose del progreso acumulado y del mes actual para cada área.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Nombre del PRK de Área</TableHead>
                        <TableHead className="text-center">Progreso del Mes</TableHead>
                        <TableHead className="text-center">Progreso Acumulado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {areaPrks.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell className="text-center">
                                <ProgressBadge progress={item.monthlyProgress} />
                            </TableCell>
                            <TableCell className="text-center">
                                <ProgressBadge progress={item.progress} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>

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
    <div className="p-4 border rounded-lg flex flex-row items-center justify-between">
       <div className="flex flex-col space-y-1">
         <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
         <p className="text-2xl font-bold">{value}</p>
       </div>
       <div className="p-3 rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
       </div>
    </div>
  );
}

function ProgressBadge({ progress }: { progress: number }) {
    const value = Math.round(progress);
    const getBadgeClass = () => {
        if (value >= 75) return 'bg-green-100 text-green-800 border-green-200';
        if (value >= 40) return 'bg-orange-100 text-orange-800 border-orange-200';
        return 'bg-red-100 text-red-800 border-red-200';
    };

    return (
        <Badge variant="outline" className={cn("text-base font-bold", getBadgeClass())}>
            {value}%
        </Badge>
    );
}
