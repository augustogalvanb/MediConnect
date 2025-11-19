import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AvailabilityService } from './availability.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  CancelAppointmentDto,
  ConfirmAppointmentDto,
  AppointmentQueryDto,
} from './dto/appointment.dto';
import {
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  AvailableSlotsQueryDto,
} from './dto/availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  // ========== APPOINTMENTS ==========

  @Post()
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  create(
    @GetUser() user: any,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(user.userId, createAppointmentDto);
  }

  @Get()
  findAll(@Query() query: AppointmentQueryDto, @GetUser() user: any) {
    // Si es paciente, solo ve sus propios turnos
    if (user.role === UserRole.PATIENT) {
      query.patientId = user.userId;
    }
    // Si es médico, solo ve sus turnos asignados
    if (user.role === UserRole.DOCTOR) {
      query.doctorId = user.userId;
    }
    return this.appointmentsService.findAll(query);
  }

  @Get('upcoming')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  getUpcoming(@GetUser() user: any) {
    return this.appointmentsService.getUpcoming(user.userId);
  }

  @Get('past')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  getPast(@GetUser() user: any) {
    return this.appointmentsService.getPastAppointments(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(
      id,
      user.userId,
      user.role,
      updateAppointmentDto,
    );
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body() cancelAppointmentDto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(
      id,
      user.userId,
      user.role,
      cancelAppointmentDto,
    );
  }

  @Post(':id/confirm')
  @Roles(UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  confirm(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body() confirmAppointmentDto: ConfirmAppointmentDto,
  ) {
    return this.appointmentsService.confirm(
      id,
      user.userId,
      confirmAppointmentDto.notes,
    );
  }

  @Post(':id/complete')
  @Roles(UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  complete(@Param('id') id: string, @Body('notes') notes?: string) {
    return this.appointmentsService.complete(id, notes);
  }

  // ========== AVAILABILITY ==========

  @Post('availability')
  @Roles(UserRole.DOCTOR)
  @UseGuards(RolesGuard)
  createAvailability(
    @GetUser() user: any,
    @Body() createAvailabilityDto: CreateAvailabilityDto,
  ) {
    return this.availabilityService.create(user.userId, createAvailabilityDto);
  }

  @Get('availability/doctor/:doctorId')
  getAvailabilityByDoctor(@Param('doctorId') doctorId: string) {
    return this.availabilityService.findByDoctor(doctorId);
  }

  @Get('availability/my-schedule')
  @Roles(UserRole.DOCTOR)
  @UseGuards(RolesGuard)
  getMyAvailability(@GetUser() user: any) {
    return this.availabilityService.findByDoctor(user.userId);
  }

  @Get('availability/slots/available')
  getAvailableSlots(@Query() query: AvailableSlotsQueryDto) {
    return this.availabilityService.getAvailableSlots(
      query.doctorId,
      query.date,
    );
  }

  @Patch('availability/:id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  updateAvailability(
    @Param('id') id: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(id, updateAvailabilityDto);
  }

  @Delete('availability/:id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  removeAvailability(@Param('id') id: string) {
    return this.availabilityService.remove(id);
  }
}