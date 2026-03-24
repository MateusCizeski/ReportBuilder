import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private repo: Repository<Workspace>,
  ) {}

  async create(dto: CreateWorkspaceDto, userId: string): Promise<Workspace> {
    const workspace = this.repo.create({ ...dto, userId });
    return this.repo.save(workspace);
  }

  async findAll(userId: string): Promise<Workspace[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Workspace> {
    const ws = await this.repo.findOneBy({ id });
    if (!ws) throw new NotFoundException('Workspace não encontrado');
    if (ws.userId !== userId) throw new ForbiddenException();
    return ws;
  }

  async update(
    id: string,
    dto: CreateWorkspaceDto,
    userId: string,
  ): Promise<Workspace> {
    const ws = await this.findOne(id, userId);
    Object.assign(ws, dto);
    return this.repo.save(ws);
  }

  async remove(id: string, userId: string): Promise<void> {
    const ws = await this.findOne(id, userId);
    await this.repo.remove(ws);
  }
}
