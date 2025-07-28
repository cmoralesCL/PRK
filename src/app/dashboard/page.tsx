
'use client';

import * as React from 'react';
import { useTransition, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Header } from '@/components/header';
import { getDashboardKpiData } from '@/app/server/queries';
import { KpiDashboard } from '@/components/kpi-dashboard';
import { KpiData } from '@/lib/types';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let dateString = searchParams.get('date');
    if (!dateString) {
      dateString = format(new Date(), 'yyyy-MM-dd');
      // Update URL without a full page reload
      router.replace(`/dashboard?date=${dateString}`, { scroll: false });
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        if(dateString) {
          const data = await getDashboardKpiData(dateString);
          setKpiData(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setKpiData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

  }, [searchParams, router]);

  return (
    <>
      <Header hideDatePicker={true} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-24">
            <h2 className="text-2xl font-headline font-semibold">Cargando KPIs...</h2>
          </div>
        ) : kpiData ? (
          <KpiDashboard data={kpiData} />
        ) : (
           <div className="text-center py-24">
            <h2 className="text-2xl font-headline font-semibold">No se pudieron cargar los datos</h2>
            <p className="mt-2 text-muted-foreground">Por favor, intenta refrescar la página.</p>
          </div>
        )}
      </main>
    </>
  );
}
