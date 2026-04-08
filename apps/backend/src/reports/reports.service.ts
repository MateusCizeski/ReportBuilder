import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './report.entity';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private repo: Repository<Report>,
  ) {}

  async create(dto: CreateReportDto, userId: string): Promise<Report> {
    const report = this.repo.create({ ...dto, userId });
    return this.repo.save(report);
  }

  async findByWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<Report[]> {
    return this.repo.find({
      where: { workspaceId, userId },
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'name',
        'sql',
        'visualType',
        'rowCount',
        'datasourceId',
        'createdAt',
      ],
    });
  }

  async findOne(id: string, userId: string): Promise<Report> {
    const report = await this.repo.findOneBy({ id });
    if (!report) throw new NotFoundException('Relatório não encontrado');
    if (report.userId !== userId) throw new ForbiddenException();
    return report;
  }

  async remove(id: string, userId: string): Promise<void> {
    const report = await this.findOne(id, userId);
    await this.repo.remove(report);
  }

  async rerun(id: string, userId: string) {
    const report = await this.findOne(id, userId);
    return report;
  }
}
