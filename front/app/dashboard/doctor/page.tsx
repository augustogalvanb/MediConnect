'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Calendar, Users, FileText, Clock, Activity, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X } from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const dateStr = format(today, 'yyyy-MM-dd');

      const [statsRes, appointmentsRes] = await Promise.all([
        api.get('/statistics/doctor/me'),
        api.get('/appointments', {
          params: {
            dateFrom: dateStr,
            dateTo: dateStr,
          },
        }),
      ]);

      setStats(statsRes.data);
      // Filtrar en el frontend los turnos de hoy
      const todayStr = format(today, 'yyyy-MM-dd');
      const todayAppts = appointmentsRes.data.filter((apt: any) => {
        const aptDateStr = format(new Date(apt.date), 'yyyy-MM-dd');
        return aptDateStr === todayStr;
      });

      setTodayAppointments(todayAppts);
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
          Bienvenido/a, Dr/a. {user?.lastName}! 👨‍⚕️
        </h1>
        <p className="text-gray-600 mt-2">
          Panel de control médico - {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Turnos de Hoy
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.appointments?.today || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              Consultas programadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximos 7 días
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.appointments?.upcoming || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              Turnos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.patients?.unique || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              Pacientes atendidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Turnos Cancelados
            </CardTitle>
            <X className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.appointments?.cancelled || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Total cancelados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Adicionales */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Rendimiento</span>
            </CardTitle>
            <CardDescription>Estadísticas generales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Turnos Totales</span>
              <span className="font-semibold">{stats?.appointments?.total || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Turnos Completados</span>
              <span className="font-semibold text-green-600">{stats?.appointments?.completed || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Acciones Rápidas</span>
            </CardTitle>
            <CardDescription>Acceso directo a funciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/doctor/appointments">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Ver Todos los Turnos
              </Button>
            </Link>
            <Link href="/dashboard/doctor/patients">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Mis Pacientes
              </Button>
            </Link>
            <Link href="/dashboard/doctor/availability">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Gestionar Disponibilidad
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Turnos de Hoy */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Turnos de Hoy</CardTitle>
              <CardDescription>
                Consultas programadas para {format(new Date(), "d 'de' MMMM", { locale: es })}
              </CardDescription>
            </div>
            <Link href="/dashboard/doctor/appointments">
              <Button variant="outline">Ver Todos</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay turnos programados para hoy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-blue-50 rounded-lg">
                      <span className="text-xs text-blue-600 font-medium">
                        {appointment.startTime}
                      </span>
                      <span className="text-xs text-gray-500">
                        {appointment.endTime}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.reason || 'Consulta general'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tel: {appointment.patient.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(appointment.status)}
                    <Link href={`/dashboard/doctor/appointments/${appointment.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Detalle
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}