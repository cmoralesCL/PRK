'use client';

import { getLifePrkProgressData } from '@/app/actions';
import { ProgressChart } from '@/components/progress-chart';
import { Header } from '@/components/header';
import { useEffect, useState } from 'react';
import type { LifePrkProgressPoint } from '@/lib/types';
import { DateRange } from "react-day-picker"
import { subDays } from "date-fns"
import { DateRangePicker } from '@/components/ui/date-range-picker';

export default function JournalPage() {
  const [chartData, setChartData] = useState<LifePrkProgressPoint[]>([]);
  const [lifePrkNames, setLifePrkNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { chartData, lifePrkNames } = await getLifePrkProgressData(
          dateRange && dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined
        );
        setChartData(chartData);
        setLifePrkNames(lifePrkNames);
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange]);

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
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </div>
          {loading ? (
            <div className="flex items-center justify-center rounded-lg border bg-card text-card-foreground shadow-sm h-96 w-full">
              <h2 className="text-2xl font-headline font-semibold animate-pulse">Cargando gráfico...</h2>
            </div>
          ) : (
             <ProgressChart chartData={chartData} lifePrkNames={lifePrkNames} />
          )}
        </div>
      </main>
    </>
  );
}
