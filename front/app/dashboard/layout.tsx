'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Heart,
  Home,
  Calendar,
  FileText,
  MessageCircle,
  CreditCard,
  Users,
  Settings,
  LogOut,
  BarChart3,
  Clock,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    // Solo cargar notificaciones si es admin o recepcionista
    if (user?.role === 'admin' || user?.role === 'receptionist') {
      fetchUnreadChats();
      
      // Actualizar cada 5 segundos
      const interval = setInterval(fetchUnreadChats, 5000);
      
      return () => clearInterval(interval);
    }
  }, [user?.role]);

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

  const getNavigation = () => {
    if (!user) return [];

    const baseNav = [
      { name: 'Inicio', href: `/dashboard/${user.role}`, icon: Home },
    ];

    switch (user.role) {
      case 'patient':
        return [
          ...baseNav,
          { name: 'Mis Turnos', href: '/dashboard/patient/appointments', icon: Calendar },
          { name: 'Historial Médico', href: '/dashboard/patient/records', icon: FileText },
          { name: 'Chat', href: '/dashboard/patient/chat', icon: MessageCircle },
        ];
      case 'doctor':
        return [
          ...baseNav,
          { name: 'Mis Turnos', href: '/dashboard/doctor/appointments', icon: Calendar },
          { name: 'Pacientes', href: '/dashboard/doctor/patients', icon: Users },
          { name: 'Mi Agenda', href: '/dashboard/doctor/availability', icon: Clock },
        ];
      case 'receptionist':
      case 'admin':
        return [
          ...baseNav,
          { name: 'Pacientes', href: '/dashboard/admin/patients', icon: Users },
          { name: 'Médicos', href: '/dashboard/admin/doctors', icon: Users },
          { name: 'Pagos', href: '/dashboard/admin/payments', icon: CreditCard },
          { 
            name: 'Chat', 
            href: '/dashboard/admin/chat', 
            icon: MessageCircle,
            badge: unreadChatCount // Agregar badge aquí
          },
          { name: 'Estadísticas', href: '/dashboard/admin/stats', icon: BarChart3 },
        ];
      default:
        return baseNav;
    }
  };

  const navigation = getNavigation();

  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const getRoleLabel = () => {
    const labels = {
      patient: 'Paciente',
      doctor: 'Médico',
      receptionist: 'Recepcionista',
      admin: 'Administrador',
    };
    return labels[user?.role || 'patient'];
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center space-x-2 p-6 border-b">
              <Heart className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">MediConnect</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navigation.map((item: any) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={`flex items-center justify-between px-4 py-3 rounded-lg transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      
                      {/* Badge de notificación */}
                      {item.badge && item.badge > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-2 h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs"
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="p-4 border-t">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start px-4">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">
                        {user?.firstName} {user?.lastName}
                      </span>
                      <span className="text-xs text-gray-500">{getRoleLabel()}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="pl-64">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}