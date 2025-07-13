import type { LifePrk, AreaPrk, HabitTask } from './types';

// Función para calcular el valor actual inicial basado en tareas completadas
const calculateInitialCurrentValue = (areaPrkId: string, tasks: Omit<HabitTask, 'value'>[]): number => {
  return tasks
    .filter(task => task.areaPrkId === areaPrkId && task.completed)
    .length;
};

const rawHabitTasks: Omit<HabitTask, 'value'>[] = [
  // PRK: Completar un triatlón sprint
  { id: 'task-1', areaPrkId: 'area-1', title: 'Nadar 750 metros seguidos', type: 'task', completed: true },
  { id: 'task-2', areaPrkId: 'area-1', title: 'Completar 3 sesiones de natación', type: 'task', completed: false },
  { id: 'task-3', areaPrkId: 'area-1', title: 'Correr 5km en menos de 30 mins', type: 'task', completed: false },
  { id: 'task-4', areaPrkId: 'area-1', title: 'Completar 10 sesiones de carrera', type: 'task', completed: false },
  { id: 'task-5', areaPrkId: 'area-1', title: 'Andar en bici 20km', type: 'task', completed: true },
  { id: 'task-6', areaPrkId: 'area-1', title: 'Completar 10 sesiones de ciclismo', type: 'task', completed: false },

  // PRK: Meditar 1000 minutos
  { id: 'task-7', areaPrkId: 'area-2', title: 'Meditar 10 minutos al día', type: 'habit', completed: true },
  { id: 'task-8', areaPrkId: 'area-2', title: 'Asistir a un retiro de meditación de 1 día', type: 'task', completed: false },
  
  // PRK: Leer 12 libros
  { id: 'task-9', areaPrkId: 'area-3', title: 'Terminar "El Alquimista"', type: 'task', completed: true },
  { id: 'task-10', areaPrkId: 'area-3', title: 'Terminar "Sapiens"', type: 'task', completed: true },
  { id: 'task-11', areaPrkId: 'area-3', title: 'Leer 20 páginas cada noche', type: 'habit', completed: false },
  { id: 'task-12', areaPrkId: 'area-3', title: 'Comprar el siguiente libro de la lista', type: 'task', completed: false },
];

const habitTasks: HabitTask[] = rawHabitTasks.map(task => ({
    ...task,
    value: task.type === 'task' ? 1 : 0 // Las tareas aportan 1, los hábitos no aportan valor directo en este modelo
}));


const areaPrks: AreaPrk[] = [
  {
    id: 'area-1',
    lifePrkId: 'life-1',
    title: 'Completar un Triatlón Sprint este año',
    currentValue: calculateInitialCurrentValue('area-1', rawHabitTasks),
    targetValue: rawHabitTasks.filter(t => t.areaPrkId === 'area-1' && t.type === 'task').length,
    unit: 'hitos',
  },
  {
    id: 'area-2',
    lifePrkId: 'life-1',
    title: 'Meditar 1000 minutos este trimestre',
    currentValue: 240, // Valor inicial para el ejemplo
    targetValue: 1000,
    unit: 'minutos',
  },
  {
    id: 'area-3',
    lifePrkId: 'life-1',
    title: 'Leer 12 libros en el año',
    currentValue: calculateInitialCurrentValue('area-3', rawHabitTasks),
    targetValue: 12,
    unit: 'libros',
  },
];

const lifePrks: LifePrk[] = [
  {
    id: 'life-1',
    title: 'Lograr un Bienestar Físico y Mental Óptimo',
    description: 'Alcanzar un estado de salud integral a través del ejercicio, la nutrición y el equilibrio mental para una vida más enérgica y plena.',
  },
];


export const getInitialData = () => ({
  lifePrks,
  areaPrks,
  habitTasks,
});
