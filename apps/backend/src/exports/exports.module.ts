import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';
import { Report } from '../reports/report.entity';
import { DatasourcesModule } from '../datasources/datasources.module';

@Module({
  imports: [TypeOrmModule.forFeature([Report]), DatasourcesModule],
  providers: [ExportsService],
  controllers: [ExportsController],
  exports: [ExportsService],
})
export class ExportsModule {}
