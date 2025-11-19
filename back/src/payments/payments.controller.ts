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
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  RefundPaymentDto,
  PaymentQueryDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @GetUser() user: any,
  ) {
    // El patientId se obtiene del appointment
    return this.paymentsService.create(
      createPaymentDto.appointmentId,
      createPaymentDto,
      user.userId,
    );
  }

  @Get()
  findAll(@Query() query: PaymentQueryDto, @GetUser() user: any) {
    // Si es paciente, solo ve sus propios pagos
    if (user.role === UserRole.PATIENT) {
      query.patientId = user.userId;
    }
    return this.paymentsService.findAll(query);
  }

  @Get('my-payments')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  getMyPayments(@GetUser() user: any) {
    return this.paymentsService.findByPatient(user.userId);
  }

  @Get('appointment/:appointmentId')
  getByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.paymentsService.findByAppointment(appointmentId);
  }

  @Get('revenue')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getTotalRevenue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const total = await this.paymentsService.getTotalRevenue(start, end);
    return { total };
  }

  @Get('stats/by-method')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  getPaymentsByMethod() {
    return this.paymentsService.getPaymentsByMethod();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Post(':id/refund')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  refund(
    @Param('id') id: string,
    @Body() refundPaymentDto: RefundPaymentDto,
    @GetUser() user: any,
  ) {
    return this.paymentsService.refund(id, refundPaymentDto, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.paymentsService.delete(id);
  }
}