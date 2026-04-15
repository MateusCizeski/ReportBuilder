import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Share } from './share.entity';
import { Report } from '../reports/report.entity';

@Injectable()
export class SharesService {
  constructor(
    @InjectRepository(Share)
    private shareRepo: Repository<Share>,
    @InjectRepository(Report)
    private reportRepo: Repository<Report>,
  ) {}

  async createShare(reportId: string, userId: string): Promise<Share> {
    const existing = await this.shareRepo.findOneBy({ reportId, userId });
    if (existing) return existing;

    const report = await this.reportRepo.findOneBy({ id: reportId });
    if (!report) throw new NotFoundException('Relatório não encontrado');

    const token = randomBytes(16).toString('hex');

    const share = this.shareRepo.create({
      token,
      reportId,
      userId,
      snapshotRows: report.rows,
      snapshotRowCount: report.rowCount,
    });

    return this.shareRepo.save(share);
  }

  async getByToken(token: string): Promise<{
    reportName: string;
    rows: Record<string, any>[];
    rowCount: number;
    createdAt: Date;
  }> {
    const share = await this.shareRepo.findOne({
      where: { token },
      relations: ['report'],
    });

    if (!share) throw new NotFoundException('Link não encontrado ou expirado');

    await this.shareRepo.update(share.id, { viewCount: share.viewCount + 1 });

    return {
      reportName: share.report.name,
      rows: share.snapshotRows ?? [],
      rowCount: share.snapshotRowCount ?? 0,
      createdAt: share.createdAt,
    };
  }

  async deleteShare(reportId: string, userId: string): Promise<void> {
    await this.shareRepo.delete({ reportId, userId });
  }

  async getShareByReport(
    reportId: string,
    userId: string,
  ): Promise<Share | null> {
    return this.shareRepo.findOneBy({ reportId, userId });
  }
}
