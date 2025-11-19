'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  FileText, 
  TrendingUp,
  UserPlus,
  Activity,
  MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchUnreadChats();

    // Actualizar notificaciones de chat cada 5 segundos
    const chatInterval = setInterval(fetchUnreadChats, 5000);

    return () => clearInterval(chatInterval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, appointmentsRes] = await Promise.all([
        api.get('/statistics/dashboard'),
        api.get('/appointments', {
          params: {
            dateFrom: format(new Date(), 'yyyy-MM-dd'),
            dateTo: format(new Date(), 'yyyy-MM-dd'),
          },
        }),
      ]);

      setStats(statsRes.data);
      setTodayAppointments(appointmentsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadChats = async () => {
    try {
      const response = await api.get('/chats/active');
      const unread = response.data.reduce((acc: number, chat: any) => {
        const unreadInChat = chat.messages.filter(
          (m: any) => !m.isRead && m.senderType === 'user'
        ).length;
        return acc + unreadInChat;
      }, 0);
      setUnreadChatCount(unread);
    } catch (error) {
      console.error('Error al cargar notificaciones de chat:', error);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Panel de Administración
        </h1>
        <p className="text-gray-600 mt-2">
          Vista general del sistema - {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users?.patients || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              Usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Médicos Activos
            </CardTitle>
            <Activity className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users?.doctors || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              Profesionales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Turnos de Hoy
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.appointments?.today || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              Consultas programadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Acceso directo a funciones administrativas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <Link href="/dashboard/admin/doctors">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                <UserPlus className="h-8 w-8" />
                <span>Gestionar Médicos</span>
              </Button>
            </Link>
            <Link href="/dashboard/admin/patients">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                <Users className="h-8 w-8" />
                <span>Ver Pacientes</span>
              </Button>
            </Link>
            <Link href="/dashboard/admin/chat">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                <MessageCircle className="h-8 w-8" />
                <span>Chat de Soporte</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Turnos de Hoy */}
      {todayAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Turnos de Hoy</CardTitle>
                <CardDescription>
                  Próximas consultas programadas
                </CardDescription>
              </div>
              <Link href="/dashboard/admin/appointments">
                <Button variant="outline">Ver Todos</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-blue-50 rounded-lg">
                      <span className="text-xs text-blue-600 font-medium">
                        {appointment.startTime}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Dr/a. {appointment.doctor.firstName} {appointment.doctor.lastName}
                      </p>
                    </div>
                  </div>
                  <Link href={`/dashboard/admin/appointments/${appointment.id}`}>
                    <Button variant="outline" size="sm">
                      Ver Detalle
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}