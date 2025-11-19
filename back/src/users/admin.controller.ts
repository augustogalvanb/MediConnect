import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create-doctor')
  async createDoctor(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create({
      ...createUserDto,
      role: UserRole.DOCTOR,
    });
  }

  @Post('create-receptionist')
  async createReceptionist(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create({
      ...createUserDto,
      role: UserRole.RECEPTIONIST,
    });
  }

  @Post('create-admin')
  async createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create({
      ...createUserDto,
      role: UserRole.ADMIN,
    });
  }

  @Get('stats')
  async getStats() {
    const [patients, doctors, receptionists, admins] = await Promise.all([
      this.usersService.findAll(UserRole.PATIENT),
      this.usersService.findAll(UserRole.DOCTOR),
      this.usersService.findAll(UserRole.RECEPTIONIST),
      this.usersService.findAll(UserRole.ADMIN),
    ]);

    return {
      totalUsers: patients.length + doctors.length + receptionists.length + admins.length,
      patients: patients.length,
      doctors: doctors.length,
      receptionists: receptionists.length,
      admins: admins.length,
    };
  }
}