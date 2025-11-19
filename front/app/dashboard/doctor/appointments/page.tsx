'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Search, User, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [searchTerm, appointments]);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data);
      setFilteredAppointments(response.data);
    } catch (error) {
      toast.error('Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    if (!searchTerm.trim()) {
      setFilteredAppointments(appointments);
      return;
    }

    const filtered = appointments.filter((apt) =>
      `${apt.patient.firstName} ${apt.patient.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    setFilteredAppointments(filtered);
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

  const filterByStatus = (status?: string) => {
    if (!status) return filteredAppointments;
    return filteredAppointments.filter((apt) => apt.status === status);
  };

  const AppointmentCard = ({ appointment }: any) => (
  <Card className="hover:shadow-md transition">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex space-x-4 flex-1">
          <div className="flex flex-col items-center justify-center w-20 h-20 bg-blue-50 rounded-lg flex-shrink-0">
            <span className="text-sm font-medium text-blue-600">
              {appointment.startTime}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(appointment.date), 'd MMM', { locale: es })}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <h3 className="font-semibold text-gray-900 truncate">
                {appointment.patient.firstName} {appointment.patient.lastName}
              </h3>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span>{appointment.patient.phone}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>
                {format(new Date(appointment.date), "EEEE, d 'de' MMMM", { locale: es })}
              </span>
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
          <Link href={`/dashboard/doctor/appointments/${appointment.id}`}>
            <Button variant="outline" size="sm">
              Ver Detalle
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

  const todayAppointments = filterByStatus().filter(apt => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return format(new Date(apt.date), 'yyyy-MM-dd') === today;
  });

  const upcomingAppointments = filterByStatus().filter(apt => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aptDate = new Date(apt.date);
    aptDate.setHours(0, 0, 0, 0);
    return aptDate > today && (apt.status === 'pending' || apt.status === 'confirmed');
  });

  const pendingAppointments = filterByStatus('pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Turnos</h1>
          <p className="text-gray-600 mt-1">Gestiona las consultas de tus pacientes</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre de paciente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="today" className="space-y-6">
        <TabsList>
          <TabsTrigger value="today">
            Hoy ({todayAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Próximos ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendientes ({pendingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todos ({filteredAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {todayAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay turnos para hoy
                </h3>
                <p className="text-gray-600">
                  Disfruta tu día libre
                </p>
              </CardContent>
            </Card>
          ) : (
            todayAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay turnos próximos</p>
              </CardContent>
            </Card>
          ) : (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay turnos pendientes de confirmar</p>
              </CardContent>
            </Card>
          ) : (
            pendingAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron resultados</p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}