import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessContext } from './business-context.entity';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { DatasourcesModule } from '../datasources/datasources.module';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessContext]), DatasourcesModule],
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
