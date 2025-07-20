
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
        'DIARIA', 
        'SEMANAL_ESPECIFICO', 
        'INTERVALO',
        'MENSUAL_DIA_FIJO',
        'ANUAL',
        'SEMANAL_ACUMULATIVO',
        'MENSUAL_ACUMULATIVO',
        'TRIMESTRAL_ACUMULATIVO',
        'SEMANAL_ACUMULATIVO_RECURRENTE',
        'MENSUAL_ACUMULATIVO_RECURRENTE'
    ]).optional(),
    frequency_unit: z.enum(['days', 'weeks', 'months']).optional(),
    frequency_interval: z.coerce.number().min(1, "El intervalo debe ser al menos 1.").optional(),
    frequency_days: z.array(z.string()).optional(),
    frequency_day_of_month: z.coerce.number().min(1, "El día debe ser entre 1 y 31.").max(31, "El día debe ser entre 1 y 31.").optional(),
    
    measurement_type: z.enum(['binary', 'quantitative']).optional(),
    measurement_goal: z.object({
        target: z.coerce.number().min(1, "El objetivo debe ser mayor que 0.").optional(),
        unit: z.string().optional(),
    }).optional(),
}).refine((data) => {
    if (data.frequency === 'SEMANAL_ESPECIFICO' && (!data.frequency_days || data.frequency_days.length === 0)) {
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
    { id: 'L', label: 'L' }, { id: 'M', label: 'M' }, { id: 'X', label: 'X' },
    { id: 'J', label: 'J' }, { id: 'V', label: 'V' }, { id: 'S', label: 'S' },
    { id: 'D', label: 'D' },
];

type FrequencyBuilderState = {
    mode: 'DIARIA' | 'SEMANAL_ESPECIFICO' | 'INTERVALO' | 'MENSUAL_DIA_FIJO' | 'ANUAL' | 'META_ACUMULATIVA';
    // For INTERVALO
    interval_value: number;
    interval_unit: 'days' | 'weeks' | 'months';
    // For SEMANAL_ESPECIFICO
    specificDays: string[];
    // For MENSUAL_DIA_FIJO
    dayOfMonth: number;
    // For META_ACUMULATIVA
    meta_target: number;
    meta_period: 'SEMANAL_ACUMULATIVO' | 'MENSUAL_ACUMULATIVO' | 'TRIMESTRAL_ACUMULATIVO';
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
    mode: 'DIARIA', interval_value: 1, interval_unit: 'days', specificDays: [], dayOfMonth: 1,
    meta_target: 1, meta_period: 'SEMANAL_ACUMULATIVO',
  });

  // EFFECT 1: Sync Frequency Builder -> Form Fields
  useEffect(() => {
    if (type !== 'habit') return;
  
    const { mode, interval_value, interval_unit, specificDays, dayOfMonth, meta_period, meta_target } = frequencyBuilder;
    
    let newFrequency: HabitTaskFormValues['frequency'] | undefined = undefined;
    let newInterval: number | undefined = undefined;
    let newUnit: HabitTaskFormValues['frequency_unit'] | undefined = undefined;
    let newDays: string[] | undefined = undefined;
    let newDayOfMonth: number | undefined = undefined;
    
    form.setValue('measurement_goal', undefined);

    switch(mode) {
        case 'DIARIA':
            newFrequency = 'DIARIA';
            break;
        case 'SEMANAL_ESPECIFICO':
            newFrequency = 'SEMANAL_ESPECIFICO';
            newDays = specificDays;
            break;
        case 'INTERVALO':
            newFrequency = 'INTERVALO';
            newInterval = interval_value;
            newUnit = interval_unit;
            break;
        case 'MENSUAL_DIA_FIJO':
            newFrequency = 'MENSUAL_DIA_FIJO';
            newDayOfMonth = dayOfMonth;
            break;
        case 'ANUAL':
            newFrequency = 'ANUAL';
            break;
        case 'META_ACUMULATIVA':
            newFrequency = meta_period;
            form.setValue('measurement_goal', { target: meta_target });
            break;
    }
    
    form.setValue('frequency', newFrequency, { shouldValidate: true });
    form.setValue('frequency_interval', newInterval, { shouldValidate: true });
    form.setValue('frequency_unit', newUnit, { shouldValidate: true });
    form.setValue('frequency_days', newDays, { shouldValidate: true });
    form.setValue('frequency_day_of_month', newDayOfMonth, { shouldValidate: true });
  
  }, [frequencyBuilder, type, form]);


  // EFFECT 2: Sync Props/Edit Data -> Form and Builder
  useEffect(() => {
    if (isOpen) {
      if (isEditing && habitTask) {
        // --- Populate Form ---
        const baseValues: any = {
          title: habitTask.title,
          description: habitTask.description || '',
          type: habitTask.type, area_prk_id: habitTask.area_prk_id,
          start_date: habitTask.start_date ? parseISO(habitTask.start_date) : (defaultDate || new Date()),
          due_date: habitTask.due_date ? parseISO(habitTask.due_date) : undefined,
          weight: habitTask.weight || 1, is_critical: habitTask.is_critical || false,
          frequency: habitTask.frequency, 
          frequency_interval: habitTask.frequency_interval,
          frequency_unit: habitTask.frequency_unit,
          frequency_days: habitTask.frequency_days, 
          frequency_day_of_month: habitTask.frequency_day_of_month,
          measurement_type: habitTask.measurement_type, 
          measurement_goal: habitTask.measurement_goal,
        };
        form.reset(baseValues);

        // --- Populate Frequency Builder ---
        const { frequency, frequency_interval, frequency_unit, frequency_days, frequency_day_of_month, measurement_goal } = habitTask;
        let newBuilderState: FrequencyBuilderState = { 
            mode: 'DIARIA', interval_value: 1, interval_unit: 'days', specificDays: [], dayOfMonth: 1,
            meta_target: 1, meta_period: 'SEMANAL_ACUMULATIVO' 
        };
        
        switch(frequency) {
            case 'DIARIA':
                newBuilderState = { ...newBuilderState, mode: 'DIARIA'};
                break;
            case 'SEMANAL_ESPECIFICO':
                newBuilderState = { ...newBuilderState, mode: 'SEMANAL_ESPECIFICO', specificDays: frequency_days || [] };
                break;
            case 'INTERVALO':
                newBuilderState = { ...newBuilderState, mode: 'INTERVALO', interval_value: frequency_interval || 1, interval_unit: frequency_unit || 'days' };
                break;
            case 'MENSUAL_DIA_FIJO':
                newBuilderState = { ...newBuilderState, mode: 'MENSUAL_DIA_FIJO', dayOfMonth: frequency_day_of_month || 1 };
                break;
            case 'ANUAL':
                newBuilderState = { ...newBuilderState, mode: 'ANUAL' };
                break;
            case 'SEMANAL_ACUMULATIVO':
            case 'MENSUAL_ACUMULATIVO':
            case 'TRIMESTRAL_ACUMULATIVO':
                newBuilderState = { ...newBuilderState, mode: 'META_ACUMULATIVA', meta_period: frequency, meta_target: measurement_goal?.target || 1 };
                break;
        }
        setFrequencyBuilder(newBuilderState);

      } else { // Reset for new task
        form.reset({
          title: '', description: '', type: 'task', start_date: defaultDate || new Date(), due_date: undefined,
          area_prk_id: defaultAreaPrkId, weight: 1, is_critical: false,
          ...defaultValues,
        });
        // Reset builder state to a clean, default state
        setFrequencyBuilder({
            mode: 'DIARIA', interval_value: 1, interval_unit: 'days', specificDays: [], dayOfMonth: 1,
            meta_target: 1, meta_period: 'SEMANAL_ACUMULATIVO'
        });
      }
    }
  }, [isOpen, isEditing, habitTask, form, defaultAreaPrkId, defaultDate, defaultValues]);

  const onSubmit = (values: HabitTaskFormValues) => {
    const dataToSave = {...values};

    // Clean up data based on frequency
    switch(dataToSave.frequency) {
        case 'DIARIA':
        case 'ANUAL':
            dataToSave.frequency_interval = null;
            dataToSave.frequency_unit = null;
            dataToSave.frequency_days = null;
            dataToSave.frequency_day_of_month = null;
            break;
        case 'SEMANAL_ESPECIFICO':
            dataToSave.frequency_interval = null;
            dataToSave.frequency_unit = null;
            dataToSave.frequency_day_of_month = null;
            break;
        case 'INTERVALO':
            dataToSave.frequency_days = null;
            dataToSave.frequency_day_of_month = null;
            break;
        case 'MENSUAL_DIA_FIJO':
            dataToSave.frequency_interval = null;
            dataToSave.frequency_unit = null;
            dataToSave.frequency_days = null;
            break;
        case 'SEMANAL_ACUMULATIVO':
        case 'MENSUAL_ACUMULATIVO':
        case 'TRIMESTRAL_ACUMULATIVO':
            dataToSave.frequency_interval = null;
            dataToSave.frequency_unit = null;
            dataToSave.frequency_days = null;
            dataToSave.frequency_day_of_month = null;
            break;
    }

    onSave(dataToSave);
    form.reset();
    onOpenChange(false);
  };

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
            
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    {type === 'habit' ? 'Fecha de Finalización (Opcional)' : 'Fecha Límite (Opcional)'}
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Elige una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                           const startDate = form.getValues('start_date');
                           return startDate ? date < startDate : false;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === 'habit' && (
                <FrequencyBuilder state={frequencyBuilder} setState={setFrequencyBuilder} form={form} />
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
    const { mode, interval_value, interval_unit, specificDays, dayOfMonth, meta_period, meta_target } = state;
    
    const handleDayToggle = (dayId: string) => {
        const newDays = specificDays.includes(dayId)
            ? specificDays.filter(d => d !== dayId)
            : [...specificDays, dayId];
        setState({ ...state, specificDays: newDays });
    };

    return (
        <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
          <FormLabel>Frecuencia del Hábito</FormLabel>
          <Select value={mode} onValueChange={(newMode: FrequencyBuilderState['mode']) => setState({ ...state, mode: newMode })}>
              <SelectTrigger>
                  <SelectValue />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="DIARIA">Diaria</SelectItem>
                  <SelectItem value="SEMANAL_ESPECIFICO">Días específicos de la semana</SelectItem>
                  <SelectItem value="INTERVALO">Intervalo personalizado (cada N días/semanas/meses)</SelectItem>
                  <SelectItem value="MENSUAL_DIA_FIJO">Día fijo del mes</SelectItem>
                  <SelectItem value="ANUAL">Anual (misma fecha cada año)</SelectItem>
                  <SelectItem value="META_ACUMULATIVA">Meta acumulativa (X veces por semana/mes)</SelectItem>
              </SelectContent>
          </Select>

          {mode === 'SEMANAL_ESPECIFICO' && (
             <div className="flex flex-wrap gap-1.5 pt-2">
                {daysOfWeek.map(day => (
                    <Button
                        type="button"
                        key={day.id}
                        variant={specificDays.includes(day.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDayToggle(day.id)}
                        className="h-8 w-8 p-0"
                    >
                        {day.label}
                    </Button>
                ))}
             </div>
          )}

          {mode === 'INTERVALO' && (
            <div className="flex items-center gap-2 pt-2">
                <span>Repetir cada</span>
                <Input
                    type="number"
                    min="1"
                    className="w-16"
                    value={interval_value}
                    onChange={(e) => setState({ ...state, interval_value: parseInt(e.target.value, 10) || 1 })}
                />
                <Select value={interval_unit} onValueChange={(newUnit: FrequencyBuilderState['interval_unit']) => setState({ ...state, interval_unit: newUnit })}>
                    <SelectTrigger className="w-auto focus:ring-0">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="days">{interval_value === 1 ? 'día' : 'días'}</SelectItem>
                        <SelectItem value="weeks">{interval_value === 1 ? 'semana' : 'semanas'}</SelectItem>
                        <SelectItem value="months">{interval_value === 1 ? 'mes' : 'meses'}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          )}

          {mode === 'MENSUAL_DIA_FIJO' && (
             <div className="flex items-center gap-2 pt-2">
                <span>El día</span>
                 <Input
                    type="number"
                    min="1"
                    max="31"
                    className="w-16"
                    value={dayOfMonth}
                    onChange={(e) => setState({ ...state, dayOfMonth: parseInt(e.target.value, 10) || 1 })}
                />
                <span>de cada mes.</span>
             </div>
          )}
          
          {mode === 'META_ACUMULATIVA' && (
            <div className="flex items-center gap-2 pt-2">
                 <Input
                    type="number"
                    min="1"
                    className="w-16"
                    value={meta_target}
                    onChange={(e) => setState({ ...state, meta_target: parseInt(e.target.value, 10) || 1 })}
                />
                <span>veces por</span>
                <Select value={meta_period} onValueChange={(newPeriod) => setState({ ...state, meta_period: newPeriod as any })}>
                    <SelectTrigger className="w-auto focus:ring-0">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="SEMANAL_ACUMULATIVO">semana</SelectItem>
                        <SelectItem value="MENSUAL_ACUMULATIVO">mes</SelectItem>
                        <SelectItem value="TRIMESTRAL_ACUMULATIVO">trimestre</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          )}


           <FormMessage>{form.formState.errors.frequency_days?.message}</FormMessage>
           <FormMessage>{form.formState.errors.frequency_interval?.message}</FormMessage>
        </div>
    );
}
