
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

    const orbitId = searchParams.get('orbitId');
    const phaseId = searchParams.get('phaseId');
    const pulseId = searchParams.get('pulseId');

    useEffect(() => {
        setIsLoading(true);
        startTransition(async () => {
            try {
                // For now, we still fetch all data, but this sets up for future filtering
                const analyticsData = await getAnalyticsData({
                    orbitId: orbitId || undefined,
                    phaseId: phaseId || undefined,
                    pulseId: pulseId || undefined,
                });
                setData(analyticsData);
            } catch (error) {
                console.error("Failed to load analytics data:", error);
                setData(null);
            } finally {
                setIsLoading(false);
            }
        });
    }, [orbitId, phaseId, pulseId]);

    const handleFilterChange = (filters: { orbitId?: string | null; phaseId?: string | null; pulseId?: string | null; }) => {
        const params = new URLSearchParams();
        if (filters.orbitId) {
            params.set('orbitId', filters.orbitId);
        }
        if (filters.phaseId) {
            params.set('phaseId', filters.phaseId);
        }
        if (filters.pulseId) {
            params.set('pulseId', filters.pulseId);
        }
        router.push(`/analytics?${params.toString()}`);
    };

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 {isLoading || !data ? (
                    <AnalyticsSkeleton />
                 ) : (
                    <AnalyticsDashboard 
                        data={data} 
                        onFilterChange={handleFilterChange}
                        filters={{ orbitId, phaseId, pulseId }}
                    />
                 )}
            </div>
        </main>
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
