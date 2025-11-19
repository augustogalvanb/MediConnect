'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, User, Pill, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/medical-records/my-records');
      setRecords(response.data);
    } catch (error) {
      toast.error('Error al cargar registros médicos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Historial Médico</h1>
        <p className="text-gray-600 mt-1">Registros médicos</p>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes registros médicos
            </h3>
            <p className="text-gray-600">
              Los registros de tus consultas aparecerán aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {record.chiefComplaint}
                      </CardTitle>
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
                            Dr/a. {record.doctor.firstName} {record.doctor.lastName}
                          </span>
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  {record.isConfidential && (
                    <Badge variant="secondary">Confidencial</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {record.diagnosis && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Diagnóstico</p>
                    <p className="text-gray-900">{record.diagnosis}</p>
                  </div>
                )}

                {record.treatment && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Tratamiento</p>
                    <p className="text-gray-900">{record.treatment}</p>
                  </div>
                )}

                {record.medications && (
                  <div className="flex items-start space-x-2">
                    <Pill className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Medicamentos</p>
                      <p className="text-gray-900">{record.medications}</p>
                    </div>
                  </div>
                )}

                {record.vitalSigns && Object.keys(record.vitalSigns).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                      <Activity className="h-4 w-4" />
                      <span>Signos Vitales</span>
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {record.vitalSigns.bloodPressure && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600">Presión</p>
                          <p className="font-medium">{record.vitalSigns.bloodPressure}</p>
                        </div>
                      )}
                      {record.vitalSigns.heartRate && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600">Frecuencia Cardíaca</p>
                          <p className="font-medium">{record.vitalSigns.heartRate} bpm</p>
                        </div>
                      )}
                      {record.vitalSigns.temperature && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600">Temperatura</p>
                          <p className="font-medium">{record.vitalSigns.temperature}°C</p>
                        </div>
                      )}
                      {record.vitalSigns.weight && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600">Peso</p>
                          <p className="font-medium">{record.vitalSigns.weight} kg</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {record.attachments && record.attachments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Archivos Adjuntos ({record.attachments.length})
                    </p>
                    <div className="space-y-2">
                      {record.attachments.map((attachment: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="font-medium text-sm">{attachment.fileName}</p>
                              <p className="text-xs text-gray-600 capitalize">
                                {attachment.fileType.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {record.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Notas Adicionales</p>
                    <p className="text-gray-900 text-sm">{record.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}