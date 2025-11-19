'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NewAppointmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [type, setType] = useState('in_person');
  const [reason, setReason] = useState('');
  const [datesWithAvailability, setDatesWithAvailability] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      // Resetear selecciones al cambiar de doctor
      setSelectedDate(undefined);
      setSelectedSlot('');
      setAvailableSlots([]);
      
      // Cargar fechas con disponibilidad para los próximos 90 días
      checkAvailabilityForNextDays();
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/users/doctors');
      setDoctors(response.data);
    } catch (error) {
      toast.error('Error al cargar médicos');
    }
  };

  const checkAvailabilityForNextDays = async () => {
    if (!selectedDoctor) return;

    setCheckingAvailability(true);
    const datesWithSlots = new Set<string>();
    const today = startOfDay(new Date());
    
    // Verificar disponibilidad para los próximos 90 días
    const promises = [];
    for (let i = 0; i < 90; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      promises.push(
        api.get('/appointments/availability/slots/available', {
          params: { doctorId: selectedDoctor, date: dateStr },
        })
        .then(response => {
          if (response.data.length > 0) {
            datesWithSlots.add(dateStr);
          }
        })
        .catch(() => {
          // Ignorar errores individuales
        })
      );
    }

    // Ejecutar todas las peticiones en paralelo
    await Promise.all(promises);
    
    setDatesWithAvailability(datesWithSlots);
    setCheckingAvailability(false);
  };

  const fetchAvailableSlots = async () => {
    try {
      const dateStr = format(selectedDate!, 'yyyy-MM-dd');
      const response = await api.get('/appointments/availability/slots/available', {
        params: { doctorId: selectedDoctor, date: dateStr },
      });
      setAvailableSlots(response.data);
      setSelectedSlot('');
    } catch (error) {
      toast.error('Error al cargar horarios disponibles');
      setAvailableSlots([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      await api.post('/appointments', {
        doctorId: selectedDoctor,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedSlot,
        type,
        reason,
      });

      toast.success('¡Turno reservado exitosamente!');
      router.push('/dashboard/patient/appointments');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al reservar turno';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const selectedDoctorData = doctors.find((d) => d.id === selectedDoctor);

  // Función para verificar si una fecha tiene disponibilidad
  const hasAvailability = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return datesWithAvailability.has(dateStr);
  };

  // Función para deshabilitar fechas
  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    const maxDate = addDays(today, 90);
    
    // Deshabilitar fechas pasadas y mayores a 90 días
    if (date < today || date > maxDate) {
      return true;
    }

    // Si se está cargando disponibilidad, no deshabilitar nada aún
    if (checkingAvailability) {
      return false;
    }

    // Deshabilitar fechas sin disponibilidad
    return !hasAvailability(date);
  };

  // Modificadores para el calendario
  const modifiers = {
    available: (date: Date) => hasAvailability(date) && date >= startOfDay(new Date()),
    unavailable: (date: Date) => !hasAvailability(date) && date >= startOfDay(new Date()) && date <= addDays(new Date(), 90),
  };

  const modifiersStyles = {
    available: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      fontWeight: 'bold',
    },
    unavailable: {
      color: '#d1d5db',
      textDecoration: 'line-through',
    },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/patient/appointments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservar Turno</h1>
          <p className="text-gray-600 mt-1">Selecciona médico, fecha y horario</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleccionar Médico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Seleccionar Médico</span>
            </CardTitle>
            <CardDescription>
              Elige el profesional con quien deseas realizar la consulta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doctor">Médico</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar médico" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr/a. {doctor.firstName} {doctor.lastName} - {doctor.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDoctorData && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">
                  Dr/a. {selectedDoctorData.firstName} {selectedDoctorData.lastName}
                </p>
                <p className="text-sm text-blue-700">{selectedDoctorData.specialty}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seleccionar Fecha */}
        {selectedDoctor && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5" />
                    <span>Seleccionar Fecha</span>
                  </CardTitle>
                  <CardDescription>
                    Elige el día de tu consulta
                  </CardDescription>
                </div>
                {checkingAvailability && (
                  <Badge variant="secondary" className="animate-pulse">
                    Cargando disponibilidad...
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Leyenda */}
              <div className="flex flex-wrap gap-4 text-sm p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-600"></div>
                  <span className="text-gray-700">Fechas disponibles</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-300 line-through"></div>
                  <span className="text-gray-700">Sin disponibilidad</span>
                </div>
              </div>

              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-md border mx-auto"
                locale={es}
              />

              {!checkingAvailability && datesWithAvailability.size === 0 && (
                <div className="text-center py-4">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">
                    Este médico no tiene disponibilidad configurada
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Por favor, selecciona otro médico
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Seleccionar Horario */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Seleccionar Horario</span>
              </CardTitle>
              <CardDescription>
                Horarios disponibles para el {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    No hay horarios disponibles para esta fecha
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Intenta con otra fecha marcada en verde
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {availableSlots.length} horario{availableSlots.length !== 1 ? 's' : ''} disponible{availableSlots.length !== 1 ? 's' : ''}
                    </p>
                    {selectedSlot && (
                      <Badge variant="default" className="flex items-center space-x-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Horario seleccionado</span>
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={selectedSlot === slot ? 'default' : 'outline'}
                        onClick={() => setSelectedSlot(slot)}
                        className="h-12 font-medium"
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tipo de Consulta y Motivo */}
        {selectedSlot && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Consulta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Consulta</Label>
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo de la Consulta (Opcional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Describe brevemente el motivo de tu consulta..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumen y Confirmar */}
        {selectedSlot && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <span>Resumen del Turno</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Médico:</span>
                <span className="font-medium">
                  Dr/a. {selectedDoctorData?.firstName} {selectedDoctorData?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Especialidad:</span>
                <span className="font-medium">{selectedDoctorData?.specialty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha:</span>
                <span className="font-medium">
                  {format(selectedDate!, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Horario:</span>
                <span className="font-medium">{selectedSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-medium">{type === 'in_person' ? 'Presencial' : 'Online'}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <Link href="/dashboard/patient/appointments">
            <Button type="button" variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading || !selectedSlot}>
            {loading ? 'Reservando...' : 'Confirmar Turno'}
          </Button>
        </div>
      </form>
    </div>
  );
}