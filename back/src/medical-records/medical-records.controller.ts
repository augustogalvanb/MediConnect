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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MedicalRecordsService } from './medical-records.service';
import {
  CreateMedicalRecordDto,
  UpdateMedicalRecordDto,
  MedicalRecordQueryDto,
  UploadFileDto,
} from './dto/medical-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('medical-records')
@UseGuards(JwtAuthGuard)
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  create(
    @GetUser() user: any,
    @Body() createMedicalRecordDto: CreateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.create(user.userId, createMedicalRecordDto);
  }

  @Get()
  findAll(@Query() query: MedicalRecordQueryDto, @GetUser() user: any) {
    // Si es paciente, solo ve sus propios registros
    if (user.role === UserRole.PATIENT) {
      query.patientId = user.userId;
    }
    // Si es médico, puede ver los que creó (opcional filtrar)
    if (user.role === UserRole.DOCTOR) {
      query.doctorId = user.userId;
    }
    return this.medicalRecordsService.findAll(query);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findByPatient(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.findByPatient(patientId);
  }

  @Get('my-records')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  getMyRecords(@GetUser() user: any) {
    return this.medicalRecordsService.findByPatient(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.medicalRecordsService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  update(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body() updateMedicalRecordDto: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.update(
      id,
      user.userId,
      updateMedicalRecordDto,
    );
  }

  @Post(':id/upload')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    return this.medicalRecordsService.uploadAttachment(id, file, uploadFileDto);
  }

  @Post(':id/upload-multiple')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleFiles(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('fileType') fileType: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    // Validar tamaño de cada archivo
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException(
          `File ${file.originalname} exceeds 10MB limit`,
        );
      }
    }

    return this.medicalRecordsService.uploadMultipleAttachments(
      id,
      files,
      fileType,
    );
  }

  @Delete(':id/attachments/:index')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  deleteAttachment(
    @Param('id') id: string,
    @Param('index') index: string,
    @GetUser() user: any,
  ) {
    return this.medicalRecordsService.deleteAttachment(
      id,
      parseInt(index),
      user.userId,
      user.role,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.medicalRecordsService.delete(id, user.userId, user.role);
  }
}