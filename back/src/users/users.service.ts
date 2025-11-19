import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Verificar si el email ya existe
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Crear el usuario
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.PATIENT,
    });

    await user.save();

    return this.sanitizeUser(user);
  }

  async findAll(role?: UserRole): Promise<UserResponseDto[]> {
    const filter = role ? { role } : {};
    const users = await this.userModel.find(filter).exec();
    return users.map((user) => this.sanitizeUser(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userModel
      .findByIdAndUpdate(userId, { password: hashedPassword })
      .exec();
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      })
      .exec();
  }

  async setEmailVerificationToken(userId: string, token: string): Promise<void> {
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Token válido por 24 horas

    await this.userModel
      .findByIdAndUpdate(userId, {
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      })
      .exec();
  }

  async setPasswordResetToken(userId: string, token: string): Promise<void> {
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token válido por 1 hora

    await this.userModel
      .findByIdAndUpdate(userId, {
        passwordResetToken: token,
        passwordResetExpires: expires,
      })
      .exec();
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
      })
      .exec();
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.userModel
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      })
      .exec();
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.userModel
      .findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      })
      .exec();
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { lastLogin: new Date() })
      .exec();
  }

  async getDoctors(): Promise<UserResponseDto[]> {
    const doctors = await this.userModel
      .find({ role: UserRole.DOCTOR, isActive: true })
      .exec();
    return doctors.map((doctor) => this.sanitizeUser(doctor));
  }

  async getDoctorsBySpecialty(specialty: string): Promise<UserResponseDto[]> {
    const doctors = await this.userModel
      .find({
        role: UserRole.DOCTOR,
        specialty,
        isActive: true,
      })
      .exec();
    return doctors.map((doctor) => this.sanitizeUser(doctor));
  }

  // Método para eliminar datos sensibles antes de enviar al cliente
  private sanitizeUser(user: User): UserResponseDto {
    const userObject = user.toObject();
    const {
      password,
      emailVerificationToken,
      emailVerificationExpires,
      passwordResetToken,
      passwordResetExpires,
      ...sanitized
    } = userObject;

    return {
      id: sanitized._id.toString(),
      firstName: sanitized.firstName,
      lastName: sanitized.lastName,
      email: sanitized.email,
      role: sanitized.role,
      phone: sanitized.phone,
      dateOfBirth: sanitized.dateOfBirth,
      gender: sanitized.gender,
      address: sanitized.address,
      city: sanitized.city,
      province: sanitized.province,
      postalCode: sanitized.postalCode,
      dni: sanitized.dni,
      specialty: sanitized.specialty,
      licenseNumber: sanitized.licenseNumber,
      isEmailVerified: sanitized.isEmailVerified,
      isActive: sanitized.isActive,
      avatar: sanitized.avatar,
      createdAt: sanitized.createdAt,
      updatedAt: sanitized.updatedAt,
    };
  }
}