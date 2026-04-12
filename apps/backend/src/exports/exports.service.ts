import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Report } from '../reports/report.entity';
import { ConnectionManager } from '../datasources/connection-manager.service';
import { DatasourcesService } from '../datasources/datasources.service';

@Injectable()
export class ExportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepo: Repository<Report>,
    private connectionManager: ConnectionManager,
    private datasourcesService: DatasourcesService,
  ) {}

  async getReport(id: string, userId: string): Promise<Report> {
    const report = await this.reportRepo.findOneBy({ id });
    if (!report) throw new NotFoundException('Relatório não encontrado');
    if (report.userId !== userId) throw new ForbiddenException();
    return report;
  }

  async getRows(
    report: Report,
    userId: string,
  ): Promise<Record<string, any>[]> {
    if (report.rows && report.rows.length > 0) return report.rows;
    const ds = await this.datasourcesService.findOne(
      report.datasourceId,
      userId,
    );
    const conn = this.connectionManager.getConnection(ds);
    const result = await conn.raw(report.sql);
    return ds.type === 'postgresql' ? result.rows : result[0];
  }

  async exportExcel(reportId: string, userId: string): Promise<Buffer> {
    const report = await this.getReport(reportId, userId);
    const rows = await this.getRows(report, userId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ReportBuilder';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(report.name.substring(0, 31));

    if (rows.length === 0) {
      sheet.addRow(['Nenhum dado encontrado']);
      return Buffer.from((await workbook.xlsx.writeBuffer()) as ArrayBuffer);
    }

    const columns = Object.keys(rows[0]);

    // Cabeçalho
    sheet.columns = columns.map((col) => ({
      header: col,
      key: col,
      width: Math.max(col.length + 4, 14),
    }));

    // Estilo do cabeçalho
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1D9E75' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF0F6E56' } },
      };
    });
    headerRow.height = 22;

    // Dados
    rows.forEach((row, i) => {
      const dataRow = sheet.addRow(columns.map((col) => row[col] ?? ''));
      if (i % 2 === 1) {
        dataRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' },
          };
        });
      }
    });

    // Linha de total se tiver coluna numérica
    const numericCols = columns.filter(
      (col) => typeof rows[0][col] === 'number',
    );
    if (numericCols.length > 0) {
      const totalRow = sheet.addRow(
        columns.map((col) =>
          numericCols.includes(col)
            ? rows.reduce((sum, r) => sum + (Number(r[col]) || 0), 0)
            : col === columns[0]
              ? 'TOTAL'
              : '',
        ),
      );
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8F5E9' },
        };
      });
    }

    // Metadados numa segunda aba
    const metaSheet = workbook.addWorksheet('Informações');
    metaSheet.addRow(['Relatório', report.name]);
    metaSheet.addRow(['Gerado em', new Date().toLocaleString('pt-BR')]);
    metaSheet.addRow(['Total de linhas', rows.length]);
    metaSheet.addRow(['SQL', report.sql]);
    metaSheet.getColumn(1).width = 20;
    metaSheet.getColumn(2).width = 60;

    return Buffer.from((await workbook.xlsx.writeBuffer()) as ArrayBuffer);
  }

  async exportPdf(reportId: string, userId: string): Promise<Buffer> {
    const report = await this.getReport(reportId, userId);
    const rows = await this.getRows(report, userId);

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const displayRows = rows.slice(0, 500);

    const html = generateReportHtml(
      report.name,
      columns,
      displayRows,
      rows.length,
    );

    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}

function generateReportHtml(
  name: string,
  columns: string[],
  rows: Record<string, any>[],
  totalRows: number,
): string {
  const date = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const tableRows = rows
    .map(
      (row, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'}">
      ${columns
        .map((col) => {
          const val = row[col];
          const isNum = typeof val === 'number';
          return `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:${isNum ? 'right' : 'left'};color:#374151;">
          ${val === null || val === undefined ? '<span style="color:#9ca3af;font-style:italic">null</span>' : String(val)}
        </td>`;
        })
        .join('')}
    </tr>
  `,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #fff; }
    .header { padding: 24px 0 20px; border-bottom: 2px solid #1D9E75; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header-left h1 { font-size: 22px; font-weight: 600; color: #111827; }
    .header-left p { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .header-right { text-align: right; }
    .header-right .logo { font-size: 14px; font-weight: 600; color: #1D9E75; }
    .header-right .date { font-size: 12px; color: #9ca3af; margin-top: 2px; }
    .stats { display: flex; gap: 16px; margin-bottom: 20px; }
    .stat { background: #f3faf7; border: 1px solid #d1fae5; border-radius: 8px; padding: 12px 16px; }
    .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 20px; font-weight: 600; color: #1D9E75; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #1D9E75; }
    thead th { padding: 10px 12px; text-align: left; color: #fff; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
    ${totalRows > 500 ? '.truncate-note { background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:8px 12px;font-size:12px;color:#92400e;margin-bottom:16px; }' : ''}
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${name}</h1>
      <p>Relatório gerado automaticamente</p>
    </div>
    <div class="header-right">
      <div class="logo">ReportBuilder</div>
      <div class="date">${date}</div>
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-label">Total de registros</div>
      <div class="stat-value">${totalRows.toLocaleString('pt-BR')}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Colunas</div>
      <div class="stat-value">${columns.length}</div>
    </div>
  </div>

  ${totalRows > 500 ? `<div class="truncate-note">Exibindo os primeiros 500 de ${totalRows.toLocaleString('pt-BR')} registros. Exporte em Excel para ver todos os dados.</div>` : ''}

  <table>
    <thead>
      <tr>${columns.map((col) => `<th>${col}</th>`).join('')}</tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="footer">
    <span>ReportBuilder — ${date}</span>
    <span>${totalRows.toLocaleString('pt-BR')} registros · ${columns.length} colunas</span>
  </div>
</body>
</html>`;
}
