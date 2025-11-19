'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Search, Phone, Mail, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function DoctorPatientsPage() {
  const [patients, setPatientsData] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      // Obtener todos los turnos del médico
      const appointmentsRes = await api.get('/appointments');
      
      // Extraer pacientes únicos
      const uniquePatients = new Map();
      appointmentsRes.data.forEach((apt: any) => {
        if (!uniquePatients.has(apt.patient.id)) {
          uniquePatients.set(apt.patient.id, {
            ...apt.patient,
            lastAppointment: apt.date,
            totalAppointments: 1,
          });
        } else {
          const patient = uniquePatients.get(apt.patient.id);
          patient.totalAppointments++;
          // Actualizar última cita si es más reciente
          if (new Date(apt.date) > new Date(patient.lastAppointment)) {
            patient.lastAppointment = apt.date;
          }
        }
      });

      const patientsArray = Array.from(uniquePatients.values());
      setPatientsData(patientsArray);
      setFilteredPatients(patientsArray);
    } catch (error) {
      toast.error('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter((patient) =>
      `${patient.firstName} ${patient.lastName} ${patient.email}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Pacientes</h1>
        <p className="text-gray-600 mt-1">
          Lista de pacientes que has atendido
        </p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Estadística */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle>Total de Pacientes</CardTitle>
          </div>
          <CardDescription>
            Has atendido a {patients.length} pacientes únicos
          </CardDescription>
        </CardHeader>
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
              Intenta con otros términos de búsqueda
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                      {getInitials(patient.firstName, patient.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg truncate">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{patient.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>
                          Última visita: {format(new Date(patient.lastAppointment), "d 'de' MMMM", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {patient.totalAppointments} consulta{patient.totalAppointments !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <Link href={`/dashboard/doctor/patients/${patient.id}`}>
                      <Button variant="outline" size="sm" className="w-full mt-4">
                        Ver Historial Completo
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}