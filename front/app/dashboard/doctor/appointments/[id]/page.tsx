'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, Check, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function DoctorAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [params.id]);

  const fetchAppointment = async () => {
    try {
      const response = await api.get(`/appointments/${params.id}`);
      setAppointment(response.data);
      setNotes(response.data.notes || '');
    } catch (error) {
      toast.error('Error al cargar turno');
      router.push('/dashboard/doctor/appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await api.post(`/appointments/${params.id}/confirm`, { notes });
      toast.success('Turno confirmado');
      fetchAppointment();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al confirmar turno');
    } finally {
      setConfirming(false);
    }
  };

  const handleCompleteAndCreateRecord = async () => {
    setCompleting(true);
    try {
      await api.post(`/appointments/${params.id}/complete`, { notes });
      toast.success('Turno completado');
      
      // Redirigir a crear registro médico con los datos del turno
      router.push(`/dashboard/doctor/records/new?patientId=${appointment.patient.id}&appointmentId=${params.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al completar turno');
      setCompleting(false);
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/doctor/patients/${appointment.patient.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalle del Turno</h1>
            <p className="text-gray-600 mt-1">
              Información del paciente y consulta
            </p>
          </div>
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Información del Paciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Información del Paciente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Nombre Completo</p>
              <p className="font-medium">
                {appointment.patient.firstName} {appointment.patient.lastName}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-600" />
              <p className="font-medium">{appointment.patient.phone}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-600" />
              <p className="font-medium">{appointment.patient.email}</p>
            </div>
            <Link href={`/dashboard/doctor/patients/${appointment.patient.id}`}>
              <Button variant="outline" size="sm" className="w-full mt-4">
                Ver Historial Completo
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Información del Turno */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Información del Turno</span>
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
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <p className="font-medium">
                  {appointment.startTime} - {appointment.endTime}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tipo de Consulta</p>
              <p className="font-medium capitalize">
                {appointment.type === 'in_person' ? 'Presencial' : 'Online'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivo de la Consulta */}
      {appointment.reason && (
        <Card>
          <CardHeader>
            <CardTitle>Motivo de la Consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900">{appointment.reason}</p>
          </CardContent>
        </Card>
      )}

      {/* Notas del Médico */}
      <Card>
        <CardHeader>
          <CardTitle>Notas de la Consulta</CardTitle>
          <CardDescription>
            Agrega observaciones sobre esta consulta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones, indicaciones, seguimiento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      {appointment.status === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>Confirmar Turno</CardTitle>
            <CardDescription>
              Confirma la asistencia del paciente a esta consulta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleConfirm} disabled={confirming} className="w-full md:w-auto">
              <Check className="h-4 w-4 mr-2" />
              {confirming ? 'Confirmando...' : 'Confirmar Turno'}
            </Button>
          </CardContent>
        </Card>
      )}

      {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">Completar Consulta</CardTitle>
            <CardDescription>
              Marca este turno como completado y serás redirigido para crear el registro médico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Al completar:</strong> Serás redirigido automáticamente al formulario de registro médico 
                donde podrás documentar la consulta con todos los detalles clínicos.
              </p>
            </div>
            <Button 
              onClick={handleCompleteAndCreateRecord} 
              disabled={completing} 
              className="w-full md:w-auto bg-green-600 hover:bg-green-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              {completing ? 'Completando...' : 'Completar y Crear Registro Médico'}
            </Button>
          </CardContent>
        </Card>
      )}

      {appointment.status === 'completed' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-900">Consulta Completada</p>
                <p className="text-sm text-green-700">
                  Esta consulta fue marcada como completada
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}