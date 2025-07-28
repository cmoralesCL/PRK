
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { Header } from '@/components/header';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { getAnalyticsData } from '@/app/server/queries';
import type { AnalyticsData } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    
    const router = useRouter();
    const searchParams = useSearchParams();

    const lifePrkId = searchParams.get('lifePrkId');
    const areaPrkId = searchParams.get('areaPrkId');
    const habitTaskId = searchParams.get('habitTaskId');

    useEffect(() => {
        setIsLoading(true);
        startTransition(async () => {
            try {
                // For now, we still fetch all data, but this sets up for future filtering
                const analyticsData = await getAnalyticsData({
                    lifePrkId: lifePrkId || undefined,
                    areaPrkId: areaPrkId || undefined,
                    habitTaskId: habitTaskId || undefined,
                });
                setData(analyticsData);
            } catch (error) {
                console.error("Failed to load analytics data:", error);
                setData(null);
            } finally {
                setIsLoading(false);
            }
        });
    }, [lifePrkId, areaPrkId, habitTaskId]);

    const handleFilterChange = (filters: { lifePrkId?: string | null; areaPrkId?: string | null; habitTaskId?: string | null; }) => {
        const params = new URLSearchParams();
        if (filters.lifePrkId) {
            params.set('lifePrkId', filters.lifePrkId);
        }
        if (filters.areaPrkId) {
            params.set('areaPrkId', filters.areaPrkId);
        }
        if (filters.habitTaskId) {
            params.set('habitTaskId', filters.habitTaskId);
        }
        router.push(`/analytics?${params.toString()}`);
    };

    return (
        <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                     {isLoading || !data ? (
                        <AnalyticsSkeleton />
                     ) : (
                        <AnalyticsDashboard 
                            data={data} 
                            onFilterChange={handleFilterChange}
                            filters={{ lifePrkId, areaPrkId, habitTaskId }}
                        />
                     )}
                </div>
            </main>
        </div>
    );
}

function AnalyticsSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
        </div>
    )
}
