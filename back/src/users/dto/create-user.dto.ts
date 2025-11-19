import {
  IsEmail,
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  MinLength,
  Matches,
  IsPhoneNumber,
} from 'class-validator';
import { UserRole, Gender } from '../schemas/user.schema';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsPhoneNumber('AR')
  phone: string;

  @IsDateString()
  dateOfBirth: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  dni?: string;

  // Campos específicos para médicos
  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsOptional()
  licenseNumber?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsPhoneNumber('AR')
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  // Para médicos
  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsOptional()
  licenseNumber?: string;
}

export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone: string;
  dateOfBirth: Date;
  gender: Gender;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  dni?: string;
  specialty?: string;
  licenseNumber?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}