'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Activity,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  // Data states
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [appointmentsByMonth, setAppointmentsByMonth] = useState<any[]>([]);
  const [appointmentsByDoctor, setAppointmentsByDoctor] = useState<any[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [paymentsByMethod, setPaymentsByMethod] = useState<any[]>([]);
  const [frequentPatients, setFrequentPatients] = useState<any[]>([]);

  useEffect(() => {
    fetchAllStats();
  }, [selectedYear]);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      const [
        dashboardRes,
        appointmentsByMonthRes,
        appointmentsByDoctorRes,
        revenueRes,
        paymentsMethodRes,
        frequentPatientsRes,
      ] = await Promise.all([
        api.get('/statistics/dashboard'),
        api.get(`/statistics/appointments/by-month/${selectedYear}`),
        api.get('/statistics/appointments/by-doctor'),
        api.get(`/statistics/revenue/by-month/${selectedYear}`),
        api.get('/payments/stats/by-method'),
        api.get('/statistics/patients/frequent?limit=10'),
      ]);

      setDashboardStats(dashboardRes.data);
      
      // Formatear datos de turnos por mes
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const appointmentsData = monthNames.map((name, index) => {
        const monthData = appointmentsByMonthRes.data.find((m: any) => m.month === index + 1);
        return {
          month: name,
          total: monthData?.total || 0,
          completed: monthData?.completed || 0,
          cancelled: monthData?.cancelled || 0,
        };
      });
      setAppointmentsByMonth(appointmentsData);

      // Formatear datos de turnos por doctor (top 10)
      setAppointmentsByDoctor(appointmentsByDoctorRes.data.slice(0, 10));

      // Formatear ingresos por mes
      const revenueData = monthNames.map((name, index) => {
        const monthData = revenueRes.data.find((m: any) => m.month === index + 1);
        return {
          month: name,
          total: monthData?.total || 0,
          count: monthData?.count || 0,
        };
      });
      setRevenueByMonth(revenueData);

      // Formatear pagos por método
      const methodLabels: any = {
        cash: 'Efectivo',
        debit_card: 'Débito',
        credit_card: 'Crédito',
        transfer: 'Transferencia',
        health_insurance: 'Obra Social',
      };
      const paymentsData = paymentsMethodRes.data.map((p: any) => ({
        name: methodLabels[p._id] || p._id,
        value: p.count,
        amount: p.total,
      }));
      setPaymentsByMethod(paymentsData);

      // Pacientes frecuentes
      setFrequentPatients(frequentPatientsRes.data);

    } catch (error) {
      toast.error('Error al cargar estadísticas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    toast.success('Función de exportación en desarrollo');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estadísticas y Reportes</h1>
          <p className="text-gray-600 mt-1">
            Análisis completo del rendimiento de la clínica
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              ${dashboardStats?.revenue?.total?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">Recaudado</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Líneas - Turnos por Mes */}
      <Card>
        <CardHeader>
          <CardTitle>Turnos por Mes - {selectedYear}</CardTitle>
          <CardDescription>
            Evolución mensual de citas médicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={appointmentsByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Total"
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Completados"
              />
              <Line 
                type="monotone" 
                dataKey="cancelled" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Cancelados"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Turnos por Doctor */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Médicos por Turnos</CardTitle>
            <CardDescription>
              Profesionales con más consultas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={appointmentsByDoctor} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="doctorName" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalAppointments" fill="#3B82F6" name="Total Turnos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Torta - Métodos de Pago */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
            <CardDescription>
              Distribución de formas de pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={paymentsByMethod}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentsByMethod.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Área - Ingresos por Mes */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos Mensuales - {selectedYear}</CardTitle>
          <CardDescription>
            Evolución de los ingresos en el año
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={revenueByMonth}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#colorRevenue)"
                name="Ingresos ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla de Pacientes Frecuentes */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Pacientes Frecuentes</CardTitle>
          <CardDescription>
            Pacientes con mayor cantidad de consultas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {frequentPatients.map((patient, index) => (
              <div key={patient.patientId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{patient.patientName}</p>
                    <p className="text-sm text-gray-600">{patient.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{patient.appointmentCount}</p>
                    <p className="text-xs text-gray-600">Consultas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Última visita</p>
                    <p className="text-sm font-medium">
                      {format(new Date(patient.lastAppointment), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}