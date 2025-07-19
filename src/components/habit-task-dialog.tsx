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
import { useEffect } from 'react';

const formSchema = z.object({
  title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
  type: z.enum(['habit', 'task']),
  areaPrkId: z.string({ required_error: "Debes seleccionar un PRK de Área."}),
  startDate: z.date().optional(),
  dueDate: z.date().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'specific_days']).optional(),
  frequencyDays: z.array(z.string()).optional(),
  weight: z.coerce.number().min(1, { message: 'El impacto debe ser al menos 1.' }).max(5, { message: 'El impacto no puede ser mayor a 5.' }).default(1),
}).refine(data => {
    if (data.type === 'habit' && !data.frequency) {
        return false;
    }
    return true;
}, { message: "La frecuencia es requerida para los hábitos", path: ['frequency'] })
.refine(data => {
    if (data.frequency === 'specific_days' && (!data.frequencyDays || data.frequencyDays.length === 0)) {
        return false;
    }
    return true;
}, { message: "Debes seleccionar al menos un día para la frecuencia específica", path: ['frequencyDays'] });


export type HabitTaskFormValues = z.infer<typeof formSchema>;

interface HabitTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (values: HabitTaskFormValues, areaPrkId: string) => void;
  habitTask: HabitTask | null;
  defaultAreaPrkId?: string;
  defaultDate?: Date;
  areaPrks: AreaPrk[];
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

export function HabitTaskDialog({ isOpen, onOpenChange, onSave, habitTask, defaultAreaPrkId, defaultDate, areaPrks }: HabitTaskDialogProps) {
  const isEditing = !!habitTask;

  const form = useForm<HabitTaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      type: 'task',
      frequencyDays: [],
      startDate: defaultDate || new Date(),
      areaPrkId: defaultAreaPrkId,
      weight: 1,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && habitTask) {
        form.reset({
          title: habitTask.title,
          type: habitTask.type,
          areaPrkId: habitTask.areaPrkId,
          startDate: habitTask.startDate ? parseISO(habitTask.startDate) : (defaultDate || new Date()),
          dueDate: habitTask.dueDate ? parseISO(habitTask.dueDate) : undefined,
          frequency: habitTask.frequency || undefined,
          frequencyDays: habitTask.frequencyDays || [],
          weight: habitTask.weight || 1,
        });
      } else {
        form.reset({
          title: '',
          type: 'task',
          frequencyDays: [],
          startDate: defaultDate || new Date(),
          dueDate: undefined,
          frequency: undefined,
          areaPrkId: defaultAreaPrkId,
          weight: 1,
        });
      }
    }
  }, [isOpen, isEditing, habitTask, form, defaultAreaPrkId, defaultDate]);


  const onSubmit = (values: HabitTaskFormValues) => {
    onSave(values, values.areaPrkId);
    form.reset();
    onOpenChange(false);
  };

  const type = form.watch('type');
  const frequency = form.watch('frequency');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {isEditing ? 'Editar Hábito o Hito' : 'Crear un Hábito o Hito'}
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
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="task">Hito (Acción única de impacto)</SelectItem>
                      <SelectItem value="habit">Hábito (Acción recurrente)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="areaPrkId"
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
                name="startDate"
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

            {type === 'task' && (
                <FormField
                    control={form.control}
                    name="dueDate"
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
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="monthly">Mensual</SelectItem>
                                <SelectItem value="specific_days">Días Específicos</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                    />

                    {frequency === 'specific_days' && (
                        <FormField
                            control={form.control}
                            name="frequencyDays"
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
                                        name="frequencyDays"
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
                </>
            )}
            
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de Impacto (Peso)</FormLabel>
                   <Input type="number" min="1" max="5" placeholder="1" {...field} />
                  <FormMessage />
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
