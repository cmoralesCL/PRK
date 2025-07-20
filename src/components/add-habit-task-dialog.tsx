

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from '@/components/ui/select';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { AreaPrk, HabitTask } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Textarea } from './ui/textarea';

const formSchema = z.object({
    title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
    description: z.string().optional(),
    area_prk_id: z.string({ required_error: "Debes seleccionar un PRK de Área."}),
    type: z.enum(['task', 'project', 'habit']),
    start_date: z.date().optional(),
    due_date: z.date().optional(),
    weight: z.coerce.number().min(1, { message: 'El impacto debe ser al menos 1.' }).max(5, { message: 'El impacto no puede ser mayor a 5.' }).default(1),
    is_critical: z.boolean().default(false),
    
    // Habit specific fields, managed by the frequency builder
    frequency: z.enum([
        'daily', 
        'specific_days', 
        'every_x_days',
        'every_x_weeks',
        'every_x_months',
        'specific_day_of_month',
        'weekly', 
        'monthly',
        'every_x_weeks_commitment',
        'every_x_months_commitment'
    ]).optional(),
    frequency_interval: z.coerce.number().min(1, "El intervalo debe ser al menos 1.").optional(),
    frequency_days: z.array(z.string()).optional(),
    frequency_day_of_month: z.coerce.number().min(1, "El día debe ser entre 1 y 31.").max(31, "El día debe ser entre 1 y 31.").optional(),
    
    measurement_type: z.enum(['binary', 'quantitative']).optional(),
    measurement_goal: z.object({
        target: z.coerce.number().min(1, "El objetivo debe ser mayor que 0.").optional(),
        unit: z.string().optional(),
    }).optional(),
}).refine((data) => {
    if (data.type === 'habit' && data.frequency === 'specific_days' && (!data.frequency_days || data.frequency_days.length === 0)) {
        return false;
    }
    return true;
}, {
    message: "Debes seleccionar al menos un día.",
    path: ["frequency_days"],
});

export type HabitTaskFormValues = z.infer<typeof formSchema>;

interface AddHabitTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (values: HabitTaskFormValues) => void;
  habitTask: HabitTask | null;
  defaultAreaPrkId?: string;
  defaultDate?: Date;
  areaPrks: AreaPrk[];
  defaultValues?: Partial<HabitTaskFormValues>;
}

const daysOfWeek = [
    { id: 'mon', label: 'L' }, { id: 'tue', label: 'M' }, { id: 'wed', label: 'X' },
    { id: 'thu', label: 'J' }, { id: 'fri', label: 'V' }, { id: 'sat', label: 'S' },
    { id: 'sun', label: 'D' },
];

const dayIdToLabel = (id: string) => daysOfWeek.find(d => d.id === id)?.label || '';

type FrequencyBuilderState = {
    mode: 'cada' | 'los' | 'veces_por';
    interval: number;
    unit: 'days' | 'weeks' | 'months';
    specificDays: string[];
    dayOfMonth: number;
};


