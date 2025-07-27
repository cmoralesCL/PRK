
import * as React from 'react';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { getAnalyticsDashboardData } from '@/app/actions';
import { Header } from '@/components/header';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const analyticsData = await getAnalyticsDashboardData();

  return (
    <>
        <Header hideDatePicker={true} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnalyticsDashboard data={analyticsData} />
        </main>
    </>
  );
}
