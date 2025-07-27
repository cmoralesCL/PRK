
import * as React from 'react';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { getAnalyticsDashboardData, addLifePrk } from '@/app/actions';
import { Header } from '@/components/header';
import { AddLifePrkDialog } from '@/components/add-life-prk-dialog';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const analyticsData = await getAnalyticsDashboardData();

  // Esta función no se usará directamente aquí, pero es necesaria para el Header
  const handleAddLifePrk = async () => {
    'use server';
    // Lógica para abrir el diálogo o redirigir,
    // pero por ahora podemos mantenerlo simple ya que el botón estará en el header.
  };

  return (
    <>
        <Header onAddLifePrk={() => {
          // Esta es una solución temporal. Idealmente, el estado del diálogo
          // se manejaría en un componente cliente padre.
          // Como el Header es el mismo en todas partes, esta prop es necesaria.
        }} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnalyticsDashboard data={analyticsData} />
        </main>
    </>
  );
}
