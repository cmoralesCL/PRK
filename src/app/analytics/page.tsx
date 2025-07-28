
import { Header } from '@/components/header';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { getAnalyticsData } from '@/app/server/queries';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    const data = await getAnalyticsData();
    return (
        <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                     <AnalyticsDashboard data={data} />
                </div>
            </main>
        </div>
    );
}
