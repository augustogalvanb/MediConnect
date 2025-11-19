import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MedicalRecord } from './schemas/medical-record.schema';
import { CloudinaryService } from '../config/cloudinary.service';
import {
  CreateMedicalRecordDto,
  UpdateMedicalRecordDto,
  MedicalRecordQueryDto,
  MedicalRecordResponseDto,
  UploadFileDto,
} from './dto/medical-record.dto';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectModel(MedicalRecord.name) private medicalRecordModel: Model<MedicalRecord>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    doctorId: string,
    createMedicalRecordDto: CreateMedicalRecordDto,
  ): Promise<MedicalRecordResponseDto> {
    const medicalRecord = new this.medicalRecordModel({
      ...createMedicalRecordDto,
      patient: createMedicalRecordDto.patientId,
      appointment: createMedicalRecordDto.appointmentId,
      doctor: doctorId,
      consultationDate: new Date(createMedicalRecordDto.consultationDate),
    });

    await medicalRecord.save();
    return this.toResponseDto(
      await medicalRecord.populate(['patient', 'doctor', 'appointment']),
    );
  }

  async findAll(query: MedicalRecordQueryDto): Promise<MedicalRecordResponseDto[]> {
    const filter: any = {};

    if (query.patientId) {
      filter.patient = query.patientId;
    }

    if (query.doctorId) {
      filter.doctor = query.doctorId;
    }

    if (query.dateFrom || query.dateTo) {
      filter.consultationDate = {};
      if (query.dateFrom) {
        filter.consultationDate.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        filter.consultationDate.$lte = new Date(query.dateTo);
      }
    }

    const records = await this.medicalRecordModel
      .find(filter)
      .populate('patient', 'firstName lastName email dateOfBirth dni')
      .populate('doctor', 'firstName lastName specialty')
      .populate('appointment', 'date startTime')
      .sort({ consultationDate: -1 })
      .exec();

    return records.map((record) => this.toResponseDto(record));
  }

  async findOne(id: string, userId: string, userRole: string): Promise<MedicalRecordResponseDto> {
    const record = await this.medicalRecordModel
      .findById(id)
      .populate('patient', 'firstName lastName email dateOfBirth dni')
      .populate('doctor', 'firstName lastName specialty')
      .populate('appointment', 'date startTime')
      .exec();

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    // Verificar permisos
    const patientId = (record.patient as any)._id.toString();
    const doctorId = (record.doctor as any)._id.toString();

    if (
      userRole === 'patient' &&
      patientId !== userId
    ) {
      throw new ForbiddenException('You can only view your own medical records');
    }

    if (
      userRole === 'doctor' &&
      doctorId !== userId &&
      record.isConfidential
    ) {
      throw new ForbiddenException('This is a confidential record');
    }

    return this.toResponseDto(record);
  }

  async findByPatient(patientId: string): Promise<MedicalRecordResponseDto[]> {
    const records = await this.medicalRecordModel
      .find({ patient: patientId })
      .populate('patient', 'firstName lastName email dateOfBirth dni')
      .populate('doctor', 'firstName lastName specialty')
      .populate('appointment', 'date startTime')
      .sort({ consultationDate: -1 })
      .exec();

    return records.map((record) => this.toResponseDto(record));
  }

  async update(
    id: string,
    doctorId: string,
    updateMedicalRecordDto: UpdateMedicalRecordDto,
  ): Promise<MedicalRecordResponseDto> {
    const record = await this.medicalRecordModel.findById(id);

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    // Solo el médico que creó el registro puede modificarlo
    if ((record.doctor as any).toString() !== doctorId) {
      throw new ForbiddenException('You can only edit your own medical records');
    }

    Object.assign(record, updateMedicalRecordDto);
    await record.save();

    return this.toResponseDto(
      await record.populate(['patient', 'doctor', 'appointment']),
    );
  }

  async uploadAttachment(
    recordId: string,
    file: Express.Multer.File,
    uploadFileDto: UploadFileDto,
  ): Promise<MedicalRecordResponseDto> {
    const record = await this.medicalRecordModel.findById(recordId);

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    // Subir archivo a Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFile(
      file,
      'mediconnect/medical-records',
    );

    // Agregar attachment al registro
    record.attachments.push({
      fileName: file.originalname,
      fileUrl: uploadResult.secure_url,
      fileType: uploadFileDto.fileType,
      publicId: uploadResult.public_id,
      uploadedAt: new Date(),
    });

    await record.save();

    return this.toResponseDto(
      await record.populate(['patient', 'doctor', 'appointment']),
    );
  }

  async uploadMultipleAttachments(
    recordId: string,
    files: Express.Multer.File[],
    fileType: string,
  ): Promise<MedicalRecordResponseDto> {
    const record = await this.medicalRecordModel.findById(recordId);

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    // Subir múltiples archivos
    const uploadResults = await this.cloudinaryService.uploadMultipleFiles(
      files,
      'mediconnect/medical-records',
    );

    // Agregar todos los attachments
    uploadResults.forEach((result, index) => {
      record.attachments.push({
        fileName: files[index].originalname,
        fileUrl: result.secure_url,
        fileType: fileType as any,
        publicId: result.public_id,
        uploadedAt: new Date(),
      });
    });

    await record.save();

    return this.toResponseDto(
      await record.populate(['patient', 'doctor', 'appointment']),
    );
  }

  async deleteAttachment(
    recordId: string,
    attachmentIndex: number,
    userId: string,
    userRole: string,
  ): Promise<MedicalRecordResponseDto> {
    const record = await this.medicalRecordModel.findById(recordId);

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    // Verificar permisos
    if (
      userRole === 'doctor' &&
      (record.doctor as any).toString() !== userId
    ) {
      throw new ForbiddenException('You can only delete attachments from your own records');
    }

    if (attachmentIndex < 0 || attachmentIndex >= record.attachments.length) {
      throw new BadRequestException('Invalid attachment index');
    }

    const attachment = record.attachments[attachmentIndex];

    // Eliminar de Cloudinary
    if (attachment.publicId) {
      await this.cloudinaryService.deleteFile(attachment.publicId);
    }

    // Eliminar del array
    record.attachments.splice(attachmentIndex, 1);
    await record.save();

    return this.toResponseDto(
      await record.populate(['patient', 'doctor', 'appointment']),
    );
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    const record = await this.medicalRecordModel.findById(id);

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    // Solo admin puede eliminar registros
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only administrators can delete medical records');
    }

    // Eliminar todos los archivos de Cloudinary
    for (const attachment of record.attachments) {
      if (attachment.publicId) {
        await this.cloudinaryService.deleteFile(attachment.publicId);
      }
    }

    await this.medicalRecordModel.findByIdAndDelete(id);
  }

  private toResponseDto(record: any): MedicalRecordResponseDto {
    return {
      id: record._id.toString(),
      patient: {
        id: record.patient._id.toString(),
        firstName: record.patient.firstName,
        lastName: record.patient.lastName,
        email: record.patient.email,
        dateOfBirth: record.patient.dateOfBirth,
        dni: record.patient.dni,
      },
      doctor: {
        id: record.doctor._id.toString(),
        firstName: record.doctor.firstName,
        lastName: record.doctor.lastName,
        specialty: record.doctor.specialty,
      },
      appointment: record.appointment
        ? {
            id: record.appointment._id.toString(),
            date: record.appointment.date,
            startTime: record.appointment.startTime,
          }
        : undefined,
      consultationDate: record.consultationDate,
      chiefComplaint: record.chiefComplaint,
      historyOfPresentIllness: record.historyOfPresentIllness,
      physicalExamination: record.physicalExamination,
      vitalSigns: record.vitalSigns,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      medications: record.medications,
      notes: record.notes,
      attachments: record.attachments,
      followUpDate: record.followUpDate,
      isConfidential: record.isConfidential,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}