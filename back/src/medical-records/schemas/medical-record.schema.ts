import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum FileType {
  IMAGE = 'image',
  PDF = 'pdf',
  LAB_RESULT = 'lab_result',
  PRESCRIPTION = 'prescription',
  RADIOLOGY = 'radiology',
  OTHER = 'other',
}

@Schema()
export class Attachment {
  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true, enum: FileType })
  fileType: FileType;

  @Prop()
  publicId?: string; // Cloudinary public_id para eliminar después

  @Prop({ default: Date.now })
  uploadedAt: Date;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);

@Schema()
export class VitalSigns {
  @Prop()
  bloodPressure?: string; // e.g., "120/80"

  @Prop()
  heartRate?: number; // bpm

  @Prop()
  temperature?: number; // °C

  @Prop()
  weight?: number; // kg

  @Prop()
  height?: number; // cm

  @Prop()
  oxygenSaturation?: number; // %

  @Prop()
  respiratoryRate?: number; // respirations per minute
}

export const VitalSignsSchema = SchemaFactory.createForClass(VitalSigns);

@Schema({ timestamps: true })
export class MedicalRecord extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctor: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  appointment?: Types.ObjectId;

  @Prop({ required: true })
  consultationDate: Date;

  @Prop({ required: true })
  chiefComplaint: string; // Motivo de consulta

  @Prop()
  historyOfPresentIllness?: string; // Historia de la enfermedad actual

  @Prop()
  physicalExamination?: string; // Examen físico

  @Prop({ type: VitalSignsSchema })
  vitalSigns?: VitalSigns;

  @Prop()
  diagnosis?: string; // Diagnóstico

  @Prop()
  treatment?: string; // Tratamiento/Plan

  @Prop()
  medications?: string; // Medicamentos prescritos

  @Prop()
  notes?: string; // Notas adicionales

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments: Attachment[];

  @Prop()
  followUpDate?: Date; // Fecha de seguimiento

  @Prop({ default: false })
  isConfidential: boolean;
}

export const MedicalRecordSchema = SchemaFactory.createForClass(MedicalRecord);

// Índices
MedicalRecordSchema.index({ patient: 1, consultationDate: -1 });
MedicalRecordSchema.index({ doctor: 1, consultationDate: -1 });
MedicalRecordSchema.index({ appointment: 1 });