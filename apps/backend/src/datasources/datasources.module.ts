import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Datasource } from './datasource.entity';
import { DatasourcesService } from './datasources.service';
import { DatasourcesController } from './datasources.controller';
import { ConnectionManager } from './connection-manager.service';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [TypeOrmModule.forFeature([Datasource]), EncryptionModule],
  providers: [DatasourcesService, ConnectionManager],
  controllers: [DatasourcesController],
  exports: [DatasourcesService, ConnectionManager],
})
export class DatasourcesModule {}
