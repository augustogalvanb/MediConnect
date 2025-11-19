'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  Clock,
  User,
  FileText,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Stethoscope,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface AppointmentDetail {
  _id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  };
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
    specialty: string;
    licenseNumber: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
  cancelReason?: string;
  confirmedBy?: any;
  confirmedAt?: string;
  price: number;
  createdAt: string;
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');

  useEffect(() => {
    fetchAppointmentDetail();
  }, [params.id]);

  const fetchAppointmentDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/${params.id}`);
      console.log(response.data);
      setAppointment(response.data);
    } catch (error) {
      console.error('Error al cargar turno:', error);
      toast.error('Error al cargar los detalles del turno');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      await api.post(`/appointments/${params.id}/confirm`, {
        notes: confirmNotes,
      });
      toast.success('Turno confirmado exitosamente');
      setShowConfirmDialog(false);
      setConfirmNotes('');
      fetchAppointmentDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al confirmar turno');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      await api.post(`/appointments/${params.id}/cancel`, {
        reason: cancelReason,
      });
      toast.success('Turno cancelado exitosamente');
      setShowCancelDialog(false);
      setCancelReason('');
      fetchAppointmentDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cancelar turno');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setActionLoading(true);
      await api.post(`/appointments/${params.id}/complete`, {
        notes: completeNotes,
      });
      toast.success('Turno completado exitosamente');
      setShowCompleteDialog(false);
      setCompleteNotes('');
      fetchAppointmentDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al completar turno');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: 'secondary', label: 'Pendiente', icon: Clock },
      confirmed: { variant: 'default', label: 'Confirmado', icon: CheckCircle },
      completed: { variant: 'outline', label: 'Completado', icon: CheckCircle },
      cancelled: { variant: 'destructive', label: 'Cancelado', icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="text-sm px-3 py-1">
        <Icon className="h-4 w-4 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando detalles del turno...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">No se encontró el turno</p>
          <Button onClick={() => router.push('/dashboard/admin/appointments')} className="mt-4">
            Volver a Turnos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/dashboard/admin/patients/${appointment.patient.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalle del Turno</h1>
            <p className="text-gray-600 mt-1">
              Información completa de la cita médica
            </p>
          </div>
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Información del Turno */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Información del Turno</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fecha</p>
                  <p className="font-medium text-lg">
                    {appointment.date 
                      ? format(new Date(appointment.date), "EEEE, d 'de' MMMM 'de' yyyy", {
                          locale: es,
                        })
                      : 'Fecha no disponible'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Horario</p>
                  <p className="font-medium text-lg">
                    {appointment.startTime} - {appointment.endTime}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600 mb-1">Motivo de consulta</p>
                <p className="font-medium">{appointment.reason}</p>
              </div>

              {appointment.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Notas</p>
                    <p className="text-gray-800">{appointment.notes}</p>
                  </div>
                </>
              )}

              {appointment.cancelReason && (
                <>
                  <Separator />
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-900 mb-1">
                      Motivo de cancelación
                    </p>
                    <p className="text-red-800">{appointment.cancelReason}</p>
                  </div>
                </>
              )}

            </CardContent>
          </Card>

          {/* Información del Médico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5" />
                <span>Médico Asignado</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    Dr/a. {appointment.doctor.firstName} {appointment.doctor.lastName}
                  </p>
                  <p className="text-gray-600">{appointment.doctor.specialty}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          {/* Información del Paciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Paciente</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div>
                  <p className="font-semibold">
                    {appointment.patient.firstName} {appointment.patient.lastName}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">{appointment.patient.email}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">{appointment.patient.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
              <CardDescription>Gestionar el turno</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {appointment.status === 'pending' && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => setShowConfirmDialog(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Turno
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar Turno
                  </Button>
                </>
              )}

              {appointment.status === 'confirmed' && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => setShowCompleteDialog(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Completado
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar Turno
                  </Button>
                </>
              )}

              {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                <div className="text-center py-4 text-gray-600">
                  <p className="text-sm">
                    No hay acciones disponibles para este turno
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo de Confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Turno</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas confirmar este turno?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Notas de confirmación (opcional)
            </label>
            <Textarea
              placeholder="Agregar notas..."
              value={confirmNotes}
              onChange={(e) => setConfirmNotes(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={actionLoading}>
              {actionLoading ? 'Confirmando...' : 'Confirmar Turno'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Cancelación */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Turno</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El paciente será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Motivo de cancelación <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Explica el motivo de la cancelación..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={!cancelReason.trim() || actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Cancelando...' : 'Cancelar Turno'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Completar */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Completar Turno</AlertDialogTitle>
            <AlertDialogDescription>
              Marcar este turno como completado
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Notas finales (opcional)
            </label>
            <Textarea
              placeholder="Agregar observaciones finales..."
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} disabled={actionLoading}>
              {actionLoading ? 'Completando...' : 'Completar Turno'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}