'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  Calendar, 
  FileText,
  Clock,
  Filter,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Activity } from 'lucide-react'; // Agregar a los imports

export default function AdminPatientsPage() {
  const [patients, setPatientsData] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, filterStatus, patients]);

  const fetchPatients = async () => {
    try {
      const [patientsRes, appointmentsRes] = await Promise.all([
        api.get('/users?role=patient'),
        api.get('/appointments'),
      ]);

      // Crear un mapa de turnos por paciente
      const appointmentsByPatient = new Map();
      
      appointmentsRes.data.forEach((apt: any) => {
        const patientId = apt.patient.id;
        if (!appointmentsByPatient.has(patientId)) {
          appointmentsByPatient.set(patientId, {
            total: 0,
            upcoming: 0,
            completed: 0,
            lastAppointment: null,
          });
        }
        
        const stats = appointmentsByPatient.get(patientId);
        stats.total++;
        
        if (apt.status === 'completed') {
          stats.completed++;
        }
        
        const aptDate = new Date(apt.date);
        const now = new Date();
        
        if (aptDate > now && (apt.status === 'pending' || apt.status === 'confirmed')) {
          stats.upcoming++;
        }
        
        if (!stats.lastAppointment || aptDate > new Date(stats.lastAppointment)) {
          stats.lastAppointment = apt.date;
        }
      });

      // Agregar estadísticas a cada paciente
      const patientsWithStats = patientsRes.data.map((patient: any) => ({
        ...patient,
        stats: appointmentsByPatient.get(patient.id) || {
          total: 0,
          upcoming: 0,
          completed: 0,
          lastAppointment: null,
        },
      }));

      setPatientsData(patientsWithStats);
      setFilteredPatients(patientsWithStats);
    } catch (error) {
      toast.error('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];

    // Filtro de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter((patient) =>
        `${patient.firstName} ${patient.lastName} ${patient.email} ${patient.dni || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter((patient) => {
        switch (filterStatus) {
          case 'with-upcoming':
            return patient.stats.upcoming > 0;
          case 'without-appointments':
            return patient.stats.total === 0;
          case 'active':
            return patient.stats.total > 0;
          default:
            return true;
        }
      });
    }

    setFilteredPatients(filtered);
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

  const exportToCSV = () => {
    const headers = ['Nombre', 'Email', 'Teléfono', 'DNI', 'Edad', 'Total Turnos', 'Próximos', 'Completados', 'Última Consulta'];
    const rows = filteredPatients.map(p => [
      `${p.firstName} ${p.lastName}`,
      p.email,
      p.phone,
      p.dni || 'N/A',
      calculateAge(p.dateOfBirth),
      p.stats.total,
      p.stats.upcoming,
      p.stats.completed,
      p.stats.lastAppointment ? format(new Date(p.stats.lastAppointment), 'dd/MM/yyyy') : 'N/A'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pacientes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Archivo exportado correctamente');
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-600 mt-1">
            Gestión completa de pacientes registrados
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-gray-600 mt-1">Registrados en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Turnos Próximos</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patients.filter(p => p.stats.upcoming > 0).length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Pacientes con citas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Turnos</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patients.filter(p => p.stats.total === 0).length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Nunca consultaron</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, email o DNI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los pacientes</SelectItem>
                  <SelectItem value="with-upcoming">Con turnos próximos</SelectItem>
                  <SelectItem value="without-appointments">Sin turnos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pacientes */}
      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron pacientes
            </h3>
            <p className="text-gray-600">
              Intenta con otros términos de búsqueda o filtros
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                        {getInitials(patient.firstName, patient.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        {patient.stats.upcoming > 0 && (
                          <Badge variant="default">
                            {patient.stats.upcoming} próximo{patient.stats.upcoming !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {patient.stats.total === 0 && (
                          <Badge variant="secondary">Sin turnos</Badge>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{patient.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span>{calculateAge(patient.dateOfBirth)} años</span>
                        </div>
                        {patient.dni && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span>DNI: {patient.dni}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{patient.stats.total}</p>
                          <p className="text-xs text-gray-600">Total turnos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{patient.stats.completed}</p>
                          <p className="text-xs text-gray-600">Completados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Última visita</p>
                          <p className="font-medium text-sm">
                            {patient.stats.lastAppointment 
                              ? format(new Date(patient.stats.lastAppointment), 'd MMM yyyy', { locale: es })
                              : 'Nunca'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/dashboard/admin/patients/${patient.id}`}>
                        Ver Detalle
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`mailto:${patient.email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar Email
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginación info */}
      {filteredPatients.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 text-center">
              Mostrando {filteredPatients.length} de {patients.length} pacientes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}