
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
import { useEffect, useTransition } from 'react';
import { Label } from './ui/label';

const formSchema = z.object({
    title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
    area_prk_id: z.string({ required_error: "Debes seleccionar un PRK de Área."}),
    type: z.enum(['task', 'project', 'habit']),
    start_date: z.date().optional(),
    due_date: z.date().optional(),
    weight: z.coerce.number().min(1, { message: 'El impacto debe ser al menos 1.' }).max(5, { message: 'El impacto no puede ser mayor a 5.' }).default(1),
    is_critical: z.boolean().default(false),
    // Habit specific fields
    frequency: z.enum(['daily', 'specific_days', 'every_x_days', 'every_x_weeks', 'every_x_months', 'weekly', 'monthly']).optional(),
    frequency_unit: z.enum(['days', 'weeks', 'months']).optional(),
    frequency_interval: z.coerce.number().min(1, "El intervalo debe ser al menos 1.").optional(),
    frequency_days: z.array(z.string()).optional(),
    measurement_type: z.enum(['binary', 'quantitative']).optional(),
    measurement_goal: z.object({
        target: z.coerce.number().min(1, "El objetivo debe ser mayor que 0.").optional(),
        unit: z.string().optional(),
    }).optional(),
}).refine((data) => {
    if (data.type === 'habit' && data.frequency === 'specific_days') {
        return Array.isArray(data.frequency_days) && data.frequency_days.length > 0;
    }
    return true;
}, {
    message: "Debes seleccionar al menos un día para la frecuencia específica",
    path: ["frequency_days"],
})
.refine((data) => {
    if (data.type === 'habit' && (data.frequency === 'every_x_days' || data.frequency === 'every_x_weeks' || data.frequency === 'every_x_months')) {
        return data.frequency_interval != null && data.frequency_interval > 0;
    }
    return true;
}, {
    message: "Debes especificar un intervalo mayor a 0.",
    path: ["frequency_interval"],
})
.refine((data) => {
    if (data.type === 'habit' && data.measurement_type === 'quantitative') {
        return data.measurement_goal?.target != null && data.measurement_goal?.unit != null && data.measurement_goal.unit.length > 0;
    }
    return true;
}, {
    message: "El objetivo y la unidad son requeridos para hábitos cuantitativos",
    path: ['measurement_goal'],
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
    { id: 'mon', label: 'Lunes' },
    { id: 'tue', label: 'Martes' },
    { id: 'wed', label: 'Miércoles' },
    { id: 'thu', label: 'Jueves' },
    { id: 'fri', label: 'Viernes' },
    { id: 'sat', label: 'Sábado' },
    { id: 'sun', label: 'Domingo' },
]

export function AddHabitTaskDialog({ 
    isOpen, 
    onOpenChange, 
    onSave, 
    habitTask, 
    defaultAreaPrkId, 
    defaultDate, 
    areaPrks,
    defaultValues
}: AddHabitTaskDialogProps) {
  const isEditing = !!habitTask;

  const form = useForm<HabitTaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      type: 'task',
      start_date: defaultDate || new Date(),
      area_prk_id: defaultAreaPrkId,
      weight: 1,
      is_critical: false,
      ...defaultValues
    },
  });

  const type = form.watch('type');
  const frequency = type === 'habit' ? form.watch('frequency') : undefined;
  const isIntervalFrequency = frequency === 'every_x_days' || frequency === 'every_x_weeks' || frequency === 'every_x_months';
  const measurementType = type === 'habit' ? form.watch('measurement_type') : undefined;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && habitTask) {
        const baseValues: any = {
            title: habitTask.title,
            type: habitTask.type,
            area_prk_id: habitTask.area_prk_id,
            start_date: habitTask.start_date ? parseISO(habitTask.start_date) : (defaultDate || new Date()),
            due_date: habitTask.due_date ? parseISO(habitTask.due_date) : undefined,
            weight: habitTask.weight || 1,
            is_critical: habitTask.is_critical || false,
        };

        if (habitTask.type === 'habit') {
            form.reset({
                ...baseValues,
                frequency: habitTask.frequency || 'daily',
                frequency_days: habitTask.frequency_days || [],
                frequency_interval: habitTask.frequency_interval,
                frequency_unit: habitTask.frequency_unit,
                measurement_type: habitTask.measurement_type === 'quantitative' ? 'quantitative' : 'binary',
                ...(habitTask.measurement_type === 'quantitative' && {
                    measurement_goal: {
                        target: habitTask.measurement_goal?.target || 1,
                        unit: habitTask.measurement_goal?.unit || '',
                    }
                }),
                 ...(habitTask.measurement_type === 'binary' && {
                    measurement_goal: undefined
                })
            });
        } else {
            form.reset(baseValues);
        }
      } else {
        form.reset({
          title: '',
          type: 'task',
          start_date: defaultDate || new Date(),
          due_date: undefined,
          area_prk_id: defaultAreaPrkId,
          weight: 1,
          is_critical: false,
          frequency_interval: 1,
          frequency_unit: 'days',
          ...defaultValues
        });
      }
    }
  }, [isOpen, isEditing, habitTask, form, defaultAreaPrkId, defaultDate, defaultValues]);


  const onSubmit = (values: HabitTaskFormValues) => {
    let finalValues = { ...values };

    if (values.frequency === 'every_x_weeks') {
        finalValues.frequency_unit = 'weeks';
    } else if (values.frequency === 'every_x_months') {
        finalValues.frequency_unit = 'months';
    } else if (values.frequency === 'every_x_days') {
        finalValues.frequency_unit = 'days';
    }

    onSave(finalValues);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {isEditing ? 'Editar Acción' : 'Crear Acción'}
          </DialogTitle>
          <DialogDescription>
            Esta es una acción concreta que apoya tu PRK de Área.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Correr 5km" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      if (value === 'habit') {
                        form.setValue('frequency', 'daily');
                        form.setValue('measurement_type', 'binary');
                      }
                  }} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="task">Tarea (Acción única)</SelectItem>
                      <SelectItem value="project">Proyecto (Agrupa Tareas)</SelectItem>
                      <SelectItem value="habit">Hábito (Acción recurrente)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="area_prk_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PRK de Área Asociado</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isEditing}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un PRK de Área" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {areaPrks.map(ap => (
                                <SelectItem key={ap.id} value={ap.id}>{ap.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP", { locale: es })
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
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />

            {type !== 'habit' && (
                <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Fecha Límite (Opcional)</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP", { locale: es })
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
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            {type === 'habit' && (
                <>
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Frecuencia</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecciona una frecuencia" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="daily">Diaria</SelectItem>
                                <SelectItem value="specific_days">Días Específicos</SelectItem>
                                <SelectItem value="every_x_days">Cada X Días</SelectItem>
                                <SelectItem value="every_x_weeks">Cada X Semanas</SelectItem>
                                <SelectItem value="every_x_months">Cada X Meses</SelectItem>
                                <SelectItem value="weekly">Acumulativo Semanal</SelectItem>
                                <SelectItem value="monthly">Acumulativo Mensual</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                    />

                    {isIntervalFrequency && (
                         <FormField
                            control={form.control}
                            name="frequency_interval"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>
                                    Intervalo (Cada X...)
                                </FormLabel>
                                <Input type="number" min="1" placeholder="Ej: 2" {...field} />
                                <FormMessage />
                                </FormItem>
                            )}
                         />
                    )}

                    {frequency === 'specific_days' && (
                        <FormField
                            control={form.control}
                            name="frequency_days"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Días de la Semana</FormLabel>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                    {daysOfWeek.map((item) => (
                                        <FormField
                                        key={item.id}
                                        control={form.control}
                                        name="frequency_days"
                                        render={({ field }) => {
                                            return (
                                            <FormItem
                                                key={item.id}
                                                className="flex flex-row items-start space-x-3 space-y-0"
                                            >
                                                <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                    return checked
                                                        ? field.onChange([...(field.value || []), item.id])
                                                        : field.onChange(
                                                            field.value?.filter(
                                                            (value) => value !== item.id
                                                            )
                                                        )
                                                    }}
                                                />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                {item.label}
                                                </FormLabel>
                                            </FormItem>
                                            )
                                        }}
                                        />
                                    ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="measurement_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Medición</FormLabel>
                                <Select 
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        if (value === 'quantitative') {
                                            form.setValue('measurement_goal', { target: 1, unit: ''});
                                        } else {
                                            form.setValue('measurement_goal', undefined);
                                        }
                                    }} 
                                    defaultValue={field.value} 
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un tipo de medición" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="binary">Binario (Sí/No)</SelectItem>
                                        <SelectItem value="quantitative">Cuantitativo (Numérico)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {measurementType === 'quantitative' && (
                        <div className="space-y-2">
                            <Label>Objetivo Cuantitativo</Label>
                            <div className="flex gap-2">
                                <FormField
                                    control={form.control}
                                    name="measurement_goal.target"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    placeholder="Objetivo"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="measurement_goal.unit"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormControl>
                                                <Input 
                                                    placeholder="Unidad (ej: páginas)" 
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                             <FormMessage />
                        </div>
                    )}
                </>
            )}
            
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de Impacto (1-5)</FormLabel>
                   <Input type="number" min="1" max="5" placeholder="1" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_critical"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>¿Es Crítico?</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />


            <DialogFooter>
              <Button type="submit">{isEditing ? 'Guardar Cambios' : 'Agregar Acción'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
