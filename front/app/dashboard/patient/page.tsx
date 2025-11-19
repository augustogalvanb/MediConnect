'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Calendar, FileText, CreditCard, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, appointmentsRes] = await Promise.all([
        api.get('/statistics/patient/me'),
        api.get('/appointments/upcoming'),
      ]);

      setStats(statsRes.data);
      setUpcomingAppointments(appointmentsRes.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido/a, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Aquí puedes ver un resumen de tu actividad médica
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Turnos Totales
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.appointments?.total || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats?.appointments?.completed || 0} completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximos Turnos
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.appointments?.upcoming || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              Próximas consultas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Historial Médico
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.medicalRecords?.total || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              Registros Médicos
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Próximos Turnos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Próximos Turnos</CardTitle>
              <CardDescription>
                Tus consultas médicas programadas
              </CardDescription>
            </div>
            <Link href="/dashboard/patient/appointments">
              <Button variant="outline">Ver Todos</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tienes turnos programados</p>
              <Link href="/dashboard/patient/appointments">
                <Button className="mt-4">Reservar Turno</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Dr/a. {appointment.doctor.firstName} {appointment.doctor.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.doctor.specialty}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(appointment.date), "EEEE, d 'de' MMMM", { locale: es })} - {appointment.startTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(appointment.status)}
                    <Link href={`/dashboard/patient/appointments/${appointment.id}`}>
                      <Button variant="outline" size="sm">Ver Detalles</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Accede rápidamente a las funciones principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/dashboard/patient/appointments/new">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                <Calendar className="h-8 w-8" />
                <span>Reservar Turno</span>
              </Button>
            </Link>
            <Link href="/dashboard/patient/records">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                <FileText className="h-8 w-8" />
                <span>Ver Historial</span>
              </Button>
            </Link>
            <Link href="/dashboard/patient/chat">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                <Clock className="h-8 w-8" />
                <span>Soporte</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}