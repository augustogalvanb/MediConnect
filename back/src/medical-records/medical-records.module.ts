import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecord, MedicalRecordSchema } from './schemas/medical-record.schema';
import { CloudinaryService } from '../config/cloudinary.service';
import { CloudinaryProvider } from '../config/cloudinary.config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MedicalRecord.name, schema: MedicalRecordSchema },
    ]),
  ],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService, CloudinaryService, CloudinaryProvider],
  exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}