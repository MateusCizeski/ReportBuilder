import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { knex, Knex } from 'knex';
import { EncryptionService } from '../encryption/encryption.service';
import { Datasource } from './datasource.entity';

@Injectable()
export class ConnectionManager implements OnModuleDestroy {
  private readonly logger = new Logger(ConnectionManager.name);
  private readonly pool = new Map<string, Knex>();

  constructor(private encryption: EncryptionService) {}

  getConnection(datasource: Datasource): Knex {
    if (this.pool.has(datasource.id)) {
      return this.pool.get(datasource.id)!;
    }

    const clientMap: Record<string, string> = {
      postgresql: 'pg',
      mysql: 'mysql2',
      mssql: 'mssql',
    };

    const password = this.encryption.decrypt(datasource.passwordEncrypted);

    const connection = knex({
      client: clientMap[datasource.type],
      connection: {
        host: datasource.host,
        port: datasource.port,
        user: datasource.username,
        password,
        database: datasource.database,
        ssl: datasource.useSsl ? { rejectUnauthorized: false } : undefined,
      },
      pool: { min: 0, max: 5 },
      acquireConnectionTimeout: 8000,
    });

    this.pool.set(datasource.id, connection);
    this.logger.log(`Conexão criada para datasource: ${datasource.name}`);
    return connection;
  }

  async testConnection(datasource: Datasource): Promise<void> {
    const conn = this.getConnection(datasource);
    await conn.raw('SELECT 1');
  }

  async getSchema(
    datasource: Datasource,
  ): Promise<Record<string, { name: string; type: string }[]>> {
    const conn = this.getConnection(datasource);

    const schemaQuery =
      datasource.type === 'mssql'
        ? `SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name, DATA_TYPE as data_type
           FROM INFORMATION_SCHEMA.COLUMNS ORDER BY TABLE_NAME, ORDINAL_POSITION`
        : `SELECT table_name, column_name, data_type
           FROM information_schema.columns
           WHERE table_schema = ${datasource.type === 'mysql' ? 'DATABASE()' : "'public'"}
           ORDER BY table_name, ordinal_position`;

    const result = await conn.raw(schemaQuery);
    const rows = datasource.type === 'postgresql' ? result.rows : result[0];

    return rows.reduce(
      (acc: Record<string, { name: string; type: string }[]>, row: any) => {
        const table = row.table_name;
        if (!acc[table]) acc[table] = [];
        acc[table].push({ name: row.column_name, type: row.data_type });
        return acc;
      },
      {},
    );
  }

  async closeConnection(datasourceId: string): Promise<void> {
    const conn = this.pool.get(datasourceId);
    if (conn) {
      await conn.destroy();
      this.pool.delete(datasourceId);
      this.logger.log(`Conexão encerrada: ${datasourceId}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    for (const [id, conn] of this.pool.entries()) {
      await conn.destroy();
      this.logger.log(`Conexão encerrada no shutdown: ${id}`);
    }
    this.pool.clear();
  }
}
