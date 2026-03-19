import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  entities: [join(__dirname, '../**/*.entity.ts')],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository('users');

  const exists = await userRepo.findOneBy({ email: 'demo@reportbuilder.dev' });
  if (exists) {
    console.log('Usuário demo já existe — pulando.');
    await AppDataSource.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash('demo1234', 12);
  await userRepo.save(
    userRepo.create({
      name: 'Demo User',
      email: 'demo@reportbuilder.dev',
      passwordHash,
      refreshTokenHash: null,
    }),
  );

  console.log('✓ Usuário demo criado: demo@reportbuilder.dev / demo1234');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
