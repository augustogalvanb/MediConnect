'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, Clock, MapPin, Video } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AppointmentsPage() {
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const [upcomingRes, pastRes] = await Promise.all([
        api.get('/appointments/upcoming'),
        api.get('/appointments/past'),
      ]);

      setUpcomingAppointments(upcomingRes.data);
      setPastAppointments(pastRes.data);
    } catch (error) {
      toast.error('Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: 'secondary',
      confirmed: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    };

    const labels: any = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      completed: 'Completado',
      cancelled: 'Cancelado',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const AppointmentCard = ({ appointment, isPast = false }: any) => (
    <Card className="hover:shadow-md transition">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex space-x-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                Dr/a. {appointment.doctor.firstName} {appointment.doctor.lastName}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {appointment.doctor.specialty}
              </p>
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(new Date(appointment.date), "d 'de' MMMM, yyyy", { locale: es })} - {appointment.startTime}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {appointment.type === 'in_person' ? (
                    <>
                      <MapPin className="h-4 w-4" />
                      <span>Presencial</span>
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      <span>Online</span>
                    </>
                  )}
                </div>
              </div>
              {appointment.reason && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Motivo:</span> {appointment.reason}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge(appointment.status)}
            <Link href={`/dashboard/patient/appointments/${appointment.id}`}>
              <Button variant="outline" size="sm">
                Ver Detalles
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Turnos</h1>
          <p className="text-gray-600 mt-1">Gestiona tus citas médicas</p>
        </div>
        <Link href="/dashboard/patient/appointments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Turno
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">
            Próximos ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Historial ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes turnos próximos
                </h3>
                <p className="text-gray-600 mb-4">
                  Reserva una consulta con nuestros profesionales
                </p>
                <Link href="/dashboard/patient/appointments/new">
                  <Button>Reservar Turno</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes turnos anteriores
                </h3>
                <p className="text-gray-600">
                  Aquí aparecerán tus consultas pasadas
                </p>
              </CardContent>
            </Card>
          ) : (
            pastAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} isPast />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}