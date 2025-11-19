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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, User, Phone, Mail, Calendar, FileText, Plus, Activity, Download, Eye, Pill, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function DoctorPatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [params.id]);

  const fetchPatientData = async () => {
    try {
      const [patientRes, appointmentsRes, recordsRes] = await Promise.all([
        api.get(`/users/${params.id}`),
        api.get('/appointments', { params: { patientId: params.id } }),
        api.get(`/medical-records/patient/${params.id}`),
      ]);

      setPatient(patientRes.data);
      setAppointments(appointmentsRes.data);
      setMedicalRecords(recordsRes.data);
    } catch (error) {
      toast.error('Error al cargar información del paciente');
      router.push('/dashboard/doctor/patients');
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

  const openRecordModal = (record: any) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const closeRecordModal = () => {
    setSelectedRecord(null);
    setModalOpen(false);
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setImageModalOpen(false);
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/doctor/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Historial del Paciente</h1>
          <p className="text-gray-600 mt-1">
            Información completa y registros médicos
          </p>
        </div>
        <Link href={`/dashboard/doctor/records/new?patientId=${params.id}`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Registro
          </Button>
        </Link>
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
              <h2 className="text-2xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h2>
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{patient.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{calculateAge(patient.dateOfBirth)} años</span>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{appointments.length}</p>
                      <p className="text-sm text-gray-600 mt-1">Consultas</p>
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
                      <p className="text-sm text-gray-600 mt-1">Completadas</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="records" className="space-y-6">
        <TabsList>
          <TabsTrigger value="records">
            Registros Médicos ({medicalRecords.length})
          </TabsTrigger>
          <TabsTrigger value="appointments">
            Historial de Turnos ({appointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          {medicalRecords.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sin registros médicos
                </h3>
                <p className="text-gray-600 mb-4">
                  Comienza creando el primer registro médico
                </p>
                <Link href={`/dashboard/doctor/records/new?patientId=${params.id}`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Registro
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            medicalRecords.map((record) => (
              <Card key={record.id} className="hover:shadow-md transition">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{record.chiefComplaint}</CardTitle>
                      <CardDescription>
                        {format(new Date(record.consultationDate), "d 'de' MMMM, yyyy", { locale: es })}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openRecordModal(record)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Completo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {record.diagnosis && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Diagnóstico</p>
                      <p className="text-gray-900 line-clamp-2">{record.diagnosis}</p>
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
              </Card>
            ))
          )}
        </TabsContent>

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
              <Card key={appointment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {format(new Date(appointment.date), "d 'de' MMMM, yyyy", { locale: es })} - {appointment.startTime}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {appointment.reason || 'Consulta general'}
                      </p>
                    </div>
                    <Link href={`/dashboard/doctor/appointments/${appointment.id}`}>
                      <Button variant="outline" size="sm">Ver Detalle</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Registro Médico Completo */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registro Médico Completo</DialogTitle>
            <DialogDescription>
              {selectedRecord && format(new Date(selectedRecord.consultationDate), "d 'de' MMMM, yyyy", { locale: es })}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              {/* Motivo de Consulta */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Motivo de Consulta</h3>
                <p className="text-gray-700">{selectedRecord.chiefComplaint}</p>
              </div>

              {/* Historia de la Enfermedad */}
              {selectedRecord.historyOfPresentIllness && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Historia de la Enfermedad Actual</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.historyOfPresentIllness}</p>
                </div>
              )}

              {/* Examen Físico */}
              {selectedRecord.physicalExamination && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Examen Físico</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.physicalExamination}</p>
                </div>
              )}

              {/* Signos Vitales */}
              {selectedRecord.vitalSigns && Object.keys(selectedRecord.vitalSigns).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Signos Vitales</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedRecord.vitalSigns.bloodPressure && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Presión Arterial</p>
                        <p className="text-2xl font-bold text-blue-900">{selectedRecord.vitalSigns.bloodPressure}</p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.heartRate && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-600 font-medium">Frecuencia Cardíaca</p>
                        <p className="text-2xl font-bold text-red-900">{selectedRecord.vitalSigns.heartRate} bpm</p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.temperature && (
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">Temperatura</p>
                        <p className="text-2xl font-bold text-orange-900">{selectedRecord.vitalSigns.temperature}°C</p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.weight && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Peso</p>
                        <p className="text-2xl font-bold text-green-900">{selectedRecord.vitalSigns.weight} kg</p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.height && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Altura</p>
                        <p className="text-2xl font-bold text-purple-900">{selectedRecord.vitalSigns.height} cm</p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.oxygenSaturation && (
                      <div className="bg-cyan-50 p-4 rounded-lg">
                        <p className="text-sm text-cyan-600 font-medium">Saturación O₂</p>
                        <p className="text-2xl font-bold text-cyan-900">{selectedRecord.vitalSigns.oxygenSaturation}%</p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.respiratoryRate && (
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <p className="text-sm text-indigo-600 font-medium">Frecuencia Respiratoria</p>
                        <p className="text-2xl font-bold text-indigo-900">{selectedRecord.vitalSigns.respiratoryRate} rpm</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Diagnóstico */}
              {selectedRecord.diagnosis && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">Diagnóstico</h3>
                  <p className="text-yellow-800 whitespace-pre-wrap">{selectedRecord.diagnosis}</p>
                </div>
              )}

              {/* Tratamiento */}
              {selectedRecord.treatment && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Plan de Tratamiento</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.treatment}</p>
                </div>
              )}

              {/* Medicamentos */}
              {selectedRecord.medications && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center space-x-2">
                    <Pill className="h-5 w-5" />
                    <span>Medicamentos Prescritos</span>
                  </h3>
                  <p className="text-green-800 whitespace-pre-wrap">{selectedRecord.medications}</p>
                </div>
              )}

              {/* Notas Adicionales */}
              {selectedRecord.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Notas Adicionales</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.notes}</p>
                </div>
              )}

              {/* Archivos Adjuntos */}
              {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Archivos Adjuntos ({selectedRecord.attachments.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedRecord.attachments.map((attachment: any, index: number) => (
                      <div
                        key={index}
                        className="border rounded-lg overflow-hidden hover:shadow-lg transition"
                      >
                        {attachment.fileType === 'image' ? (
                          <div 
                            className="cursor-pointer"
                            onClick={() => openImageModal(attachment.fileUrl)}
                          >
                            <img
                              src={attachment.fileUrl}
                              alt={attachment.fileName}
                              className="w-full h-40 object-cover"
                            />
                            <div className="p-3 bg-white">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {attachment.fileName}
                              </p>
                              <p className="text-xs text-gray-500 capitalize mt-1">
                                {attachment.fileType.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-900 truncate text-center">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-gray-500 capitalize text-center mt-1">
                              {attachment.fileType.replace('_', ' ')}
                            </p>
                            <a
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block mt-3"
                            >
                              <Button variant="outline" size="sm" className="w-full">
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                              </Button>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fecha de Seguimiento */}
              {selectedRecord.followUpDate && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">Fecha de Seguimiento</h3>
                  <p className="text-blue-800">
                    {format(new Date(selectedRecord.followUpDate), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Visualización de Imagen */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Visualización de Imagen</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage}
                alt="Archivo médico"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              <a
                href={selectedImage}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2"
              >
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}