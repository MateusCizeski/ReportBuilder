import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('exports')
export class ExportsController {
  constructor(private service: ExportsService) {}

  @Get('excel/:reportId')
  async excel(
    @Param('reportId') reportId: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const buffer = await this.service.exportExcel(reportId, user.id);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="relatorio-${reportId}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get('pdf/:reportId')
  async pdf(
    @Param('reportId') reportId: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const buffer = await this.service.exportPdf(reportId, user.id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-${reportId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
