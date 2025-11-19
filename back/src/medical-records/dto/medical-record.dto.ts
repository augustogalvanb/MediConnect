import {
  IsString,
  IsOptional,
  IsDateString,
  IsMongoId,
  IsBoolean,
  IsNumber,
  IsEnum,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FileType } from '../schemas/medical-record.schema';

export class VitalSignsDto {
  @IsString()
  @IsOptional()
  bloodPressure?: string;

  @IsNumber()
  @Min(0)
  @Max(300)
  @IsOptional()
  heartRate?: number;

  @IsNumber()
  @Min(35)
  @Max(45)
  @IsOptional()
  temperature?: number;

  @IsNumber()
  @Min(0)
  @Max(500)
  @IsOptional()
  weight?: number;

  @IsNumber()
  @Min(0)
  @Max(300)
  @IsOptional()
  height?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  oxygenSaturation?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  respiratoryRate?: number;
}

export class CreateMedicalRecordDto {
  @IsMongoId()
  patientId: string;

  @IsMongoId()
  @IsOptional()
  appointmentId?: string;

  @IsDateString()
  consultationDate: string;

  @IsString()
  chiefComplaint: string;

  @IsString()
  @IsOptional()
  historyOfPresentIllness?: string;

  @IsString()
  @IsOptional()
  physicalExamination?: string;

  @ValidateNested()
  @Type(() => VitalSignsDto)
  @IsOptional()
  vitalSigns?: VitalSignsDto;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsString()
  @IsOptional()
  treatment?: string;

  @IsString()
  @IsOptional()
  medications?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @IsBoolean()
  @IsOptional()
  isConfidential?: boolean;
}

export class UpdateMedicalRecordDto {
  @IsString()
  @IsOptional()
  chiefComplaint?: string;

  @IsString()
  @IsOptional()
  historyOfPresentIllness?: string;

  @IsString()
  @IsOptional()
  physicalExamination?: string;

  @ValidateNested()
  @Type(() => VitalSignsDto)
  @IsOptional()
  vitalSigns?: VitalSignsDto;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsString()
  @IsOptional()
  treatment?: string;

  @IsString()
  @IsOptional()
  medications?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @IsBoolean()
  @IsOptional()
  isConfidential?: boolean;
}

export class UploadFileDto {
  @IsEnum(FileType)
  fileType: FileType;

  @IsString()
  @IsOptional()
  description?: string;
}

export class MedicalRecordQueryDto {
  @IsMongoId()
  @IsOptional()
  patientId?: string;

  @IsMongoId()
  @IsOptional()
  doctorId?: string;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;
}

export class MedicalRecordResponseDto {
  id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: Date;
    dni?: string;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialty: string;
  };
  appointment?: {
    id: string;
    date: Date;
    startTime: string;
  };
  consultationDate: Date;
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  vitalSigns?: any;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  notes?: string;
  attachments: any[];
  followUpDate?: Date;
  isConfidential: boolean;
  createdAt: Date;
  updatedAt: Date;
}