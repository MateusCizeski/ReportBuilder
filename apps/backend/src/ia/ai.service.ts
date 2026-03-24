import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessContext } from './business-context.entity';
import { ConnectionManager } from '../datasources/connection-manager.service';
import { DatasourcesService } from '../datasources/datasources.service';
import { SaveContextDto } from './dto/save-context.dto';
import { ChatDto } from './dto/chat.dto';

const BLOCKED =
  /\b(DROP|DELETE|UPDATE|INSERT|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\b/i;
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessContext } from './business-context.entity';
import { ConnectionManager } from '../datasources/connection-manager.service';
import { DatasourcesService } from '../datasources/datasources.service';
import { SaveContextDto } from './dto/save-context.dto';
import { ChatDto } from './dto/chat.dto';

const BLOCKED =
  /\b(DROP|DELETE|UPDATE|INSERT|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\b/i;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly geminiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor(
    private config: ConfigService,
    @InjectRepository(BusinessContext)
    private contextRepo: Repository<BusinessContext>,
    private datasourcesService: DatasourcesService,
    private connectionManager: ConnectionManager,
  ) {}

  async saveContext(
    dto: SaveContextDto,
    datasourceId: string,
  ): Promise<BusinessContext> {
    const existing = await this.contextRepo.findOneBy({
      datasourceId,
      tableName: dto.tableName,
    });

    if (existing) {
      Object.assign(existing, dto);
      return this.contextRepo.save(existing);
    }

    const context = this.contextRepo.create({ ...dto, datasourceId });
    return this.contextRepo.save(context);
  }

  async getContexts(datasourceId: string): Promise<BusinessContext[]> {
    return this.contextRepo.find({ where: { datasourceId } });
  }

  async suggestContexts(
    datasourceId: string,
    userId: string,
  ): Promise<Record<string, string>> {
    const ds = await this.datasourcesService.findOne(datasourceId, userId);
    const schema = await this.connectionManager.getSchema(ds);
    const tableNames = Object.keys(schema);

    const prompt = `Você é um especialista em banco de dados e análise de negócios.
Dado o schema abaixo, gere descrições curtas e claras em português para cada tabela, 
explicando o que ela representa no contexto de negócio.
Retorne APENAS um JSON válido no formato: {"nome_tabela": "descrição"}

Schema:
${tableNames.map((t) => `- ${t}: ${schema[t].map((c) => c.name).join(', ')}`).join('\n')}`;

    const result = await this.callGemini(prompt);

    try {
      const cleaned = result.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {};
    }
  }

  async chat(dto: ChatDto, userId: string) {
    const ds = await this.datasourcesService.findOne(dto.datasourceId, userId);
    const schema = await this.connectionManager.getSchema(ds);
    const contexts = await this.getContexts(dto.datasourceId);

    const schemaText = Object.entries(schema)
      .map(([table, cols]) => {
        const ctx = contexts.find((c) => c.tableName === table);
        const colDescs = cols
          .map((col) => {
            const colDesc = ctx?.columnDescriptions?.[col.name];
            return `  - ${col.name} (${col.type})${colDesc ? `: ${colDesc}` : ''}`;
          })
          .join('\n');
        return `Tabela: ${table}${ctx ? `\nDescrição: ${ctx.description}` : ''}\nColunas:\n${colDescs}`;
      })
      .join('\n\n');

    const historyText = (dto.history ?? [])
      .map(
        (m) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`,
      )
      .join('\n');

    const systemPrompt = `Você é um assistente de análise de dados especializado em SQL.
Seu objetivo é ajudar o usuário a consultar dados do banco respondendo em português.

REGRAS CRÍTICAS:
- Gere APENAS queries SELECT. Nunca gere DROP, DELETE, UPDATE, INSERT, TRUNCATE ou ALTER.
- Quando tiver certeza do que o usuário quer, retorne um JSON com este formato exato:
  {"type":"query","sql":"SELECT ...","explanation":"O que a query faz em português"}
- Quando precisar de mais informações, retorne:
  {"type":"question","content":"Sua pergunta aqui"}
- Quando não for possível responder com os dados disponíveis, retorne:
  {"type":"error","content":"Explicação do problema"}

BANCO DE DADOS DISPONÍVEL:
Tipo: ${ds.type}
${schemaText}

${historyText ? `HISTÓRICO DA CONVERSA:\n${historyText}` : ''}`;

    const response = await this.callGemini(
      `${systemPrompt}\n\nUsuário: ${dto.message}`,
    );

    try {
      const cleaned = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.type === 'query') {
        if (BLOCKED.test(parsed.sql)) {
          return {
            type: 'error',
            content: 'A query gerada contém comandos não permitidos.',
          };
        }

        const conn = this.connectionManager.getConnection(ds);
        const start = Date.now();
        const result = await conn.raw(parsed.sql);
        const rows = ds.type === 'postgresql' ? result.rows : result[0];

        return {
          type: 'query',
          sql: parsed.sql,
          explanation: parsed.explanation,
          rows,
          rowCount: rows.length,
          executionMs: Date.now() - start,
        };
      }

      return parsed;
    } catch {
      return {
        type: 'text',
        content: response,
      };
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');

    const response = await fetch(`${this.geminiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`Gemini error: ${err}`);
      throw new BadRequestException('Erro ao chamar a IA. Tente novamente.');
    }

    const data = (await response.json()) as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
}
