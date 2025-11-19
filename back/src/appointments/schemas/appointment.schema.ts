import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AppointmentType {
  IN_PERSON = 'in_person',
  ONLINE = 'online',
}

@Schema({ timestamps: true })
export class Appointment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctor: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  startTime: string; // Formato: "09:00"

  @Prop({ required: true })
  endTime: string; // Formato: "09:30"

  @Prop({ required: true, enum: AppointmentStatus, default: AppointmentStatus.PENDING })
  status: AppointmentStatus;

  @Prop({ required: true, enum: AppointmentType, default: AppointmentType.IN_PERSON })
  type: AppointmentType;

  @Prop({ trim: true })
  reason?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ trim: true })
  cancelReason?: string;

  @Prop()
  cancelledAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;

  @Prop()
  confirmedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  confirmedBy?: Types.ObjectId;

  // Recordatorios enviados
  @Prop({ default: false })
  reminderSent?: boolean;

  @Prop()
  reminderSentAt?: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

// Índices para mejorar búsquedas
AppointmentSchema.index({ patient: 1, date: 1 });
AppointmentSchema.index({ doctor: 1, date: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ date: 1, startTime: 1 });

// Índice compuesto para evitar dobles reservas del mismo médico en el mismo horario
AppointmentSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });