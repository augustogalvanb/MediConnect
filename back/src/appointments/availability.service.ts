import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability, DayOfWeek } from './schemas/availability.schema';
import { Appointment, AppointmentStatus } from './schemas/appointment.schema';
import {
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
} from './dto/availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(Availability.name) private availabilityModel: Model<Availability>,
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
  ) {}

  async create(
    doctorId: string,
    createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<Availability> {
    const { dayOfWeek, timeSlots, slotDuration } = createAvailabilityDto;

    // Validar que los time slots no se solapen
    this.validateTimeSlots(timeSlots);

    // Verificar si ya existe disponibilidad para ese día
    const existing = await this.availabilityModel.findOne({
      doctor: doctorId,
      dayOfWeek,
      isActive: true,
    });

    if (existing) {
      throw new BadRequestException(
        `Availability already exists for ${dayOfWeek}. Please update or delete the existing one.`,
      );
    }

    const availability = new this.availabilityModel({
      doctor: doctorId,
      dayOfWeek,
      timeSlots,
      slotDuration: slotDuration || 30,
      effectiveFrom: createAvailabilityDto.effectiveFrom,
      effectiveUntil: createAvailabilityDto.effectiveUntil,
    });

    return availability.save();
  }

  async findByDoctor(doctorId: string): Promise<Availability[]> {
    return this.availabilityModel
      .find({ doctor: doctorId, isActive: true })
      .sort({ dayOfWeek: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Availability> {
    const availability = await this.availabilityModel.findById(id);
    if (!availability) {
      throw new NotFoundException('Availability not found');
    }
    return availability;
  }

  async update(
    id: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<Availability> {
    const availability = await this.findOne(id);

    if (updateAvailabilityDto.timeSlots) {
      this.validateTimeSlots(updateAvailabilityDto.timeSlots);
    }

    Object.assign(availability, updateAvailabilityDto);
    return availability.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.availabilityModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Availability not found');
    }
  }

async getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
    // Parsear la fecha como fecha local (sin conversión de zona horaria)
    const [year, month, day] = date.split('-').map(Number);
    const requestedDate = new Date(year, month - 1, day);
    
    // Obtener el día de la semana (0 = domingo, 1 = lunes, etc.)
    const dayIndex = requestedDate.getDay();
    
    // Mapear el índice al enum DayOfWeek
    const dayMapping = {
      0: DayOfWeek.SUNDAY,
      1: DayOfWeek.MONDAY,
      2: DayOfWeek.TUESDAY,
      3: DayOfWeek.WEDNESDAY,
      4: DayOfWeek.THURSDAY,
      5: DayOfWeek.FRIDAY,
      6: DayOfWeek.SATURDAY,
    };
    
    const dayOfWeek = dayMapping[dayIndex];

    // CRÍTICO: Verificar si el doctor tiene disponibilidad para este día
    const availability = await this.availabilityModel.findOne({
      doctor: doctorId,
      dayOfWeek: dayOfWeek,
      isActive: true,
    });

    // SI NO HAY DISPONIBILIDAD CONFIGURADA, RETORNAR ARRAY VACÍO
    if (!availability) {
      return [];
    }

    // Obtener turnos ya reservados para este doctor en esta fecha
    const existingAppointments = await this.appointmentModel.find({
      doctor: doctorId,
      date: requestedDate,
      status: { $in: ['pending', 'confirmed'] },
    });

    const bookedSlots = existingAppointments.map((apt) => apt.startTime);

    // Generar slots disponibles SOLO de los timeSlots configurados
    const availableSlots: string[] = [];

    for (const timeSlot of availability.timeSlots) {
      const slots = this.generateTimeSlots(
        timeSlot.startTime,
        timeSlot.endTime,
        availability.slotDuration,
      );

      // Filtrar los slots que ya están reservados
      const freeSlots = slots.filter((slot) => !bookedSlots.includes(slot));
      availableSlots.push(...freeSlots);
    }

    return availableSlots.sort();
  }

  private generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number,
  ): string[] {
    const slots: string[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    while (currentMinutes + duration <= endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      slots.push(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      );
      currentMinutes += duration;
    }

    return slots;
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[date.getDay()];
  }

  private validateTimeSlots(timeSlots: any[]): void {
    for (let i = 0; i < timeSlots.length; i++) {
      const slot = timeSlots[i];
      
      // Validar formato de hora
      if (!this.isValidTime(slot.startTime) || !this.isValidTime(slot.endTime)) {
        throw new BadRequestException('Invalid time format');
      }

      // Validar que startTime sea menor que endTime
      if (slot.startTime >= slot.endTime) {
        throw new BadRequestException('startTime must be before endTime');
      }

      // Verificar solapamientos con otros slots
      for (let j = i + 1; j < timeSlots.length; j++) {
        const otherSlot = timeSlots[j];
        if (this.timeSlotsOverlap(slot, otherSlot)) {
          throw new BadRequestException(
            `Time slots overlap: ${slot.startTime}-${slot.endTime} and ${otherSlot.startTime}-${otherSlot.endTime}`,
          );
        }
      }
    }
  }

  private isValidTime(time: string): boolean {
    const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }

  private timeSlotsOverlap(slot1: any, slot2: any): boolean {
    return (
      (slot1.startTime < slot2.endTime && slot1.endTime > slot2.startTime) ||
      (slot2.startTime < slot1.endTime && slot2.endTime > slot1.startTime)
    );
  }
}