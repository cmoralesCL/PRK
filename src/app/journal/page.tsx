'use client';

import { getLifePrkProgressData } from '@/app/actions';
import { ProgressChart } from '@/components/progress-chart';
import { Header } from '@/components/header';
import { useEffect, useState } from 'react';
import type { LifePrkProgressPoint, TimeRangeOption } from '@/lib/types';
import { DateRange } from "react-day-picker"
import { subDays, subMonths, subYears } from "date-fns"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"


export default function JournalPage() {
  const [chartData, setChartData] = useState<LifePrkProgressPoint[]>([]);
  const [lifePrkNames, setLifePrkNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('30d');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [timeRangeDescription, setTimeRangeDescription] = useState('Últimos 30 días');

  useEffect(() => {
    let from: Date;
    const to = new Date();
    let description = '';

    switch (timeRange) {
      case '7d':
        from = subDays(to, 6);
        description = 'Últimos 7 días';
        break;
      case '3m':
        from = subMonths(to, 3);
        description = 'Últimos 3 meses';
        break;
      case '1y':
        from = subYears(to, 1);
        description = 'Último año';
        break;
      case '30d':
      default:
        from = subDays(to, 29);
        description = 'Últimos 30 días';
        break;
    }
    setDateRange({ from, to });
    setTimeRangeDescription(description);
  }, [timeRange]);

  useEffect(() => {
    // Don't fetch data until the date range is set
    if (!dateRange || !dateRange.from || !dateRange.to) {
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const { chartData, lifePrkNames } = await getLifePrkProgressData({
          from: dateRange.from!,
          to: dateRange.to!,
          timeRange: timeRange
        });
        setChartData(chartData);
        setLifePrkNames(lifePrkNames);
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange, timeRange]);

  return (
    <>
      <Header
        onAddLifePrk={() => {}}
        selectedDate={new Date()} // Not used, but required by prop
        onDateChange={() => {}} // Not used, but required by prop
        hideDatePicker
        hideAddButton
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold font-headline">Diario Evolutivo</h1>
              <p className="mt-1 text-muted-foreground">
                Visualización del progreso de tus PRKs de Vida.
              </p>
            </div>
            <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRangeOption)}>
                <TabsList>
                    <TabsTrigger value="7d">7 Días</TabsTrigger>
                    <TabsTrigger value="30d">30 Días</TabsTrigger>
                    <TabsTrigger value="3m">3 Meses</TabsTrigger>
                    <TabsTrigger value="1y">1 Año</TabsTrigger>
                </TabsList>
            </Tabs>
          </div>
          {loading ? (
            <div className="flex items-center justify-center rounded-lg border bg-card text-card-foreground shadow-sm h-96 w-full">
              <h2 className="text-2xl font-headline font-semibold animate-pulse">Cargando gráfico...</h2>
            </div>
          ) : (
             <ProgressChart chartData={chartData} lifePrkNames={lifePrkNames} timeRangeDescription={timeRangeDescription} />
          )}
        </div>
      </main>
    </>
  );
}
