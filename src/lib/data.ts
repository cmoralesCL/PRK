import type { LifePrk, KeyPrk, HabitTask } from './types';

const lifePrks: LifePrk[] = [
  {
    id: 'life-1',
    title: 'Alcanzar la Independencia Financiera',
    description: 'Construir suficiente riqueza para vivir de inversiones y flujos de ingresos pasivos, proporcionando libertad y seguridad.',
  },
  {
    id: 'life-2',
    title: 'Cultivar un Estilo de Vida Saludable y Activo',
    description: 'Priorizar el bienestar físico y mental para vivir una vida larga, enérgica y plena.',
  },
];

const keyPrks: KeyPrk[] = [
  {
    id: 'key-1',
    lifePrkId: 'life-1',
    title: 'Valor del Portafolio de Inversión',
    currentValue: 250000,
    targetValue: 1000000,
    unit: 'USD',
  },
  {
    id: 'key-2',
    lifePrkId: 'life-1',
    title: 'Ingreso Pasivo Anual',
    currentValue: 5000,
    targetValue: 40000,
    unit: 'USD',
  },
  {
    id: 'key-3',
    lifePrkId: 'life-2',
    title: 'Mantener un Peso Corporal Saludable',
    currentValue: 80,
    targetValue: 75,
    unit: 'kg',
  },
  {
    id: 'key-4',
    lifePrkId: 'life-2',
    title: 'Leer Libros',
    currentValue: 5,
    targetValue: 24,
    unit: 'libros',
  },
];

const habitTasks: HabitTask[] = [
  { id: 'task-1', keyPrkId: 'key-1', title: 'Invertir $1000 en fondos indexados', type: 'habit', completed: false },
  { id: 'task-2', keyPrkId: 'key-1', title: 'Revisar el rendimiento trimestral de la inversión', type: 'task', completed: false },
  { id: 'task-3', keyPrkId: 'key-2', title: 'Desarrollar un nuevo proyecto paralelo', type: 'task', completed: true },
  { id: 'task-4', keyPrkId: 'key-3', title: 'Ir al gimnasio 3 veces por semana', type: 'habit', completed: false },
  { id: 'task-5', keyPrkId: 'key-3', title: 'Preparar la comida de la semana', type: 'habit', completed: true },
  { id: 'task-6', keyPrkId: 'key-4', title: 'Leer 30 minutos antes de dormir', type: 'habit', completed: false },
  { id: 'task-7', keyPrkId: 'key-4', title: 'Terminar "La Psicología del Dinero"', type: 'task', completed: false },
];

export const getInitialData = () => ({
  lifePrks,
  keyPrks,
  habitTasks,
});