// Main Dialog Component
export function AddHabitTaskDialog({ 
    isOpen, onOpenChange, onSave, habitTask, 
    defaultAreaPrkId, defaultDate, areaPrks, defaultValues
}: AddHabitTaskDialogProps) {
  const isEditing = !!habitTask;

  const form = useForm<HabitTaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '', description: '', type: 'task', start_date: defaultDate || new Date(),
      area_prk_id: defaultAreaPrkId, weight: 1, is_critical: false,
      ...defaultValues
    },
  });

  const type = form.watch('type');
  
  // State for the interactive frequency builder
  const [frequencyBuilder, setFrequencyBuilder] = useState<FrequencyBuilderState>({
    mode: 'cada', interval: 1, unit: 'days', specificDays: [], dayOfMonth: 1,
  });

  // EFFECT 1: Sync Frequency Builder -> Form Fields
  useEffect(() => {
    if (type !== 'habit') return;

    const { mode, interval, unit, specificDays } = frequencyBuilder;
    let newFrequency: HabitTaskFormValues['frequency'] = 'daily';
    let newInterval: number | undefined = undefined;
    let newDays: string[] | undefined = undefined;
    let newDayOfMonth: number | undefined = undefined;
    let newMeasurementType: 'binary' | 'quantitative' | undefined = 'binary';
    let newMeasurementGoal: { target?: number, unit?: string } | undefined = undefined;
    
    // This logic translates the user-friendly builder into the data model
    if (mode === 'cada') {
      newInterval = interval;
      switch (unit) {
        case 'days':
          newFrequency = interval === 1 ? 'daily' : 'every_x_days';
          if (interval === 1) newInterval = undefined;
          break;
        case 'weeks':
          newFrequency = 'every_x_weeks';
          newDays = specificDays;
          break;
        case 'months':
          newFrequency = 'every_x_months';
          break;
      }
    } else if (mode === 'los') {
      newFrequency = 'specific_days';
      newDays = specificDays;
    } else if (mode === 'veces_por') {
      newMeasurementType = form.getValues('measurement_type') || 'binary';
      newMeasurementGoal = { ...form.getValues('measurement_goal'), target: interval };
      switch (unit) {
        case 'weeks':
          newFrequency = interval === 1 && !newMeasurementGoal?.target ? 'weekly' : 'every_x_weeks_commitment';
          break;
        case 'months':
          newFrequency = interval === 1 && !newMeasurementGoal?.target ? 'monthly' : 'every_x_months_commitment';
          break;
      }
    }
    
    // Handle the separate "specific day of month" frequency from the main dropdown
    const selectedFrequency = form.watch('frequency');
    if (selectedFrequency === 'specific_day_of_month') {
        newFrequency = 'specific_day_of_month';
        newDayOfMonth = form.getValues('frequency_day_of_month');
        newInterval = undefined;
        newDays = undefined;
    }

    // Set form values based on builder state or dropdown choice
    form.setValue('frequency', newFrequency, { shouldValidate: true });
    form.setValue('frequency_interval', newInterval, { shouldValidate: true });
    form.setValue('frequency_days', newDays, { shouldValidate: true });
    form.setValue('frequency_day_of_month', newDayOfMonth, { shouldValidate: true });
    
    if (mode === 'veces_por') {
      form.setValue('measurement_type', newMeasurementType, { shouldValidate: true });
      form.setValue('measurement_goal', newMeasurementGoal, { shouldValidate: true });
    }

  }, [frequencyBuilder, type, form]);


  // EFFECT 2: Sync Props/Edit Data -> Form and Builder
  useEffect(() => {
    if (isOpen) {
      if (isEditing && habitTask) {
        // --- Populate Form ---
        const baseValues: any = {
          title: habitTask.title,
          description: habitTask.description,
          type: habitTask.type, area_prk_id: habitTask.area_prk_id,
          start_date: habitTask.start_date ? parseISO(habitTask.start_date) : (defaultDate || new Date()),
          due_date: habitTask.due_date ? parseISO(habitTask.due_date) : undefined,
          weight: habitTask.weight || 1, is_critical: habitTask.is_critical || false,
          frequency: habitTask.frequency, 
          frequency_interval: habitTask.frequency_interval,
          frequency_days: habitTask.frequency_days, 
          frequency_day_of_month: habitTask.frequency_day_of_month,
          measurement_type: habitTask.measurement_type, 
          measurement_goal: habitTask.measurement_goal,
        };
        form.reset(baseValues);

        // --- Populate Frequency Builder ---
        const { frequency, frequency_interval, frequency_days, measurement_goal } = habitTask;
        let newBuilderState: FrequencyBuilderState = { mode: 'cada', interval: 1, unit: 'days', specificDays: [], dayOfMonth: 1 };
        
        if (frequency === 'daily') {
             newBuilderState = { mode: 'cada', interval: 1, unit: 'days', specificDays: [], dayOfMonth: 1 };
        } else if (frequency === 'every_x_days') {
             newBuilderState = { mode: 'cada', interval: frequency_interval || 1, unit: 'days', specificDays: [], dayOfMonth: 1 };
        } else if (frequency === 'every_x_weeks') {
             newBuilderState = { mode: 'cada', interval: frequency_interval || 1, unit: 'weeks', specificDays: frequency_days || [], dayOfMonth: 1 };
        } else if (frequency === 'every_x_months') {
             newBuilderState = { mode: 'cada', interval: frequency_interval || 1, unit: 'months', specificDays: [], dayOfMonth: 1 };
        } else if (frequency === 'specific_days') {
            newBuilderState = { ...newBuilderState, mode: 'los', specificDays: frequency_days || [] };
        } else if (frequency?.endsWith('_commitment') || frequency === 'weekly' || frequency === 'monthly') {
            const unit = frequency.includes('week') ? 'weeks' : 'months';
            newBuilderState = { ...newBuilderState, mode: 'veces_por', unit: unit, interval: measurement_goal?.target || 1 };
        } 
        setFrequencyBuilder(newBuilderState);

      } else { // Reset for new task
        form.reset({
          title: '', description: '', type: 'task', start_date: defaultDate || new Date(), due_date: undefined,
          area_prk_id: defaultAreaPrkId, weight: 1, is_critical: false,
          ...defaultValues,
        });
        // Reset builder state
        setFrequencyBuilder({ mode: 'cada', interval: 1, unit: 'days', specificDays: [], dayOfMonth: 1 });
      }
    }
  }, [isOpen, isEditing, habitTask, form, defaultAreaPrkId, defaultDate, defaultValues]);

  const onSubmit = (values: HabitTaskFormValues) => {
    onSave(values);
    form.reset();
    onOpenChange(false);
  };
  
  const watchedFrequency = form.watch('frequency');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Editar Acción' : 'Crear Acción'}</DialogTitle>
          <DialogDescription>Define una acción concreta para apoyar tu PRK de Área.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder="Ej: Correr 5km" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Añade notas, enlaces o detalles aquí."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="task">Tarea (Acción única)</SelectItem>
                  <SelectItem value="project">Proyecto (Agrupa Tareas)</SelectItem>
                  <SelectItem value="habit">Hábito (Acción recurrente)</SelectItem>
                </SelectContent></Select><FormMessage /></FormItem>
            )}/>

             <FormField control={form.control} name="area_prk_id" render={({ field }) => (
                <FormItem><FormLabel>PRK de Área Asociado</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un PRK de Área" /></SelectTrigger></FormControl>
                  <SelectContent>{areaPrks.map(ap => <SelectItem key={ap.id} value={ap.id}>{ap.title}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
              )}/>
            
            <FormField control={form.control} name="start_date" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Fecha de Inicio</FormLabel><Popover>
                <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                  {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
              </Popover><FormMessage /></FormItem>
            )}/>

            {type !== 'habit' && (
              <FormField control={form.control} name="due_date" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Fecha Límite (Opcional)</FormLabel><Popover>
                  <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                </Popover><FormMessage /></FormItem>
              )}/>
            )}

            {type === 'habit' && (
                <FrequencyBuilder state={frequencyBuilder} setState={setFrequencyBuilder} form={form} />
            )}
            
            {type === 'habit' && (frequencyBuilder.mode === 'veces_por' || watchedFrequency?.endsWith('_commitment')) && (
                <FormField control={form.control} name="measurement_type" render={({ field }) => (
                    <FormItem><FormLabel>Tipo de Medición</FormLabel><Select onValueChange={(value) => {
                        field.onChange(value);
                        if(value === 'binary') form.setValue('measurement_goal.unit', undefined);
                    }} value={field.value ?? 'binary'}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="binary">Binario (Nº de veces)</SelectItem>
                            <SelectItem value="quantitative">Cuantitativo (Suma de valores)</SelectItem>
                        </SelectContent></Select><FormMessage /></FormItem>
                )}/>
            )}
            { type === 'habit' && form.watch('measurement_type') === 'quantitative' && (frequencyBuilder.mode === 'veces_por' || watchedFrequency?.endsWith('_commitment')) && (
                 <FormField control={form.control} name="measurement_goal.unit" render={({ field }) => (
                    <FormItem><FormLabel>Unidad de Medida</FormLabel><FormControl><Input placeholder="Ej: páginas, km, etc." {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            )}

            <FormField control={form.control} name="weight" render={({ field }) => (
              <FormItem><FormLabel>Nivel de Impacto (1-5)</FormLabel><Input type="number" min="1" max="5" placeholder="1" {...field} /><FormMessage /></FormItem>
            )}/>

            <FormField control={form.control} name="is_critical" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5"><FormLabel>¿Es Crítico?</FormLabel><FormMessage /></div>
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}/>

            <DialogFooter className="pt-4"><Button type="submit">{isEditing ? 'Guardar Cambios' : 'Agregar Acción'}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


// Sub-component for the interactive frequency builder
function FrequencyBuilder({ state, setState, form }: { state: FrequencyBuilderState; setState: (state: FrequencyBuilderState) => void; form: any }) {
    const { mode, interval, unit, specificDays } = state;
    const watchedFrequency = form.watch('frequency');

    const handleModeChange = (newMode: FrequencyBuilderState['mode']) => {
        const baseState = { ...state, mode: newMode };
        if (newMode === 'cada') {
            baseState.unit = 'days';
            baseState.interval = 1;
        }
        if (newMode === 'los') {
            baseState.specificDays = [];
        }
        if (newMode === 'veces_por') {
            baseState.unit = 'weeks';
            baseState.interval = 1;
        }
        setState(baseState);
        // Also clear the specific day of month frequency if we switch to the builder
        form.setValue('frequency', undefined);
    };

    const handleUnitChange = (newUnit: FrequencyBuilderState['unit']) => {
        setState({ ...state, unit: newUnit });
    };

    const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState({ ...state, interval: parseInt(e.target.value, 10) || 1 });
    };

    const handleDayToggle = (dayId: string) => {
        const newDays = specificDays.includes(dayId)
            ? specificDays.filter(d => d !== dayId)
            : [...specificDays, dayId];
        setState({ ...state, specificDays: newDays });
    };

    return (
        <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frecuencia</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      if (value !== 'specific_day_of_month') {
                         setState({ ...state, mode: 'cada', interval: 1, unit: 'days' })
                      }
                  }} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una frecuencia" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>En Días Fijos</SelectLabel>
                            <SelectItem value="daily">Diaria (todos los días)</SelectItem>
                            <SelectItem value="specific_days">Días Específicos de la Semana</SelectItem>
                            <SelectItem value="every_x_days">Intervalo de Días</SelectItem>
                            <SelectItem value="every_x_weeks">Intervalo Semanal/Mensual</SelectItem>
                            <SelectItem value="specific_day_of_month">Día Fijo del Mes</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                            <SelectLabel>Compromisos por Período</SelectLabel>
                            <SelectItem value="weekly">Semanal (Nº de veces)</SelectItem>
                            <SelectItem value="monthly">Mensual (Nº de veces)</SelectItem>
                            <SelectItem value="every_x_weeks_commitment">Compromiso Semanal Recurrente</SelectItem>
                            <SelectItem value="every_x_months_commitment">Compromiso Mensual Recurrente</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            { (watchedFrequency === 'every_x_days' || watchedFrequency === 'every_x_weeks' || watchedFrequency === 'every_x_months_commitment' || watchedFrequency === 'every_x_weeks_commitment') && (
                 <FormField control={form.control} name="frequency_interval" render={({ field }) => (
                    <FormItem><FormLabel>Cada (n)</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            )}

            { watchedFrequency === 'specific_days' && (
                 <div className="flex flex-wrap gap-1.5 pt-2">
                    {daysOfWeek.map(day => (
                        <Button
                            type="button"
                            key={day.id}
                            variant={form.getValues('frequency_days')?.includes(day.id) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                const currentDays = form.getValues('frequency_days') || [];
                                const newDays = currentDays.includes(day.id)
                                    ? currentDays.filter(d => d !== day.id)
                                    : [...currentDays, day.id];
                                form.setValue('frequency_days', newDays, { shouldValidate: true });
                            }}
                            className="h-8 w-8 p-0"
                        >
                            {day.label}
                        </Button>
                    ))}
                </div>
            )}
             <FormMessage>{form.formState.errors.frequency_days?.message}</FormMessage>

            
            {watchedFrequency === 'specific_day_of_month' && (
                <FormField
                    control={form.control}
                    name="frequency_day_of_month"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Día del Mes</FormLabel>
                            <FormControl>
                                <Input type="number" min="1" max="31" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>
    );
}

    