import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dashboard } from './dashboard.entity';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';

@Injectable()
export class DashboardsService {
  constructor(
    @InjectRepository(Dashboard)
    private repo: Repository<Dashboard>,
  ) {}

  async create(dto: CreateDashboardDto, userId: string): Promise<Dashboard> {
    const dashboard = this.repo.create({ ...dto, userId });
    return this.repo.save(dashboard);
  }

  async findByWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<Dashboard[]> {
    return this.repo.find({
      where: { workspaceId, userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Dashboard> {
    const dashboard = await this.repo.findOneBy({ id });
    if (!dashboard) throw new NotFoundException('Dashboard não encontrado');
    if (dashboard.userId !== userId) throw new ForbiddenException();
    return dashboard;
  }

  async update(
    id: string,
    dto: UpdateDashboardDto,
    userId: string,
  ): Promise<Dashboard> {
    const dashboard = await this.findOne(id, userId);
    Object.assign(dashboard, dto);
    return this.repo.save(dashboard);
  }

  async remove(id: string, userId: string): Promise<void> {
    const dashboard = await this.findOne(id, userId);
    await this.repo.remove(dashboard);
  }
}
