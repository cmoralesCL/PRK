

'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

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

    const level = (searchParams.get('level') as 'orbits' | 'phases' | 'pulses') || 'orbits';
    const orbitId = searchParams.get('orbitId');
    const phaseId = searchParams.get('phaseId');

    useEffect(() => {
        setIsLoading(true);
        startTransition(async () => {
            try {
                const analyticsData = await getAnalyticsData({
                    level: level,
                    orbitId: orbitId || undefined,
                    phaseId: phaseId || undefined,
                });
                setData(analyticsData);
            } catch (error) {
                console.error("Failed to load analytics data:", error);
                setData(null);
            } finally {
                setIsLoading(false);
            }
        });
    }, [level, orbitId, phaseId]);

    const handleFilterChange = (filters: { level: 'orbits' | 'phases' | 'pulses'; orbitId?: string | null; phaseId?: string | null; }) => {
        const params = new URLSearchParams();
        params.set('level', filters.level);
        if (filters.orbitId) {
            params.set('orbitId', filters.orbitId);
        }
        if (filters.phaseId) {
            params.set('phaseId', filters.phaseId);
        }
        router.push(`/analytics?${params.toString()}`);
    };

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-headline">Analítica</h1>
                    <p className="text-muted-foreground">Explora el progreso por Órbitas, Fases y Pulsos.</p>
                </div>
                 {isLoading || !data ? (
                    <AnalyticsSkeleton />
                 ) : (
                    <AnalyticsDashboard 
                        data={data} 
                        onFilterChange={handleFilterChange}
                        filters={{ level, orbitId, phaseId }}
                    />
                 )}
            </div>
        </main>
    );
}

function AnalyticsSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <Skeleton className="h-96" />
        </div>
    )
}
