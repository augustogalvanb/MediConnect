'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  CreditCard,
  MapPin,
  Activity,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminPatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [params.id]);

  const fetchPatientData = async () => {
    try {
      const [patientRes, appointmentsRes, recordsRes, paymentsRes] = await Promise.all([
        api.get(`/users/${params.id}`),
        api.get('/appointments', { params: { patientId: params.id } }),
        api.get(`/medical-records/patient/${params.id}`),
        api.get('/payments', { params: { patientId: params.id } }),
      ]);

      setPatient(patientRes.data);
      setAppointments(appointmentsRes.data);
      setMedicalRecords(recordsRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      toast.error('Error al cargar información del paciente');
      router.push('/dashboard/admin/patients');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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

  const getPaymentStatusBadge = (status: string) => {
    const variants: any = {
      pending: 'secondary',
      completed: 'default',
      failed: 'destructive',
      refunded: 'outline',
    };

    const labels: any = {
      pending: 'Pendiente',
      completed: 'Completado',
      failed: 'Fallido',
      refunded: 'Reembolsado',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/admin/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Información del Paciente</h1>
          <p className="text-gray-600 mt-1">
            Detalles completos y historial
          </p>
        </div>
      </div>

      {/* Información del Paciente */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-6">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                {getInitials(patient.firstName, patient.lastName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h2>
                <Badge variant={patient.isActive ? 'default' : 'secondary'}>
                  {patient.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              {/* Información de contacto */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{patient.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{calculateAge(patient.dateOfBirth)} años - {patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : 'Otro'}</span>
                </div>
                {patient.dni && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>DNI: {patient.dni}</span>
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{patient.address}</span>
                  </div>
                )}
                {(patient.city || patient.province) && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{patient.city}{patient.city && patient.province && ', '}{patient.province}</span>
                  </div>
                )}
              </div>

              {/* Estadísticas rápidas */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{appointments.length}</p>
                      <p className="text-sm text-gray-600 mt-1">Total Turnos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{medicalRecords.length}</p>
                      <p className="text-sm text-gray-600 mt-1">Registros Médicos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {appointments.filter(apt => apt.status === 'completed').length}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Completados</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs con información detallada */}
      <Tabs defaultValue="appointments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="appointments">
            Turnos ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="payments">
            Pagos ({payments.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab de Turnos */}
        <TabsContent value="appointments" className="space-y-4">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay turnos registrados</p>
              </CardContent>
            </Card>
          ) : (
            appointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-center justify-center w-20 h-20 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-600">
                          {format(new Date(appointment.date), 'd MMM', { locale: es })}
                        </span>
                        <span className="text-xs text-gray-500">
                          {appointment.startTime}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Dr/a. {appointment.doctor.firstName} {appointment.doctor.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{appointment.doctor.specialty}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {appointment.reason || 'Consulta general'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(appointment.status)}
                      <Link href={`/dashboard/admin/appointments/${appointment.id}`}>
                        <Button variant="outline" size="sm">Ver Detalle</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Tab de Pagos */}
        <TabsContent value="payments" className="space-y-4">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay pagos registrados</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-medium mb-1">Total Pagado</p>
                    <p className="text-3xl font-bold text-green-900">${totalPaid.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              {payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">${payment.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">
                            {payment.paymentMethod === 'cash' && 'Efectivo'}
                            {payment.paymentMethod === 'debit_card' && 'Tarjeta de Débito'}
                            {payment.paymentMethod === 'credit_card' && 'Tarjeta de Crédito'}
                            {payment.paymentMethod === 'transfer' && 'Transferencia'}
                            {payment.paymentMethod === 'health_insurance' && 'Obra Social'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(payment.paidAt || payment.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                            {payment.receiptNumber && ` - Recibo: ${payment.receiptNumber}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getPaymentStatusBadge(payment.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}