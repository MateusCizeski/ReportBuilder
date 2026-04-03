import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Datasource } from './datasource.entity';
import { CreateDatasourceDto } from './dto/create-datasource.dto';
import { UpdateDatasourceDto } from './dto/update-datasource.dto';
import { EncryptionService } from '../encryption/encryption.service';
import { ConnectionManager } from './connection-manager.service';

@Injectable()
export class DatasourcesService {
  constructor(
    @InjectRepository(Datasource)
    private repo: Repository<Datasource>,
    private encryption: EncryptionService,
    private connectionManager: ConnectionManager,
  ) {}

  async create(dto: CreateDatasourceDto, userId: string): Promise<Datasource> {
    const passwordEncrypted = this.encryption.encrypt(dto.password);

    const datasource = this.repo.create({
      name: dto.name,
      type: dto.type,
      host: dto.host,
      port: dto.port,
      database: dto.database,
      username: dto.username,
      passwordEncrypted,
      useSsl: dto.useSsl ?? false,
      userId,
    });

    return this.repo.save(datasource);
  }

  async findAll(userId: string): Promise<Datasource[]> {
    return this.repo.find({ where: { userId } });
  }

  async findOne(id: string, userId: string): Promise<Datasource> {
    const ds = await this.repo.findOneBy({ id });
    if (!ds) throw new NotFoundException('Datasource não encontrado');
    if (ds.userId !== userId) throw new ForbiddenException();
    return ds;
  }

  async update(
    id: string,
    dto: UpdateDatasourceDto,
    userId: string,
  ): Promise<Datasource> {
    const ds = await this.findOne(id, userId);

    if (dto.password) {
      ds.passwordEncrypted = this.encryption.encrypt(dto.password);
    }

    Object.assign(ds, {
      ...(dto.name && { name: dto.name }),
      ...(dto.type && { type: dto.type }),
      ...(dto.host && { host: dto.host }),
      ...(dto.port && { port: dto.port }),
      ...(dto.database && { database: dto.database }),
      ...(dto.username && { username: dto.username }),
      ...(dto.useSsl !== undefined && { useSsl: dto.useSsl }),
    });

    await this.connectionManager.closeConnection(id);
    return this.repo.save(ds);
  }

  async remove(id: string, userId: string): Promise<void> {
    const ds = await this.findOne(id, userId);
    await this.connectionManager.closeConnection(id);
    await this.repo.remove(ds);
  }

  async testConnection(
    id: string,
    userId: string,
  ): Promise<{ ok: boolean; message: string; latencyMs: number }> {
    const ds = await this.findOne(id, userId);
    const start = Date.now();
    try {
      await this.connectionManager.testConnection(ds);
      return {
        ok: true,
        message: 'Conexão bem-sucedida',
        latencyMs: Date.now() - start,
      };
    } catch (err: unknown) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : 'Erro desconhecido',
        latencyMs: Date.now() - start,
      };
    }
  }

  async getSchema(id: string, userId: string) {
    const ds = await this.findOne(id, userId);
    try {
      return await this.connectionManager.getSchema(ds);
    } catch (err: unknown) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : 'Erro desconhecido',
        latencyMs: Date.now(),
      };
    }
  }
}
