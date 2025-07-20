
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
import type { AreaPrk, HabitTask, HabitFrequency } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

const formSchema = z.object({
    title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
    description: z.string().optional(),
    area_prk_id: z.string({ required_error: "Debes seleccionar un PRK de Área."}),
    type: z.enum(['task', 'project', 'habit']),
    start_date: z.date().optional(),
    due_date: z.date().optional(),
    weight: z.coerce.number().min(1, { message: 'El impacto debe ser al menos 1.' }).max(5, { message: 'El impacto no puede ser mayor a 5.' }).default(1),
    is_critical: z.boolean().default(false),
    
    // Habit specific fields
    frequency: z.custom<HabitFrequency>().optional(),
    frequency_interval: z.coerce.number().min(1, "El intervalo debe ser al menos 1.").optional(),
    frequency_days: z.array(z.string()).optional(),
    frequency_day_of_month: z.coerce.number().min(1, "El día debe ser entre 1 y 31.").max(31, "El día debe ser entre 1 y 31.").optional(),
    
    measurement_type: z.enum(['binary', 'quantitative']).optional(),
    measurement_goal: z.object({
        target_count: z.coerce.number().min(1, "El objetivo debe ser mayor que 0.").optional(),
        unit: z.string().optional(),
    }).optional(),
}).superRefine((data, ctx) => {
    if (data.type !== 'habit' || !data.frequency) return;

    switch (data.frequency) {
        case 'SEMANAL_DIAS_FIJOS':
        case 'INTERVALO_SEMANAL_DIAS_FIJOS':
            if (!data.frequency_days || data.frequency_days.length === 0) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes seleccionar al menos un día.', path: ['frequency_days'] });
            }
            break;
        case 'MENSUAL_DIA_FIJO':
        case 'INTERVALO_MENSUAL_DIA_FIJO':
            if (!data.frequency_day_of_month) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes especificar el día del mes.', path: ['frequency_day_of_month'] });
            }
            break;
        case 'INTERVALO_DIAS':
        case 'INTERVALO_SEMANAL_DIAS_FIJOS':
        case 'INTERVALO_MENSUAL_DIA_FIJO':
        case 'SEMANAL_ACUMULATIVO_RECURRENTE':
        case 'MENSUAL_ACUMULATIVO_RECURRENTE':
        case 'TRIMESTRAL_ACUMULATIVO_RECURRENTE':
             if (!data.frequency_interval || data.frequency_interval < 1) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El intervalo es requerido y debe ser mayor a 0.', path: ['frequency_interval'] });
            }
            break;
        case 'SEMANAL_ACUMULATIVO':
        case 'MENSUAL_ACUMULATIVO':
        case 'TRIMESTRAL_ACUMULATIVO':
        case 'ANUAL_ACUMULATIVO':
        case 'SEMANAL_ACUMULATIVO_RECURRENTE':
        case 'MENSUAL_ACUMULATIVO_RECURRENTE':
        case 'TRIMESTRAL_ACUMULATIVO_RECURRENTE':
            if (data.measurement_type === 'binary' && (!data.measurement_goal?.target_count)) {
                 ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El objetivo (X veces) es requerido.', path: ['measurement_goal.target_count'] });
            }
            break;
    }
});


export type HabitTaskFormValues = z.infer<typeof formSchema>;

