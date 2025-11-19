import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsMongoId,
  Matches,
} from 'class-validator';
import { AppointmentStatus, AppointmentType } from '../schemas/appointment.schema';

export class CreateAppointmentDto {
  @IsMongoId()
  doctorId: string;

  @IsDateString()
  date: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format (24-hour)',
  })
  startTime: string;

  @IsEnum(AppointmentType)
  @IsOptional()
  type?: AppointmentType;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateAppointmentDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format (24-hour)',
  })
  @IsOptional()
  startTime?: string;

  @IsEnum(AppointmentType)
  @IsOptional()
  type?: AppointmentType;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CancelAppointmentDto {
  @IsString()
  cancelReason: string;
}

export class ConfirmAppointmentDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AppointmentQueryDto {
  @IsMongoId()
  @IsOptional()
  doctorId?: string;

  @IsMongoId()
  @IsOptional()
  patientId?: string;

  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;
}

export class AppointmentResponseDto {
  id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialty: string;
  };
  date: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: AppointmentType;
  reason?: string;
  notes?: string;
  cancelReason?: string;
  cancelledAt?: Date;
  confirmedAt?: Date;
  reminderSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}