import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @UseGuards(RolesGuard)
  getDashboardStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.statisticsService.getDashboardStats(start, end);
  }

  @Get('appointments/by-doctor')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @UseGuards(RolesGuard)
  getAppointmentsByDoctor(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.statisticsService.getAppointmentsByDoctor(start, end);
  }

  @Get('appointments/by-month/:year')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @UseGuards(RolesGuard)
  getAppointmentsByMonth(@Param('year') year: string) {
    return this.statisticsService.getAppointmentsByMonth(parseInt(year));
  }

  @Get('patients/frequent')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @UseGuards(RolesGuard)
  getFrequentPatients(@Query('limit') limit?: string) {
    return this.statisticsService.getFrequentPatients(
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('revenue/by-month/:year')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  getRevenueByMonth(@Param('year') year: string) {
    return this.statisticsService.getRevenueByMonth(parseInt(year));
  }

  @Get('doctor/:doctorId')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  getDoctorStats(@Param('doctorId') doctorId: string, @GetUser() user: any) {
    // Si es doctor, solo puede ver sus propias estadísticas
    if (user.role === UserRole.DOCTOR && user.userId !== doctorId) {
      doctorId = user.userId;
    }
    return this.statisticsService.getDoctorStats(doctorId);
  }

  @Get('doctor/me')
  @Roles(UserRole.DOCTOR)
  @UseGuards(RolesGuard)
  getMyStats(@GetUser() user: any) {
    return this.statisticsService.getDoctorStats(user.userId);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  getPatientStats(@Param('patientId') patientId: string, @GetUser() user: any) {
    // Si es paciente, solo puede ver sus propias estadísticas
    if (user.role === UserRole.PATIENT && user.userId !== patientId) {
      patientId = user.userId;
    }
    return this.statisticsService.getPatientStats(patientId);
  }

  @Get('patient/me')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  getMyPatientStats(@GetUser() user: any) {
    return this.statisticsService.getPatientStats(user.userId);
  }
}