import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  AuthResponseDto,
} from './dto/auth.dto';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    // Crear el usuario (siempre como paciente al registrarse)
    const user = await this.usersService.create({
      ...registerDto,
      role: UserRole.PATIENT,
    });

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.usersService.setEmailVerificationToken(
      user.id,
      verificationToken,
    );

    // Enviar email de verificación
    await this.emailService.sendVerificationEmail(
      user.email,
      user.firstName,
      verificationToken,
    );

    return {
      message:
        'Registration successful! Please check your email to verify your account.',
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Actualizar último login
    const userId = (user._id as any).toString();
    await this.usersService.updateLastLogin(userId);

    // Generar JWT
    const payload = {
      sub: userId,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmailVerificationToken(
      verifyEmailDto.token,
    );
    
    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    const userId = (user._id as any).toString();
    await this.usersService.verifyEmail(userId);
    
    // Enviar email de bienvenida
    await this.emailService.sendWelcomeEmail(user.email, user.firstName);

    return { message: 'Email verified successfully!' };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return {
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    // Generar token de reseteo
    const resetToken = crypto.randomBytes(32).toString('hex');
    const userId = (user._id as any).toString();
    await this.usersService.setPasswordResetToken(userId, resetToken);

    // Enviar email de reseteo
    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetToken,
    );

    return {
      message: 'If the email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByPasswordResetToken(
      resetPasswordDto.token,
    );

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const userId = (user._id as any).toString();
    
    // Actualizar la contraseña
    await this.usersService.updatePassword(userId, resetPasswordDto.newPassword);

    // Limpiar el token de reseteo (enviar string vacío en lugar de null)
    await this.usersService.setPasswordResetToken(userId, '');

    return { message: 'Password reset successfully!' };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }
}