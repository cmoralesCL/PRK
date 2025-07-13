import type { LifePrk, AreaPrk, HabitTask } from './types';

const lifePrks: LifePrk[] = [
  {
    id: 'life-1',
    title: 'Alcanzar la Independencia Financiera',
    description: 'Construir suficiente riqueza para vivir de inversiones y flujos de ingresos pasivos, proporcionando libertad y seguridad.',
  },
];

const areaPrks: AreaPrk[] = [
  {
    id: 'area-1',
    lifePrkId: 'life-1',
    title: 'Incrementar Valor del Portafolio',
    currentValue: 250000,
    targetValue: 1000000,
    unit: 'USD',
  },
  {
    id: 'area-2',
    lifePrkId: 'life-1',
    title: 'Generar Ingreso Pasivo Anual',
    currentValue: 5000,
    targetValue: 40000,
    unit: 'USD',
  },
  {
    id: 'area-3',
    lifePrkId: 'life-1',
    title: 'Reducir Deudas de Consumo',
    currentValue: 15000,
    targetValue: 0,
    unit: 'USD',
  },
];

const habitTasks: HabitTask[] = [
  { id: 'task-1', areaPrkId: 'area-1', title: 'Invertir $1,000 mensuales en fondos indexados', type: 'habit', completed: false },
  { id: 'task-2', areaPrkId: 'area-1', title: 'Revisar el rendimiento trimestral de la inversión', type: 'task', completed: false },
  { id: 'task-3', areaPrkId: 'area-2', title: 'Desarrollar y lanzar un nuevo producto digital', type: 'task', completed: false },
  { id: 'task-4', areaPrkId: 'area-2', title: 'Escribir un artículo de blog semanal sobre finanzas', type: 'habit', completed: true },
  { id: 'task-5', areaPrkId: 'area-3', title: 'Realizar un pago extra de $200 a la tarjeta de crédito', type: 'habit', completed: false },
  { id: 'task-6', areaPrkId: 'area-3', title: 'Crear un presupuesto mensual y adherirse a él', type: 'task', completed: true },
];

export const getInitialData = () => ({
  lifePrks,
  areaPrks,
  habitTasks,
});
