
import * as React from 'react';
import { Header } from '@/components/header';
import { getDashboardKpiData } from '@/app/actions';
import { KpiDashboard } from '@/components/kpi-dashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const kpiData = await getDashboardKpiData();

  return (
    <>
      <Header hideDatePicker={true} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <KpiDashboard data={kpiData} />
      </main>
    </>
  );
}
