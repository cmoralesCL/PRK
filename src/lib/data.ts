import type { LifePrk, AreaPrk, HabitTask } from './types';

const lifePrks: LifePrk[] = [
  {
    id: 'life-1',
    title: 'Lograr un Bienestar Físico y Mental Óptimo',
    description: 'Alcanzar un estado de salud integral a través del ejercicio, la nutrición y el equilibrio mental para una vida más enérgica y plena.',
  },
];

const areaPrks: AreaPrk[] = [
  {
    id: 'area-1',
    lifePrkId: 'life-1',
    title: 'Correr 10 kilómetros sin parar',
    currentValue: 2,
    targetValue: 10,
    unit: 'km',
  },
  {
    id: 'area-2',
    lifePrkId: 'life-1',
    title: 'Mantener un Peso Saludable',
    currentValue: 85,
    targetValue: 78,
    unit: 'kg',
  },
  {
    id: 'area-3',
    lifePrkId: 'life-1',
    title: 'Leer 12 libros en el año',
    currentValue: 3,
    targetValue: 12,
    unit: 'libros',
  },
];

const habitTasks: HabitTask[] = [
  { id: 'task-1', areaPrkId: 'area-1', title: 'Entrenar carrera 3 veces por semana', type: 'habit', completed: false },
  { id: 'task-2', areaPrkId: 'area-1', title: 'Inscribirme en una carrera de 5k', type: 'task', completed: false },
  { id: 'task-3', areaPrkId: 'area-2', title: 'Planificar las comidas de la semana', type: 'habit', completed: true },
  { id: 'task-4', areaPrkId: 'area-2', title: 'Beber 2 litros de agua al día', type: 'habit', completed: true },
  { id: 'task-5', areaPrkId: 'area-3', title: 'Leer 20 páginas cada noche', type: 'habit', completed: false },
  { id: 'task-6', areaPrkId: 'area-3', title: 'Comprar el siguiente libro de la lista', type: 'task', completed: false },
];

export const getInitialData = () => ({
  lifePrks,
  areaPrks,
  habitTasks,
});
