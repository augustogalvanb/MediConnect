import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

@Schema()
export class TimeSlot {
  @Prop({ required: true })
  startTime: string; // Formato: "09:00"

  @Prop({ required: true })
  endTime: string; // Formato: "13:00"
}

export const TimeSlotSchema = SchemaFactory.createForClass(TimeSlot);

@Schema({ timestamps: true })
export class Availability extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctor: Types.ObjectId;

  @Prop({ required: true, enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @Prop({ type: [TimeSlotSchema], required: true })
  timeSlots: TimeSlot[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 30 })
  slotDuration: number; // Duración de cada turno en minutos

  @Prop()
  effectiveFrom?: Date; // Desde cuándo es válida esta disponibilidad

  @Prop()
  effectiveUntil?: Date; // Hasta cuándo es válida esta disponibilidad
}

export const AvailabilitySchema = SchemaFactory.createForClass(Availability);

// Índices
AvailabilitySchema.index({ doctor: 1, dayOfWeek: 1 });
AvailabilitySchema.index({ doctor: 1, isActive: 1 });