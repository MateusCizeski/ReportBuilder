import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dashboard } from './dashboard.entity';
import { DashboardsService } from './dashboards.service';
import { DashboardsController } from './dashboards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Dashboard])],
  providers: [DashboardsService],
  controllers: [DashboardsController],
  exports: [DashboardsService],
})
export class DashboardsModule {}
