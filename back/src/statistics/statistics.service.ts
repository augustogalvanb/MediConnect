import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from '../users/schemas/user.schema';
import { Appointment, AppointmentStatus } from '../appointments/schemas/appointment.schema';
import { Payment, PaymentStatus } from '../payments/schemas/payment.schema';
import { MedicalRecord } from '../medical-records/schemas/medical-record.schema';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(MedicalRecord.name) private medicalRecordModel: Model<MedicalRecord>,
  ) {}

  async getDashboardStats(startDate?: Date, endDate?: Date): Promise<any> {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = startDate;
      if (endDate) dateFilter.createdAt.$lte = endDate;
    }

    // Usuarios totales
    const totalUsers = await this.userModel.countDocuments();
    const totalPatients = await this.userModel.countDocuments({ role: UserRole.PATIENT });
    const totalDoctors = await this.userModel.countDocuments({ role: UserRole.DOCTOR });

    // Turnos
    const totalAppointments = await this.appointmentModel.countDocuments(dateFilter);
    const pendingAppointments = await this.appointmentModel.countDocuments({
      ...dateFilter,
      status: AppointmentStatus.PENDING,
    });
    const confirmedAppointments = await this.appointmentModel.countDocuments({
      ...dateFilter,
      status: AppointmentStatus.CONFIRMED,
    });
    const completedAppointments = await this.appointmentModel.countDocuments({
      ...dateFilter,
      status: AppointmentStatus.COMPLETED,
    });
    const cancelledAppointments = await this.appointmentModel.countDocuments({
      ...dateFilter,
      status: AppointmentStatus.CANCELLED,
    });

    // Turnos de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await this.appointmentModel.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    });

    // Ingresos
    const paymentFilter: any = { status: PaymentStatus.COMPLETED };
    if (startDate || endDate) {
      paymentFilter.paidAt = {};
      if (startDate) paymentFilter.paidAt.$gte = startDate;
      if (endDate) paymentFilter.paidAt.$lte = endDate;
    }

    const revenueResult = await this.paymentModel.aggregate([
      { $match: paymentFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Registros médicos
    const totalMedicalRecords = await this.medicalRecordModel.countDocuments(dateFilter);

    return {
      users: {
        total: totalUsers,
        patients: totalPatients,
        doctors: totalDoctors,
      },
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        today: todayAppointments,
      },
      revenue: {
        total: totalRevenue,
      },
      medicalRecords: {
        total: totalMedicalRecords,
      },
    };
  }

  async getAppointmentsByDoctor(
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = startDate;
      if (endDate) dateFilter.date.$lte = endDate;
    }

    return this.appointmentModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$doctor',
          totalAppointments: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', AppointmentStatus.COMPLETED] }, 1, 0],
            },
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ['$status', AppointmentStatus.CANCELLED] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor',
        },
      },
      { $unwind: '$doctor' },
      {
        $project: {
          doctorId: '$_id',
          doctorName: {
            $concat: ['$doctor.firstName', ' ', '$doctor.lastName'],
          },
          specialty: '$doctor.specialty',
          totalAppointments: 1,
          completed: 1,
          cancelled: 1,
        },
      },
      { $sort: { totalAppointments: -1 } },
    ]);
  }

  async getAppointmentsByMonth(year: number): Promise<any[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    return this.appointmentModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', AppointmentStatus.COMPLETED] }, 1, 0],
            },
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ['$status', AppointmentStatus.CANCELLED] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          month: '$_id',
          total: 1,
          completed: 1,
          cancelled: 1,
          _id: 0,
        },
      },
    ]);
  }

  async getFrequentPatients(limit: number = 10): Promise<any[]> {
    return this.appointmentModel.aggregate([
      {
        $group: {
          _id: '$patient',
          appointmentCount: { $sum: 1 },
          lastAppointment: { $max: '$date' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'patient',
        },
      },
      { $unwind: '$patient' },
      {
        $project: {
          patientId: '$_id',
          patientName: {
            $concat: ['$patient.firstName', ' ', '$patient.lastName'],
          },
          email: '$patient.email',
          phone: '$patient.phone',
          appointmentCount: 1,
          lastAppointment: 1,
        },
      },
      { $sort: { appointmentCount: -1 } },
      { $limit: limit },
    ]);
  }

  async getRevenueByMonth(year: number): Promise<any[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    return this.paymentModel.aggregate([
      {
        $match: {
          paidAt: { $gte: startDate, $lt: endDate },
          status: PaymentStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: { $month: '$paidAt' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          month: '$_id',
          total: 1,
          count: 1,
          average: { $divide: ['$total', '$count'] },
          _id: 0,
        },
      },
    ]);
  }

  async getDoctorStats(doctorId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Turnos totales
    const totalAppointments = await this.appointmentModel.countDocuments({
      doctor: doctorId,
    });

    // Turnos completados
    const completedAppointments = await this.appointmentModel.countDocuments({
      doctor: doctorId,
      status: AppointmentStatus.COMPLETED,
    });

    // Turnos de hoy
    const todayAppointments = await this.appointmentModel.countDocuments({
      doctor: doctorId,
      date: { $gte: today },
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    });

    // Próximos turnos (7 días)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingAppointments = await this.appointmentModel.countDocuments({
      doctor: doctorId,
      date: { $gte: today, $lt: nextWeek },
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    });

    // Pacientes únicos
    const uniquePatientsResult = await this.appointmentModel.aggregate([
      { $match: { doctor: doctorId } },
      { $group: { _id: '$patient' } },
      { $count: 'total' },
    ]);
    const uniquePatients =
      uniquePatientsResult.length > 0 ? uniquePatientsResult[0].total : 0;

    // Registros médicos creados
    const totalMedicalRecords = await this.medicalRecordModel.countDocuments({
      doctor: doctorId,
    });

    return {
      appointments: {
        total: totalAppointments,
        completed: completedAppointments,
        today: todayAppointments,
        upcoming: upcomingAppointments,
      },
      patients: {
        unique: uniquePatients,
      },
      medicalRecords: {
        total: totalMedicalRecords,
      },
    };
  }

  async getPatientStats(patientId: string): Promise<any> {
    // Turnos totales
    const totalAppointments = await this.appointmentModel.countDocuments({
      patient: patientId,
    });

    // Turnos completados
    const completedAppointments = await this.appointmentModel.countDocuments({
      patient: patientId,
      status: AppointmentStatus.COMPLETED,
    });

    // Próximos turnos
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingAppointments = await this.appointmentModel.countDocuments({
      patient: patientId,
      date: { $gte: today },
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    });

    // Registros médicos
    const totalMedicalRecords = await this.medicalRecordModel.countDocuments({
      patient: patientId,
    });

    // Pagos totales
    const paymentsResult = await this.paymentModel.aggregate([
      { $match: { patient: patientId, status: PaymentStatus.COMPLETED } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const totalSpent =
      paymentsResult.length > 0 ? paymentsResult[0].total : 0;
    const totalPayments =
      paymentsResult.length > 0 ? paymentsResult[0].count : 0;

    return {
      appointments: {
        total: totalAppointments,
        completed: completedAppointments,
        upcoming: upcomingAppointments,
      },
      medicalRecords: {
        total: totalMedicalRecords,
      },
      payments: {
        total: totalSpent,
        count: totalPayments,
      },
    };
  }
}