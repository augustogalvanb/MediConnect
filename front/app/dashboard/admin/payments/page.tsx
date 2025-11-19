'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, DollarSign, Plus, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  // Form states
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [healthInsuranceName, setHealthInsuranceName] = useState('');
  const [healthInsuranceNumber, setHealthInsuranceNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter, methodFilter]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientAppointments(selectedPatient);
    } else {
      setAppointments([]);
      setSelectedAppointment('');
    }
  }, [selectedPatient]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments');
      setPayments(response.data);
    } catch (error) {
      toast.error('Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await api.get('/users', { params: { role: 'patient' } });
      setPatients(response.data);
    } catch (error) {
      toast.error('Error al cargar pacientes');
    }
  };

  const fetchPatientAppointments = async (patientId: string) => {
    try {
      const response = await api.get('/appointments', {
        params: { patientId, status: 'completed' },
      });
      setAppointments(response.data);
    } catch (error) {
      toast.error('Error al cargar turnos');
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Filtrar por método
    if (methodFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.paymentMethod === methodFilter);
    }

    setFilteredPayments(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient || !selectedAppointment || !paymentMethod) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    // Si es obra social, no validar monto
    if (paymentMethod !== 'health_insurance' && !amount) {
      toast.error('El monto es requerido');
      return;
    }

    setSaving(true);

    try {
      await api.post('/payments', {
        appointmentId: selectedAppointment,
        amount: paymentMethod === 'health_insurance' ? 0 : parseFloat(amount),
        paymentMethod,
        healthInsuranceName: paymentMethod === 'health_insurance' ? healthInsuranceName : undefined,
        healthInsuranceNumber: paymentMethod === 'health_insurance' ? healthInsuranceNumber : undefined,
        transactionId,
        notes,
      });

      toast.success('Pago registrado exitosamente');
      setDialogOpen(false);
      resetForm();
      fetchPayments();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al registrar pago';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedPatient('');
    setSelectedAppointment('');
    setAmount('');
    setPaymentMethod('');
    setHealthInsuranceName('');
    setHealthInsuranceNumber('');
    setTransactionId('');
    setNotes('');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: { variant: 'default', label: 'Completado' },
      pending: { variant: 'secondary', label: 'Pendiente' },
      failed: { variant: 'destructive', label: 'Fallido' },
      refunded: { variant: 'outline', label: 'Reembolsado' },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      debit_card: 'Tarjeta de Débito',
      credit_card: 'Tarjeta de Crédito',
      transfer: 'Transferencia',
      health_insurance: 'Obra Social',
    };
    return labels[method] || method;
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
          <p className="text-gray-600 mt-1">
            Administra y registra los pagos de los pacientes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Pago
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Pago</DialogTitle>
              <DialogDescription>
                Completa la información del pago realizado
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Paciente */}
              <div className="space-y-2">
                <Label htmlFor="patient">Paciente *</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} - {patient.dni}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Turno */}
              <div className="space-y-2">
                <Label htmlFor="appointment">Turno *</Label>
                <Select
                  value={selectedAppointment}
                  onValueChange={setSelectedAppointment}
                  disabled={!selectedPatient}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar turno" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointments.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        {format(new Date(apt.date), "d MMM yyyy", { locale: es })} - {apt.startTime}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Método de Pago */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de Pago *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                    <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="health_insurance">Obra Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Monto - OCULTO si es obra social */}
              {paymentMethod !== 'health_insurance' && (
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              )}

              {/* Campos específicos para Obra Social */}
              {paymentMethod === 'health_insurance' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="healthInsuranceName">Nombre de Obra Social</Label>
                    <Input
                      id="healthInsuranceName"
                      placeholder="Ej: OSDE, Swiss Medical"
                      value={healthInsuranceName}
                      onChange={(e) => setHealthInsuranceName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="healthInsuranceNumber">Número de Afiliado</Label>
                    <Input
                      id="healthInsuranceNumber"
                      placeholder="Número de afiliado"
                      value={healthInsuranceNumber}
                      onChange={(e) => setHealthInsuranceNumber(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* ID de Transacción */}
              <div className="space-y-2">
                <Label htmlFor="transactionId">ID de Transacción (Opcional)</Label>
                <Input
                  id="transactionId"
                  placeholder="ID de transacción bancaria"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Observaciones adicionales..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Registrando...' : 'Registrar Pago'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Paciente, email, recibo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusFilter">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="failed">Fallido</SelectItem>
                  <SelectItem value="refunded">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="methodFilter">Método de Pago</Label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="debit_card">Débito</SelectItem>
                  <SelectItem value="credit_card">Crédito</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="health_insurance">Obra Social</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>
            Mostrando {filteredPayments.length} de {payments.length} pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Recibo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Procesado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No se encontraron pagos
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>
                      {format(new Date(payment.createdAt), 'd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payment.patient.firstName} {payment.patient.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{payment.patient.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        ${payment.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>{getMethodLabel(payment.paymentMethod)}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {payment.receiptNumber}
                      </code>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      {payment.processedBy ? (
                        <span className="text-sm">
                          {payment.processedBy.firstName} {payment.processedBy.lastName}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}