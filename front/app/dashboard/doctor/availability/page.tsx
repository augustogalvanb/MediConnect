'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Clock, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

export default function DoctorAvailabilityPage() {
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [timeSlots, setTimeSlots] = useState([{ startTime: '', endTime: '' }]);
  const [slotDuration, setSlotDuration] = useState('30');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await api.get('/appointments/availability/my-schedule');
      setAvailabilities(response.data);
    } catch (error) {
      toast.error('Error al cargar disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, { startTime: '', endTime: '' }]);
  };

  const handleRemoveTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };

  const handleTimeSlotChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index][field] = value;
    setTimeSlots(newTimeSlots);
  };

  const handleSubmit = async () => {
    if (!selectedDay) {
      toast.error('Selecciona un día de la semana');
      return;
    }

    const validSlots = timeSlots.filter(slot => slot.startTime && slot.endTime);
    if (validSlots.length === 0) {
      toast.error('Agrega al menos un horario válido');
      return;
    }

    setSaving(true);

    try {
      await api.post('/appointments/availability', {
        dayOfWeek: selectedDay,
        timeSlots: validSlots,
        slotDuration: parseInt(slotDuration),
      });

      toast.success('Disponibilidad creada exitosamente');
      setDialogOpen(false);
      resetForm();
      fetchAvailability();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al crear disponibilidad';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta disponibilidad?')) {
      return;
    }

    try {
      await api.delete(`/appointments/availability/${id}`);
      toast.success('Disponibilidad eliminada');
      fetchAvailability();
    } catch (error: any) {
      toast.error('Error al eliminar disponibilidad');
    }
  };

  const resetForm = () => {
    setSelectedDay('');
    setTimeSlots([{ startTime: '', endTime: '' }]);
    setSlotDuration('30');
  };

  const getDayLabel = (day: string) => {
    return DAYS_OF_WEEK.find(d => d.value === day)?.label || day;
  };

  const getUsedDays = () => {
    return availabilities.map(avail => avail.dayOfWeek);
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Disponibilidad</h1>
          <p className="text-gray-600 mt-1">
            Configura tus horarios de atención
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Horario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Disponibilidad</DialogTitle>
              <DialogDescription>
                Define tus horarios de atención para un día de la semana
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Día de la semana */}
              <div className="space-y-2">
                <Label>Día de la Semana</Label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar día" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.filter(day => !getUsedDays().includes(day.value)).map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duración de slots */}
              <div className="space-y-2">
                <Label>Duración de Cada Turno (minutos)</Label>
                <Select value={slotDuration} onValueChange={setSlotDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="20">20 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Horarios */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Horarios de Atención</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTimeSlot}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Horario
                  </Button>
                </div>
                
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Desde</Label>
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Hasta</Label>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleTimeSlotChange(index, 'endTime', e.target.value)}
                        />
                      </div>
                    </div>
                    {timeSlots.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveTimeSlot(index)}
                        className="mt-6"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-gray-500">
                  Puedes agregar múltiples horarios para el mismo día (ej: mañana y tarde)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Disponibilidad'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Información */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">¿Cómo funciona?</p>
              <p className="text-sm text-blue-700 mt-1">
                Define tus horarios de atención para cada día de la semana. Los pacientes solo 
                podrán reservar turnos en los horarios que configures aquí. Puedes tener múltiples 
                bloques horarios por día (por ejemplo, mañana y tarde).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de disponibilidades */}
      {availabilities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No has configurado tu disponibilidad
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza agregando tus horarios de atención
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primer Horario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const availability = availabilities.find(a => a.dayOfWeek === day.value);
            
            if (!availability) {
              return (
                <Card key={day.value} className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">{day.label}</CardTitle>
                    <CardDescription>Sin horarios configurados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedDay(day.value);
                        setDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={day.value}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{day.label}</CardTitle>
                      <CardDescription>
                        Turnos de {availability.slotDuration} minutos
                      </CardDescription>
                    </div>
                    <Badge variant="default">Activo</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availability.timeSlots.map((slot: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  ))}
                  <div className="flex space-x-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(availability._id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Resumen */}
      {availabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Disponibilidad</CardTitle>
            <CardDescription>
              Vista general de tu semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Días configurados:</span>
                <span className="font-medium">{availabilities.length} de 7</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Horarios totales:</span>
                <span className="font-medium">
                  {availabilities.reduce((acc, avail) => acc + avail.timeSlots.length, 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}