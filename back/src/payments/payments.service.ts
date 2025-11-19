import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentStatus } from './schemas/payment.schema';
import { Appointment } from '../appointments/schemas/appointment.schema';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  RefundPaymentDto,
  PaymentQueryDto,
} from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
  ) {}

  async create(
    appointmentId: string,
    createPaymentDto: CreatePaymentDto,
    processedBy: string,
  ): Promise<Payment> {
    // Verificar que el turno existe
    const appointment = await this.appointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Obtener el patientId del appointment
    const patientId = (appointment.patient as any).toString();

    // Verificar si ya existe un pago para este turno
    const existingPayment = await this.paymentModel.findOne({
      appointment: appointmentId,
      status: { $ne: PaymentStatus.REFUNDED },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this appointment');
    }

    // Generar número de recibo
    const receiptNumber = this.generateReceiptNumber();

    const payment = new this.paymentModel({
      patient: patientId,
      appointment: appointmentId,
      amount: createPaymentDto.amount,
      paymentMethod: createPaymentDto.paymentMethod,
      healthInsuranceName: createPaymentDto.healthInsuranceName,
      healthInsuranceNumber: createPaymentDto.healthInsuranceNumber,
      transactionId: createPaymentDto.transactionId,
      receiptNumber,
      notes: createPaymentDto.notes,
      processedBy,
      status: PaymentStatus.COMPLETED,
      paidAt: new Date(),
    });

    return payment.save();
  }

  async findAll(query: PaymentQueryDto): Promise<Payment[]> {
    const filter: any = {};

    if (query.patientId) {
      filter.patient = query.patientId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.paymentMethod) {
      filter.paymentMethod = query.paymentMethod;
    }

    return this.paymentModel
      .find(filter)
      .populate('patient', 'firstName lastName email dni')
      .populate('appointment', 'date startTime type')
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentModel
      .findById(id)
      .populate('patient', 'firstName lastName email dni')
      .populate('appointment', 'date startTime type')
      .populate('processedBy', 'firstName lastName')
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByPatient(patientId: string): Promise<Payment[]> {
    return this.paymentModel
      .find({ patient: patientId })
      .populate('appointment', 'date startTime type')
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByAppointment(appointmentId: string): Promise<Payment | null> {
    return this.paymentModel
      .findOne({ appointment: appointmentId })
      .populate('patient', 'firstName lastName email')
      .populate('processedBy', 'firstName lastName')
      .exec();
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.paymentModel.findById(id);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Cannot update refunded payment');
    }

    Object.assign(payment, updatePaymentDto);
    return payment.save();
  }

  async refund(
    id: string,
    refundPaymentDto: RefundPaymentDto,
    userId: string,
  ): Promise<Payment> {
    const payment = await this.paymentModel.findById(id);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Payment is already refunded');
    }

    payment.status = PaymentStatus.REFUNDED;
    payment.refundReason = refundPaymentDto.refundReason;
    payment.refundedAt = new Date();

    return payment.save();
  }

  async delete(id: string): Promise<void> {
    const result = await this.paymentModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Payment not found');
    }
  }

  async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    const filter: any = { status: PaymentStatus.COMPLETED };

    if (startDate || endDate) {
      filter.paidAt = {};
      if (startDate) {
        filter.paidAt.$gte = startDate;
      }
      if (endDate) {
        filter.paidAt.$lte = endDate;
      }
    }

    const result = await this.paymentModel.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  async getPaymentsByMethod(): Promise<any> {
    return this.paymentModel.aggregate([
      { $match: { status: PaymentStatus.COMPLETED } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  private generateReceiptNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `REC-${year}${month}${day}-${random}`;
  }
}