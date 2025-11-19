import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentStatus } from './schemas/appointment.schema';
import { AvailabilityService } from './availability.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  CancelAppointmentDto,
  AppointmentQueryDto,
  AppointmentResponseDto,
} from './dto/appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    private availabilityService: AvailabilityService, // INYECTAR AvailabilityService
  ) {}

  async create(
    patientId: string,
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const { doctorId, date, startTime, type, reason } = createAppointmentDto;

    // Calcular endTime (asumiendo 30 minutos por defecto)
    const endTime = this.calculateEndTime(startTime, 30);

    // Parsear la fecha como fecha local (sin conversión de zona horaria)
    const [year, month, day] = date.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day);
    
    // Verificar que la fecha no sea en el pasado
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      throw new BadRequestException('Cannot create appointment in the past');
    }

    // ====== VALIDACIÓN CRÍTICA: Verificar disponibilidad del médico ======
    const availableSlots = await this.availabilityService.getAvailableSlots(
      doctorId,
      date,
    );

    // Si no hay slots disponibles, el doctor no atiende ese día
    if (availableSlots.length === 0) {
      throw new BadRequestException(
        'El doctor no tiene disponibilidad configurada para este día. Por favor, selecciona otra fecha.',
      );
    }

    // Si el horario seleccionado no está en los slots disponibles
    if (!availableSlots.includes(startTime)) {
      throw new BadRequestException(
        'El horario seleccionado no está disponible. Por favor, elige otro horario de los disponibles.',
      );
    }
    // ====== FIN DE VALIDACIÓN ======

    // Verificar que el médico no tenga otro turno a la misma hora (doble verificación)
    const existingAppointment = await this.appointmentModel.findOne({
      doctor: doctorId,
      date: appointmentDate,
      startTime,
      status: { $nin: [AppointmentStatus.CANCELLED] },
    });

    if (existingAppointment) {
      throw new BadRequestException(
        'Doctor is not available at this time. Please choose another slot.',
      );
    }

    // Verificar que el paciente no tenga otro turno a la misma hora
    const patientConflict = await this.appointmentModel.findOne({
      patient: patientId,
      date: appointmentDate,
      startTime,
      status: { $nin: [AppointmentStatus.CANCELLED] },
    });

    if (patientConflict) {
      throw new BadRequestException(
        'You already have an appointment at this time.',
      );
    }

    const appointment = new this.appointmentModel({
      patient: patientId,
      doctor: doctorId,
      date: appointmentDate,
      startTime,
      endTime,
      type: type || 'in_person',
      reason,
      status: AppointmentStatus.PENDING,
    });

    await appointment.save();
    return this.toResponseDto(await appointment.populate(['patient', 'doctor']));
  }

  async findAll(query: AppointmentQueryDto): Promise<AppointmentResponseDto[]> {
    const filter: any = {};

    if (query.doctorId) {
      filter.doctor = query.doctorId;
    }

    if (query.patientId) {
      filter.patient = query.patientId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.dateFrom || query.dateTo) {
      filter.date = {};
      if (query.dateFrom) {
        // Parsear como fecha local
        const [year, month, day] = query.dateFrom.split('-').map(Number);
        const dateFrom = new Date(year, month - 1, day);
        filter.date.$gte = dateFrom;
      }
      if (query.dateTo) {
        // Parsear como fecha local
        const [year, month, day] = query.dateTo.split('-').map(Number);
        const dateTo = new Date(year, month - 1, day);
        dateTo.setHours(23, 59, 59, 999); // Fin del día
        filter.date.$lte = dateTo;
      }
    }

    const appointments = await this.appointmentModel
      .find(filter)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName specialty')
      .sort({ date: 1, startTime: 1 })
      .exec();

    return appointments.map((apt) => this.toResponseDto(apt));
  }

  async findOne(id: string): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentModel
      .findById(id)
      .populate('patient', 'firstName lastName email phone dateOfBirth')
      .populate('doctor', 'firstName lastName specialty licenseNumber')
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return this.toResponseDto(appointment);
  }

  async update(
    id: string,
    userId: string,
    userRole: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Solo el paciente o admin/recepcionista pueden modificar
    if (
      userRole === 'patient' &&
      appointment.patient.toString() !== userId
    ) {
      throw new ForbiddenException('You can only modify your own appointments');
    }

    // No se puede modificar un turno cancelado o completado
    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        `Cannot modify ${appointment.status} appointment`,
      );
    }

    // Si se cambia fecha/hora, verificar disponibilidad
    if (updateAppointmentDto.date || updateAppointmentDto.startTime) {
      const newDate = updateAppointmentDto.date
        ? new Date(updateAppointmentDto.date)
        : appointment.date;
      const newStartTime =
        updateAppointmentDto.startTime || appointment.startTime;

      // Validar con availability service
      const availableSlots = await this.availabilityService.getAvailableSlots(
        appointment.doctor.toString(),
        newDate.toISOString().split('T')[0],
      );

      if (availableSlots.length === 0) {
        throw new BadRequestException(
          'El doctor no tiene disponibilidad configurada para este día.',
        );
      }

      if (!availableSlots.includes(newStartTime)) {
        throw new BadRequestException(
          'El horario seleccionado no está disponible.',
        );
      }

      const conflict = await this.appointmentModel.findOne({
        _id: { $ne: id },
        doctor: appointment.doctor,
        date: newDate,
        startTime: newStartTime,
        status: { $nin: [AppointmentStatus.CANCELLED] },
      });

      if (conflict) {
        throw new BadRequestException('Doctor is not available at this time');
      }
    }

    Object.assign(appointment, updateAppointmentDto);

    if (updateAppointmentDto.startTime) {
      appointment.endTime = this.calculateEndTime(
        updateAppointmentDto.startTime,
        30,
      );
    }

    await appointment.save();
    return this.toResponseDto(await appointment.populate(['patient', 'doctor']));
  }

  async cancel(
    id: string,
    userId: string,
    userRole: string,
    cancelAppointmentDto: CancelAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verificar permisos
    if (
      userRole === 'patient' &&
      appointment.patient.toString() !== userId
    ) {
      throw new ForbiddenException('You can only cancel your own appointments');
    }

    // Ya está cancelado
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    // Verificar restricción de 24 horas para pacientes
    if (userRole === 'patient') {
      const now = new Date();
      const appointmentDateTime = new Date(appointment.date);
      const [hours, minutes] = appointment.startTime.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const hoursDifference =
        (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDifference < 24) {
        throw new BadRequestException(
          'Appointments can only be cancelled at least 24 hours in advance',
        );
      }
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancelReason = cancelAppointmentDto.cancelReason;
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = userId as any;

    await appointment.save();
    return this.toResponseDto(await appointment.populate(['patient', 'doctor']));
  }

  async confirm(
    id: string,
    userId: string,
    notes?: string,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException(
        'Only pending appointments can be confirmed',
      );
    }

    appointment.status = AppointmentStatus.CONFIRMED;
    appointment.confirmedAt = new Date();
    appointment.confirmedBy = userId as any;
    if (notes) {
      appointment.notes = notes;
    }

    await appointment.save();
    return this.toResponseDto(await appointment.populate(['patient', 'doctor']));
  }

  async complete(id: string, notes?: string): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled appointment');
    }

    appointment.status = AppointmentStatus.COMPLETED;
    if (notes) {
      appointment.notes = notes;
    }

    await appointment.save();
    return this.toResponseDto(await appointment.populate(['patient', 'doctor']));
  }

  async getUpcoming(patientId: string): Promise<AppointmentResponseDto[]> {
    const now = new Date();
    
    const appointments = await this.appointmentModel
      .find({
        patient: patientId,
        date: { $gte: now },
        status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      })
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName specialty')
      .sort({ date: 1, startTime: 1 })
      .exec();

    return appointments.map((apt) => this.toResponseDto(apt));
  }

  async getPastAppointments(patientId: string): Promise<AppointmentResponseDto[]> {
    const appointments = await this.appointmentModel
      .find({
        patient: patientId,
        status: { $in: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED] },
      })
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName specialty')
      .sort({ date: -1, startTime: -1 })
      .exec();

    return appointments.map((apt) => this.toResponseDto(apt));
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }

  private toResponseDto(appointment: any): AppointmentResponseDto {
    return {
      id: appointment._id.toString(),
      patient: {
        id: appointment.patient._id.toString(),
        firstName: appointment.patient.firstName,
        lastName: appointment.patient.lastName,
        email: appointment.patient.email,
        phone: appointment.patient.phone
      },
      doctor: {
        id: appointment.doctor._id.toString(),
        firstName: appointment.doctor.firstName,
        lastName: appointment.doctor.lastName,
        specialty: appointment.doctor.specialty,
      },
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      type: appointment.type,
      reason: appointment.reason,
      notes: appointment.notes,
      cancelReason: appointment.cancelReason,
      cancelledAt: appointment.cancelledAt,
      confirmedAt: appointment.confirmedAt,
      reminderSent: appointment.reminderSent,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }
}