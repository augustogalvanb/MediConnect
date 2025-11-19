'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, User, Activity, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateMedicalRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    patientId: patientIdFromUrl || '',
    consultationDate: new Date().toISOString().split('T')[0],
    chiefComplaint: '',
    historyOfPresentIllness: '',
    physicalExamination: '',
    diagnosis: '',
    treatment: '',
    medications: '',
    notes: '',
    isConfidential: false,
    // Signos vitales
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    oxygenSaturation: '',
    respiratoryRate: '',
  });

  useEffect(() => {
    if (!patientIdFromUrl) {
      fetchPatients();
    }
  }, []);

  const fetchPatients = async () => {
    try {
      const appointmentsRes = await api.get('/appointments');
      const uniquePatients = new Map();
      appointmentsRes.data.forEach((apt: any) => {
        if (!uniquePatients.has(apt.patient.id)) {
          uniquePatients.set(apt.patient.id, apt.patient);
        }
      });
      setPatients(Array.from(uniquePatients.values()));
    } catch (error) {
      toast.error('Error al cargar pacientes');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId) {
      toast.error('Selecciona un paciente');
      return;
    }

    if (!formData.chiefComplaint) {
      toast.error('El motivo de consulta es obligatorio');
      return;
    }

    setLoading(true);

    try {
      // Crear signos vitales solo si hay algún valor
      const vitalSigns: any = {};
      if (formData.bloodPressure) vitalSigns.bloodPressure = formData.bloodPressure;
      if (formData.heartRate) vitalSigns.heartRate = parseFloat(formData.heartRate);
      if (formData.temperature) vitalSigns.temperature = parseFloat(formData.temperature);
      if (formData.weight) vitalSigns.weight = parseFloat(formData.weight);
      if (formData.height) vitalSigns.height = parseFloat(formData.height);
      if (formData.oxygenSaturation) vitalSigns.oxygenSaturation = parseFloat(formData.oxygenSaturation);
      if (formData.respiratoryRate) vitalSigns.respiratoryRate = parseFloat(formData.respiratoryRate);

      const recordData = {
        patientId: formData.patientId,
        consultationDate: formData.consultationDate,
        chiefComplaint: formData.chiefComplaint,
        historyOfPresentIllness: formData.historyOfPresentIllness,
        physicalExamination: formData.physicalExamination,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        medications: formData.medications,
        notes: formData.notes,
        isConfidential: formData.isConfidential,
        vitalSigns: Object.keys(vitalSigns).length > 0 ? vitalSigns : undefined,
      };

      const response = await api.post('/medical-records', recordData);
      const recordId = response.data.id;

      // Subir archivos si hay
      if (selectedFiles.length > 0) {
        const uploadFormData = new FormData();
        selectedFiles.forEach(file => {
          uploadFormData.append('files', file);
        });
        uploadFormData.append('fileType', 'other');

        await api.post(`/medical-records/${recordId}/upload-multiple`, uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      toast.success('Registro médico creado exitosamente');
      router.push(`/dashboard/doctor/patients/${formData.patientId}`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al crear registro médico';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/doctor/patients/${formData.patientId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Registro Médico</h1>
          <p className="text-gray-600 mt-1">
            Crear historial clínico del paciente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Información Básica</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Paciente *</Label>
                {patientIdFromUrl ? (
                  <Input value="Paciente seleccionado" disabled />
                ) : (
                  <Select value={formData.patientId} onValueChange={(value) => handleChange('patientId', value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="consultationDate">Fecha de Consulta *</Label>
                <Input
                  id="consultationDate"
                  type="date"
                  value={formData.consultationDate}
                  onChange={(e) => handleChange('consultationDate', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chiefComplaint">Motivo de Consulta *</Label>
              <Input
                id="chiefComplaint"
                placeholder="Ej: Dolor de cabeza intenso"
                value={formData.chiefComplaint}
                onChange={(e) => handleChange('chiefComplaint', e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Signos Vitales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Signos Vitales</span>
            </CardTitle>
            <CardDescription>Información opcional pero recomendada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodPressure">Presión Arterial</Label>
                <Input
                  id="bloodPressure"
                  placeholder="120/80"
                  value={formData.bloodPressure}
                  onChange={(e) => handleChange('bloodPressure', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heartRate">Frecuencia Cardíaca (bpm)</Label>
                <Input
                  id="heartRate"
                  type="number"
                  placeholder="75"
                  value={formData.heartRate}
                  onChange={(e) => handleChange('heartRate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperatura (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  placeholder="36.5"
                  value={formData.temperature}
                  onChange={(e) => handleChange('temperature', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="70"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="170"
                  value={formData.height}
                  onChange={(e) => handleChange('height', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oxygenSaturation">Saturación O₂ (%)</Label>
                <Input
                  id="oxygenSaturation"
                  type="number"
                  placeholder="98"
                  value={formData.oxygenSaturation}
                  onChange={(e) => handleChange('oxygenSaturation', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="respiratoryRate">Frecuencia Respiratoria</Label>
                <Input
                  id="respiratoryRate"
                  type="number"
                  placeholder="16"
                  value={formData.respiratoryRate}
                  onChange={(e) => handleChange('respiratoryRate', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historial y Examen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Evaluación Clínica</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="historyOfPresentIllness">Historia de la Enfermedad Actual</Label>
              <Textarea
                id="historyOfPresentIllness"
                placeholder="Describe el desarrollo de los síntomas..."
                value={formData.historyOfPresentIllness}
                onChange={(e) => handleChange('historyOfPresentIllness', e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="physicalExamination">Examen Físico</Label>
              <Textarea
                id="physicalExamination"
                placeholder="Hallazgos del examen físico..."
                value={formData.physicalExamination}
                onChange={(e) => handleChange('physicalExamination', e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Diagnóstico y Tratamiento */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico y Plan de Tratamiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnóstico</Label>
              <Textarea
                id="diagnosis"
                placeholder="Diagnóstico clínico..."
                value={formData.diagnosis}
                onChange={(e) => handleChange('diagnosis', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment">Plan de Tratamiento</Label>
              <Textarea
                id="treatment"
                placeholder="Indicaciones, procedimientos, recomendaciones..."
                value={formData.treatment}
                onChange={(e) => handleChange('treatment', e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">Medicamentos Prescritos</Label>
              <Textarea
                id="medications"
                placeholder="Lista de medicamentos con dosis y duración..."
                value={formData.medications}
                onChange={(e) => handleChange('medications', e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                placeholder="Observaciones, seguimiento, etc..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Archivos Adjuntos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Archivos Adjuntos</span>
            </CardTitle>
            <CardDescription>
              Estudios, radiografías, análisis, etc. (Máx. 10MB por archivo)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Archivos seleccionados:</Label>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-600">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <Link href={`/dashboard/doctor/patients/${formData.patientId}`}>
            <Button type="button" variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Registro Médico'}
          </Button>
        </div>
      </form>
    </div>
  );
}