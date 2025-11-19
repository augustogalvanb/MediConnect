import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserRole, Gender } from '../../src/users/schemas/user.schema';
import { Availability, DayOfWeek } from '../../src/appointments/schemas/availability.schema';
import { Appointment, AppointmentStatus, AppointmentType } from '../../src/appointments/schemas/appointment.schema';
import { Payment, PaymentMethod, PaymentStatus } from '../../src/payments/schemas/payment.schema';
import { MedicalRecord } from '../../src/medical-records/schemas/medical-record.schema';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  console.log('🚀 Iniciando seed de datos...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  // Obtener modelos
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const availabilityModel = app.get<Model<Availability>>(getModelToken(Availability.name));
  const appointmentModel = app.get<Model<Appointment>>(getModelToken(Appointment.name));
  const paymentModel = app.get<Model<Payment>>(getModelToken(Payment.name));
  const medicalRecordModel = app.get<Model<MedicalRecord>>(getModelToken(MedicalRecord.name));

  try {
    // ==================== PASO 1: Obtener doctores y pacientes ====================
    console.log('📋 Obteniendo usuarios existentes...');
    const doctors = await userModel.find({ role: UserRole.DOCTOR }).exec();
    const existingPatients = await userModel.find({ role: UserRole.PATIENT }).exec();

    if (doctors.length === 0) {
      console.error('❌ No hay doctores en la base de datos. Crea doctores primero.');
      await app.close();
      return;
    }

    console.log(`✅ Encontrados ${doctors.length} doctores`);
    console.log(`✅ Encontrados ${existingPatients.length} pacientes existentes`);

    // ==================== PASO 2: Crear pacientes adicionales ====================
    console.log('\n👥 Creando 5 pacientes adicionales...');
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const newPatientsData = [
      {
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos.rodriguez@example.com',
        phone: '+54 381 456-7890',
        dateOfBirth: new Date('1985-03-15'),
        gender: Gender.MALE,
        dni: '25123456',
      },
      {
        firstName: 'Laura',
        lastName: 'Fernández',
        email: 'laura.fernandez@example.com',
        phone: '+54 381 456-7891',
        dateOfBirth: new Date('1992-07-22'),
        gender: Gender.FEMALE,
        dni: '30456789',
      },
      {
        firstName: 'Miguel',
        lastName: 'Sánchez',
        email: 'miguel.sanchez@example.com',
        phone: '+54 381 456-7892',
        dateOfBirth: new Date('1978-11-08'),
        gender: Gender.MALE,
        dni: '22789012',
      },
      {
        firstName: 'Valentina',
        lastName: 'Martínez',
        email: 'valentina.martinez@example.com',
        phone: '+54 381 456-7893',
        dateOfBirth: new Date('1995-05-30'),
        gender: Gender.FEMALE,
        dni: '35234567',
      },
      {
        firstName: 'Roberto',
        lastName: 'López',
        email: 'roberto.lopez@example.com',
        phone: '+54 381 456-7894',
        dateOfBirth: new Date('1988-09-12'),
        gender: Gender.MALE,
        dni: '28567890',
      },
    ];

    const newPatients: any[] = [];
    for (const patientData of newPatientsData) {
      // Verificar si ya existe
      const exists = await userModel.findOne({ email: patientData.email }).exec();
      if (!exists) {
        const patient = await userModel.create({
          ...patientData,
          password: hashedPassword,
          role: UserRole.PATIENT,
          isActive: true,
          isEmailVerified: true,
        });
        newPatients.push(patient);
      }
    }

    const allPatients: any[] = [...existingPatients, ...newPatients];
    console.log(`✅ Total de pacientes: ${allPatients.length}`);

    // ==================== PASO 3: Crear disponibilidad para doctores ====================
    console.log('\n📅 Configurando horarios de disponibilidad para doctores...');

    const scheduleTemplates = [
      { days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY], slots: [{ startTime: '08:00', endTime: '13:00' }] },
      { days: [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY], slots: [{ startTime: '14:00', endTime: '19:00' }] },
      { days: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY], slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '15:00', endTime: '18:00' }] },
      { days: [DayOfWeek.THURSDAY, DayOfWeek.FRIDAY], slots: [{ startTime: '08:30', endTime: '13:30' }] },
    ];

    let availabilityCount = 0;
    for (let i = 0; i < doctors.length; i++) {
      const doctor = doctors[i];
      const template = scheduleTemplates[i % scheduleTemplates.length];

      for (const day of template.days) {
        // Verificar si ya existe
        const exists = await availabilityModel.findOne({
          doctor: doctor._id,
          dayOfWeek: day,
          isActive: true,
        }).exec();

        if (!exists) {
          await availabilityModel.create({
            doctor: doctor._id,
            dayOfWeek: day,
            timeSlots: template.slots,
            slotDuration: 30,
            isActive: true,
          });
          availabilityCount++;
        }
      }
    }

    console.log(`✅ Creados ${availabilityCount} horarios de disponibilidad`);

    // ==================== PASO 4: Crear turnos ====================
    console.log('\n📆 Creando turnos...');

    const appointmentStatuses = [
      AppointmentStatus.COMPLETED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.PENDING,
      AppointmentStatus.CANCELLED,
    ];

    const reasons = [
      'Consulta general',
      'Control de rutina',
      'Dolor de cabeza persistente',
      'Consulta de seguimiento',
      'Revisión de estudios',
      'Dolor abdominal',
      'Control post-operatorio',
      'Certificado médico',
    ];

    const createdAppointments: any[] = [];

    // Crear turnos distribuidos en los últimos 6 meses
    for (let month = 0; month < 6; month++) {
      const turnosEnEsteMes = Math.floor(Math.random() * 3) + 5; // 5-7 turnos por mes

      for (let i = 0; i < turnosEnEsteMes; i++) {
        const doctor = doctors[Math.floor(Math.random() * doctors.length)];
        const patient = allPatients[Math.floor(Math.random() * allPatients.length)];
        const status = appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)];

        // Fecha aleatoria en el mes
        const date = new Date();
        date.setMonth(date.getMonth() - month);
        date.setDate(Math.floor(Math.random() * 28) + 1);
        date.setHours(0, 0, 0, 0);

        // Horario aleatorio
        const hours = Math.floor(Math.random() * 8) + 8; // 8-16 horas
        const minutes = Math.random() < 0.5 ? '00' : '30';
        const startTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
        const endTime = `${hours.toString().padStart(2, '0')}:${parseInt(minutes) + 30}`;

        try {
          const appointment = await appointmentModel.create({
            patient: patient._id,
            doctor: doctor._id,
            date,
            startTime,
            endTime,
            status,
            type: Math.random() < 0.8 ? AppointmentType.IN_PERSON : AppointmentType.ONLINE,
            reason: reasons[Math.floor(Math.random() * reasons.length)],
            confirmedAt: status === AppointmentStatus.CONFIRMED || status === AppointmentStatus.COMPLETED ? new Date(date.getTime() - 86400000) : undefined,
          });

          createdAppointments.push(appointment);
        } catch (error) {
          // Ignorar duplicados
        }
      }
    }

    console.log(`✅ Creados ${createdAppointments.length} turnos`);

    // ==================== PASO 5: Crear pagos ====================
    console.log('\n💳 Creando pagos...');

    const paymentMethods = [
      PaymentMethod.CASH,
      PaymentMethod.CASH,
      PaymentMethod.DEBIT_CARD,
      PaymentMethod.CREDIT_CARD,
      PaymentMethod.TRANSFER,
      PaymentMethod.HEALTH_INSURANCE,
    ];

    let paymentCount = 0;
    const completedAppointments: any[] = createdAppointments.filter(
      (apt) => apt.status === AppointmentStatus.COMPLETED,
    );

    for (const appointment of completedAppointments) {
      const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const amount = Math.floor(Math.random() * 5000) + 5000; // 5000-10000

      await paymentModel.create({
        patient: appointment.patient,
        appointment: appointment._id,
        amount,
        paymentMethod: method,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(appointment.date.getTime() + 3600000), // 1 hora después
        receiptNumber: `REC-${Date.now()}-${paymentCount}`,
        healthInsuranceName: method === PaymentMethod.HEALTH_INSURANCE ? 'OSDE' : undefined,
      });

      paymentCount++;
    }

    console.log(`✅ Creados ${paymentCount} pagos`);

    // ==================== PASO 6: Crear registros médicos ====================
    console.log('\n📋 Creando registros médicos...');

    const diagnoses = [
      'Hipertensión arterial',
      'Diabetes mellitus tipo 2',
      'Infección respiratoria aguda',
      'Gastritis crónica',
      'Migraña',
      'Lumbalgia',
      'Ansiedad generalizada',
    ];

    const treatments = [
      'Medicación antihipertensiva - Control en 30 días',
      'Dieta hipoglucémica y ejercicio regular',
      'Antibióticos por 7 días - Reposo',
      'Protectores gástricos - Evitar irritantes',
      'Analgésicos - Seguimiento neurológico',
      'Fisioterapia y analgésicos',
      'Terapia cognitivo-conductual',
    ];

    let recordCount = 0;
    const recordsToCreate = completedAppointments.slice(0, Math.floor(completedAppointments.length * 0.7));

    for (const appointment of recordsToCreate) {
      await medicalRecordModel.create({
        patient: appointment.patient,
        doctor: appointment.doctor,
        appointment: appointment._id,
        consultationDate: appointment.date,
        chiefComplaint: appointment.reason,
        diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
        treatment: treatments[Math.floor(Math.random() * treatments.length)],
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: Math.floor(Math.random() * 30) + 60,
          temperature: 36 + Math.random(),
          weight: Math.floor(Math.random() * 40) + 50,
          height: Math.floor(Math.random() * 40) + 150,
        },
      });

      recordCount++;
    }

    console.log(`✅ Creados ${recordCount} registros médicos`);

    // ==================== RESUMEN ====================
    console.log('\n✅ ¡SEED COMPLETADO EXITOSAMENTE!\n');
    console.log('📊 Resumen:');
    console.log(`   - Pacientes totales: ${allPatients.length}`);
    console.log(`   - Doctores: ${doctors.length}`);
    console.log(`   - Horarios configurados: ${availabilityCount}`);
    console.log(`   - Turnos creados: ${createdAppointments.length}`);
    console.log(`   - Pagos creados: ${paymentCount}`);
    console.log(`   - Registros médicos: ${recordCount}`);
    console.log('\n🎉 Ahora puedes ver las estadísticas con datos reales!\n');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();