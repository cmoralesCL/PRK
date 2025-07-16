'use client';

import { getLifePrkProgressData } from '@/app/actions';
import { ProgressChart } from '@/components/progress-chart';
import { Header } from '@/components/header';
import { useEffect, useState } from 'react';
import type { LifePrkProgressPoint } from '@/lib/types';

export default function JournalPage() {
  const [chartData, setChartData] = useState<LifePrkProgressPoint[]>([]);
  const [lifePrkNames, setLifePrkNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { chartData, lifePrkNames } = await getLifePrkProgressData();
        setChartData(chartData);
        setLifePrkNames(lifePrkNames);
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <Header
        onAddLifePrk={() => {}}
        selectedDate={new Date()}
        onDateChange={() => {}}
        hideDatePicker
        hideAddButton
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold font-headline">Diario Evolutivo</h1>
            <p className="mt-1 text-muted-foreground">
              Visualización del progreso de tus PRKs de Vida en los últimos 30 días.
            </p>
          </div>
          {loading ? (
            <div className="text-center py-24">
              <h2 className="text-2xl font-headline font-semibold">Cargando gráfico...</h2>
            </div>
          ) : (
             <ProgressChart chartData={chartData} lifePrkNames={lifePrkNames} />
          )}
        </div>
      </main>
    </>
  );
}
