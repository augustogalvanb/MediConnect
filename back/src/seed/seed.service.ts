import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserRole, Gender } from '../users/schemas/user.schema';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      this.logger.warn(
        'ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables',
      );
      return;
    }

    // Verificar si ya existe un admin
    const existingAdmin = await this.usersService.findByEmail(adminEmail);

    if (existingAdmin) {
      this.logger.log('Admin user already exists');
      return;
    }

    try {
      await this.usersService.create({
        firstName: 'Admin',
        lastName: 'MediConnect',
        email: adminEmail,
        password: adminPassword,
        role: UserRole.ADMIN,
        phone: '+5493815551234',
        dateOfBirth: '1990-01-01',
        gender: Gender.OTHER,
        dni: '12345678',
      });

      // Verificar el email automáticamente para el admin
      const admin = await this.usersService.findByEmail(adminEmail);
      if (admin) {
        const adminId = (admin._id as any).toString();
        await this.usersService.verifyEmail(adminId);
      }

      this.logger.log('✅ Admin user created successfully');
      this.logger.log(`Email: ${adminEmail}`);
      this.logger.log(`Password: ${adminPassword}`);
    } catch (error) {
      this.logger.error('Error creating admin user:', error);
    }
  }
}