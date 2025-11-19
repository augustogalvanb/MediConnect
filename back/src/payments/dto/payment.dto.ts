import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsMongoId,
  Min,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../schemas/payment.schema';

export class CreatePaymentDto {
  @IsMongoId()
  appointmentId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  healthInsuranceName?: string;

  @IsString()
  @IsOptional()
  healthInsuranceNumber?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePaymentDto {
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class RefundPaymentDto {
  @IsString()
  refundReason: string;
}

export class PaymentQueryDto {
  @IsMongoId()
  @IsOptional()
  patientId?: string;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;
}