interface AddHabitTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (values: Partial<HabitTask>) => void;
  habitTask: HabitTask | null;
  defaultAreaPrkId?: string;
  defaultDate?: Date;
  areaPrks: AreaPrk[];
  defaultValues?: Partial<HabitTaskFormValues>;
}

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
  
  useEffect(() => {
    if (isOpen) {
      if (isEditing && habitTask) {
        // --- Populate Form ---
        const baseValues: any = {
          ...habitTask,
          start_date: habitTask.start_date ? parseISO(habitTask.start_date) : (defaultDate || new Date()),
          due_date: habitTask.due_date ? parseISO(habitTask.due_date) : undefined,
          frequency_interval: habitTask.frequency_interval ?? '',
          frequency_day_of_month: habitTask.frequency_day_of_month ?? '',
        };
        form.reset(baseValues);
      } else { // Reset for new task
        form.reset({
          title: '', description: '', type: 'task', start_date: defaultDate || new Date(), due_date: undefined,
          area_prk_id: defaultAreaPrkId, weight: 1, is_critical: false,
          frequency: 'DIARIA',
          frequency_interval: '',
          frequency_day_of_month: '',
          ...defaultValues,
        });
      }
    }
  }, [isOpen, isEditing, habitTask, form, defaultAreaPrkId, defaultDate, defaultValues]);

  const onSubmit = (values: HabitTaskFormValues) => {
    const dataToSave: Partial<HabitTask> = {
        title: values.title,
        description: values.description,
        area_prk_id: values.area_prk_id,
        type: values.type,
        start_date: values.start_date ? format(values.start_date, 'yyyy-MM-dd') : undefined,
        due_date: values.due_date ? format(values.due_date, 'yyyy-MM-dd') : undefined,
        weight: values.weight,
        is_critical: values.is_critical,
    };

    if (values.type === 'habit') {
        dataToSave.frequency = values.frequency;
        dataToSave.measurement_type = values.measurement_type;
        dataToSave.measurement_goal = values.measurement_goal;

        // Clean up fields based on frequency
        dataToSave.frequency_interval = null;
        dataToSave.frequency_days = null;
        dataToSave.frequency_day_of_month = null;

        // Add fields based on frequency
        const freq = values.frequency;

        if (freq?.includes('INTERVALO') || freq?.includes('RECURRENTE')) {
            dataToSave.frequency_interval = values.frequency_interval || null;
        }

        if (freq === 'SEMANAL_DIAS_FIJOS' || freq === 'INTERVALO_SEMANAL_DIAS_FIJOS') {
            dataToSave.frequency_days = values.frequency_days;
        }

        if (freq === 'MENSUAL_DIA_FIJO' || freq === 'INTERVALO_MENSUAL_DIA_FIJO') {
            dataToSave.frequency_day_of_month = values.frequency_day_of_month || null;
        }

        if (freq?.includes('ACUMULATIVO')) {
             if(values.measurement_type === 'binary') {
                dataToSave.measurement_goal = {
                    target_count: values.measurement_goal?.target_count
                };
             } else {
                 dataToSave.measurement_goal = null;
             }
        } else {
            dataToSave.measurement_goal = null;
        }

    } else { // Task or Project
        dataToSave.frequency = null;
        dataToSave.measurement_type = null;
        dataToSave.measurement_goal = null;
        dataToSave.frequency_days = null;
        dataToSave.frequency_day_of_month = null;
        dataToSave.frequency_interval = null;
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
                      value={field.value ?? ''}
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
                <FrequencyBuilder form={form} />
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

const daysOfWeek = [
    { id: 'L', label: 'L' }, { id: 'M', label: 'M' }, { id: 'X', label: 'X' },
    { id: 'J', label: 'J' }, { id: 'V', label: 'V' }, { id: 'S', label: 'S' },
    { id: 'D', label: 'D' },
];


function FrequencyBuilder({ form }: { form: any }) {
    const [behavior, setBehavior] = useState<'date' | 'period'>('date');
    const frequency: HabitFrequency | undefined = form.watch('frequency');
    const measurementType: 'binary' | 'quantitative' | undefined = form.watch('measurement_type');

    useEffect(() => {
        const freq = form.getValues('frequency');
        if (freq?.includes('ACUMULATIVO')) {
            setBehavior('period');
        } else {
            setBehavior('date');
        }
    }, [form]);


    const handleBehaviorChange = (value: 'date' | 'period') => {
        setBehavior(value);
        if (value === 'date') {
            form.setValue('frequency', 'DIARIA');
            form.setValue('measurement_type', 'binary');
        } else {
            form.setValue('frequency', 'SEMANAL_ACUMULATIVO');
            form.setValue('measurement_type', 'binary');
        }
    };

    const handleDayToggle = (dayId: string) => {
        const currentDays = form.getValues('frequency_days') || [];
        const newDays = currentDays.includes(dayId)
            ? currentDays.filter((d: string) => d !== dayId)
            : [...currentDays, dayId];
        form.setValue('frequency_days', newDays, { shouldValidate: true });
    };

    return (
        <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
            <FormLabel>Frecuencia del Hábito</FormLabel>
            <RadioGroup value={behavior} onValueChange={handleBehaviorChange} className="flex gap-4">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="date" id="date" />
                    <Label htmlFor="date">Acción con Fecha Específica</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="period" id="period" />
                    <Label htmlFor="period">Compromiso por Período</Label>
                </div>
            </RadioGroup>
            
            {behavior === 'date' && (
                <div className="space-y-4 pt-2">
                    <FormField control={form.control} name="frequency" render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una frecuencia" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="DIARIA">Diaria</SelectItem>
                                <SelectItem value="SEMANAL_DIAS_FIJOS">Días Específicos de la Semana</SelectItem>
                                <SelectItem value="MENSUAL_DIA_FIJO">Día Fijo del Mes</SelectItem>
                                <SelectItem value="ANUAL_FECHA_FIJA">Anual (Fecha Fija)</SelectItem>
                                <SelectItem value="INTERVALO_DIAS">Intervalo de Días</SelectItem>
                                <SelectItem value="INTERVALO_SEMANAL_DIAS_FIJOS">Intervalo Semanal con Días Fijos</SelectItem>
                                <SelectItem value="INTERVALO_MENSUAL_DIA_FIJO">Intervalo Mensual con Día Fijo</SelectItem>
                            </SelectContent>
                        </Select>
                      </FormItem>
                    )}/>

                    {(frequency === 'INTERVALO_DIAS' || frequency === 'INTERVALO_SEMANAL_DIAS_FIJOS' || frequency === 'INTERVALO_MENSUAL_DIA_FIJO') && (
                         <FormField control={form.control} name="frequency_interval" render={({ field }) => (
                           <FormItem><FormLabel>Cada</FormLabel><FormControl><Input type="number" min="1" placeholder="Ej: 3" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    )}

                    {(frequency === 'SEMANAL_DIAS_FIJOS' || frequency === 'INTERVALO_SEMANAL_DIAS_FIJOS') && (
                        <div>
                             <FormLabel>En los días</FormLabel>
                             <div className="flex flex-wrap gap-1.5 pt-2">
                                {daysOfWeek.map(day => (
                                    <Button
                                        type="button"
                                        key={day.id}
                                        variant={(form.watch('frequency_days') || []).includes(day.id) ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleDayToggle(day.id)}
                                        className="h-8 w-8 p-0"
                                    >
                                        {day.label}
                                    </Button>
                                ))}
                             </div>
                              <FormMessage>{form.formState.errors.frequency_days?.message}</FormMessage>
                        </div>
                    )}
                     {(frequency === 'MENSUAL_DIA_FIJO' || frequency === 'INTERVALO_MENSUAL_DIA_FIJO') && (
                         <FormField control={form.control} name="frequency_day_of_month" render={({ field }) => (
                           <FormItem><FormLabel>El día del mes</FormLabel><FormControl><Input type="number" min="1" max="31" placeholder="Ej: 15" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    )}
                     <FormField control={form.control} name="measurement_type" render={({ field }) => (
                        <FormItem className='hidden'><FormControl><Input {...field} /></FormControl></FormItem>
                     )}/>
                </div>
            )}

            {behavior === 'period' && (
                 <div className="space-y-4 pt-2">
                     <FormField control={form.control} name="frequency" render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('measurement_type', 'binary'); // Default to binary for commitments
                        }} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un período" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="SEMANAL_ACUMULATIVO">Por Semana (Acumulativo)</SelectItem>
                                <SelectItem value="MENSUAL_ACUMULATIVO">Por Mes (Acumulativo)</SelectItem>
                                <SelectItem value="TRIMESTRAL_ACUMULATIVO">Por Trimestre (Acumulativo)</SelectItem>
                                <SelectItem value="ANUAL_ACUMULATIVO">Anual (Compromiso Flexible)</SelectItem>
                                <SelectItem value="SEMANAL_ACUMULATIVO_RECURRENTE">Compromiso Semanal Recurrente</SelectItem>
                                <SelectItem value="MENSUAL_ACUMULATIVO_RECURRENTE">Compromiso Mensual Recurrente</SelectItem>
                                <SelectItem value="TRIMESTRAL_ACUMULATIVO_RECURRENTE">Compromiso Trimestral Recurrente</SelectItem>
                            </SelectContent>
                        </Select>
                      </FormItem>
                    )}/>

                    {frequency?.includes('RECURRENTE') && (
                         <FormField control={form.control} name="frequency_interval" render={({ field }) => (
                           <FormItem>
                                <FormLabel>
                                    {frequency === 'SEMANAL_ACUMULATIVO_RECURRENTE' && 'Cada cuántas semanas'}
                                    {frequency === 'MENSUAL_ACUMULATIVO_RECURRENTE' && 'Cada cuántos meses'}
                                    {frequency === 'TRIMESTRAL_ACUMULATIVO_RECURRENTE' && 'Cada cuántos trimestres'}
                                </FormLabel>
                               <FormControl><Input type="number" min="1" placeholder="Ej: 2" {...field} /></FormControl>
                               <FormMessage />
                           </FormItem>
                        )}/>
                    )}

                    <FormField
                        control={form.control}
                        name="measurement_type"
                        render={({ field }) => (
                            <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex gap-4"
                            >
                                <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                        <RadioGroupItem value="binary" id="binary" />
                                    </FormControl>
                                    <Label htmlFor="binary">Contar Tareas (Binario)</Label>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                        <RadioGroupItem value="quantitative" id="quantitative" />
                                    </FormControl>
                                    <Label htmlFor="quantitative">Sumar Valores</Label>
                                </FormItem>
                            </RadioGroup>
                        )}
                    />
                    
                    {measurementType === 'binary' && frequency?.includes('ACUMULATIVO') && (
                        <FormField control={form.control} name="measurement_goal.target_count" render={({ field }) => (
                           <FormItem><FormLabel>Meta (X veces por período)</FormLabel><FormControl><Input type="number" min="1" placeholder="Ej: 3" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    )}

                </div>
            )}
        </div>
    );
}
