'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Search, Calendar, User, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function DoctorRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [searchTerm, records]);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/medical-records');
      setRecords(response.data);
      setFilteredRecords(response.data);
    } catch (error) {
      toast.error('Error al cargar registros médicos');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    if (!searchTerm.trim()) {
      setFilteredRecords(records);
      return;
    }

    const filtered = records.filter((record) =>
      `${record.patient.firstName} ${record.patient.lastName} ${record.chiefComplaint}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    setFilteredRecords(filtered);
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registros Médicos</h1>
          <p className="text-gray-600 mt-1">
            Historiales clínicos creados
          </p>
        </div>
        <Link href="/dashboard/doctor/records/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Registro
          </Button>
        </Link>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por paciente o consulta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de Registros */}
      {filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron resultados' : 'No hay registros médicos'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando el primer registro'}
            </p>
            {!searchTerm && (
              <Link href="/dashboard/doctor/records/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Registro
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{record.chiefComplaint}</CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-2">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(record.consultationDate), "d 'de' MMMM, yyyy", { locale: es })}
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>
                            {record.patient.firstName} {record.patient.lastName}
                          </span>
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {record.isConfidential && (
                      <Badge variant="secondary">Confidencial</Badge>
                    )}
                    <Link href={`/dashboard/doctor/patients/${record.patient.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Detalle
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              {(record.diagnosis || record.vitalSigns) && (
                <CardContent className="space-y-3">
                  {record.diagnosis && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Diagnóstico</p>
                      <p className="text-gray-900 text-sm">{record.diagnosis}</p>
                    </div>
                  )}

                  {record.vitalSigns && Object.keys(record.vitalSigns).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                        <Activity className="h-4 w-4" />
                        <span>Signos Vitales</span>
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {record.vitalSigns.bloodPressure && (
                          <div className="bg-gray-50 p-2 rounded text-sm">
                            <p className="text-xs text-gray-600">Presión</p>
                            <p className="font-medium">{record.vitalSigns.bloodPressure}</p>
                          </div>
                        )}
                        {record.vitalSigns.heartRate && (
                          <div className="bg-gray-50 p-2 rounded text-sm">
                            <p className="text-xs text-gray-600">FC</p>
                            <p className="font-medium">{record.vitalSigns.heartRate} bpm</p>
                          </div>
                        )}
                        {record.vitalSigns.temperature && (
                          <div className="bg-gray-50 p-2 rounded text-sm">
                            <p className="text-xs text-gray-600">Temp</p>
                            <p className="font-medium">{record.vitalSigns.temperature}°C</p>
                          </div>
                        )}
                        {record.vitalSigns.weight && (
                          <div className="bg-gray-50 p-2 rounded text-sm">
                            <p className="text-xs text-gray-600">Peso</p>
                            <p className="font-medium">{record.vitalSigns.weight} kg</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}