import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  RECEPTIONIST = 'receptionist',
  ADMIN = 'admin',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.PATIENT })
  role: UserRole;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop({ required: true, enum: Gender })
  gender: Gender;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  province?: string;

  @Prop({ trim: true })
  postalCode?: string;

  @Prop({ trim: true })
  dni?: string;

  // Campos específicos para médicos
  @Prop({ trim: true })
  specialty?: string;

  @Prop({ trim: true })
  licenseNumber?: string;

  // Control de cuenta
  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  emailVerificationExpires?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop()
  lastLogin?: Date;

  // Avatar/foto de perfil
  @Prop()
  avatar?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índices para mejorar búsquedas
UserSchema.index({ role: 1 });
UserSchema.index({ dni: 1 });