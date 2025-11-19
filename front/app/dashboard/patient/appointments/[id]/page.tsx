'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Clock, MapPin, Video, User, AlertCircle, X } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [params.id]);

  const fetchAppointment = async () => {
    try {
      const response = await api.get(`/appointments/${params.id}`);
      setAppointment(response.data);
    } catch (error) {
      toast.error('Error al cargar turno');
      router.push('/dashboard/patient/appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Debes ingresar un motivo de cancelación');
      return;
    }

    setCancelling(true);

    try {
      await api.post(`/appointments/${params.id}/cancel`, {
        cancelReason,
      });

      toast.success('Turno cancelado exitosamente');
      router.push('/dashboard/patient/appointments');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al cancelar turno';
      toast.error(message);
    } finally {
      setCancelling(false);
      setCancelDialogOpen(false);
    }
  };

  const canCancel = () => {
    if (!appointment || appointment.status !== 'pending' && appointment.status !== 'confirmed') {
      return false;
    }

    const appointmentDateTime = new Date(appointment.date);
    const [hours, minutes] = appointment.startTime.split(':');
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

    const hoursUntilAppointment = differenceInHours(appointmentDateTime, new Date());
    return hoursUntilAppointment >= 24;
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
      <Badge variant={variants[status] || 'secondary'} className="text-sm">
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!appointment) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/patient/appointments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalle del Turno</h1>
            <p className="text-gray-600 mt-1">
              Información completa de tu cita médica
            </p>
          </div>
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      {appointment.status === 'cancelled' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Turno cancelado</p>
            {appointment.cancelReason && (
              <p className="text-sm mt-1">Motivo: {appointment.cancelReason}</p>
            )}
            {appointment.cancelledAt && (
              <p className="text-sm mt-1">
                Fecha de cancelación: {format(new Date(appointment.cancelledAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {!canCancel() && (appointment.status === 'pending' || appointment.status === 'confirmed') && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Los turnos solo pueden cancelarse con al menos 24 horas de anticipación
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Información del Médico</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Nombre</p>
              <p className="font-medium">
                Dr/a. {appointment.doctor.firstName} {appointment.doctor.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Especialidad</p>
              <p className="font-medium">{appointment.doctor.specialty}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Fecha y Hora</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Fecha</p>
              <p className="font-medium">
                {format(new Date(appointment.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Horario</p>
              <p className="font-medium">
                {appointment.startTime} - {appointment.endTime}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Consulta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            {appointment.type === 'in_person' ? (
              <>
                <MapPin className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Consulta Presencial</span>
              </>
            ) : (
              <>
                <Video className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Consulta Online</span>
              </>
            )}
          </div>

          {appointment.reason && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Motivo de la Consulta</p>
              <p className="text-gray-900">{appointment.reason}</p>
            </div>
          )}

          {appointment.notes && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Notas del Médico</p>
              <p className="text-gray-900">{appointment.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {canCancel() && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Cancelar Turno</CardTitle>
            <CardDescription>
              Si necesitas cancelar este turno, por favor indica el motivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar Turno
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Cancelar turno?</DialogTitle>
                  <DialogDescription>
                    Esta acción no se puede deshacer. Por favor indica el motivo de la cancelación.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="cancelReason">Motivo de cancelación</Label>
                    <Textarea
                      id="cancelReason"
                      placeholder="Ej: Surgió un imprevisto laboral..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCancelDialogOpen(false)}
                    disabled={cancelling}
                  >
                    Volver
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}