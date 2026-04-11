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
  const db = AppDataSource;

  // ── Usuário demo ──────────────────────────────────────────────────
  const userRepo = db.getRepository('users');
  let user = await userRepo.findOneBy({ email: 'demo@reportbuilder.dev' });

  if (!user) {
    const passwordHash = await bcrypt.hash('demo1234', 12);
    user = await userRepo.save(
      userRepo.create({
        name: 'Demo User',
        email: 'demo@reportbuilder.dev',
        passwordHash,
        refreshTokenHash: null,
      }),
    );
    console.log('✓ Usuário demo criado');
  } else {
    console.log('— Usuário demo já existe');
  }

  // ── Tabelas de teste ──────────────────────────────────────────────
  // Cria as tabelas diretamente no banco do ReportBuilder
  // para servir como fonte de dados de demonstração

  await db.query(`
    CREATE TABLE IF NOT EXISTS demo_clientes (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      cidade VARCHAR(80),
      segmento VARCHAR(50),
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `);

  const clientesCount = await db.query<{ count: string }[]>(
    `SELECT COUNT(*) as count FROM demo_clientes`,
  );

  if (parseInt(clientesCount[0].count) === 0) {
    await db.query(`
      INSERT INTO demo_clientes (nome, email, cidade, segmento) VALUES
        ('Ana Paula Souza',    'ana@empresa.com',     'São Paulo',       'Varejo'),
        ('Carlos Menezes',     'carlos@empresa.com',  'Rio de Janeiro',  'Indústria'),
        ('Fernanda Lima',      'fernanda@empresa.com','Belo Horizonte',  'Serviços'),
        ('Roberto Alves',      'roberto@empresa.com', 'Curitiba',        'Varejo'),
        ('Juliana Costa',      'juliana@empresa.com', 'Porto Alegre',    'Tecnologia'),
        ('Marcos Pereira',     'marcos@empresa.com',  'Salvador',        'Serviços'),
        ('Patricia Oliveira',  'patricia@empresa.com','Fortaleza',       'Indústria'),
        ('Rafael Santos',      'rafael@empresa.com',  'Brasília',        'Tecnologia')
    `);
    console.log('✓ demo_clientes populada (8 registros)');
  } else {
    console.log('— demo_clientes já tem dados');
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS demo_pedidos (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER REFERENCES demo_clientes(id),
      produto VARCHAR(100) NOT NULL,
      categoria VARCHAR(50),
      valor DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pendente',
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `);

  const pedidosCount = await db.query<{ count: string }[]>(
    `SELECT COUNT(*) as count FROM demo_pedidos`,
  );

  if (parseInt(pedidosCount[0].count) === 0) {
    await db.query(`
      INSERT INTO demo_pedidos (cliente_id, produto, categoria, valor, status, criado_em) VALUES
        (1, 'Notebook Dell',        'Eletrônicos',   4500.00, 'pago',      NOW() - INTERVAL '30 days'),
        (2, 'Cadeira Ergonômica',   'Móveis',         890.00, 'pago',      NOW() - INTERVAL '28 days'),
        (3, 'Monitor 4K',           'Eletrônicos',   2100.00, 'pago',      NOW() - INTERVAL '25 days'),
        (1, 'Teclado Mecânico',     'Periféricos',    450.00, 'pago',      NOW() - INTERVAL '22 days'),
        (4, 'Mesa de Escritório',   'Móveis',        1200.00, 'pendente',  NOW() - INTERVAL '20 days'),
        (5, 'Headset Gamer',        'Periféricos',    380.00, 'pago',      NOW() - INTERVAL '18 days'),
        (6, 'Webcam HD',            'Periféricos',    250.00, 'pago',      NOW() - INTERVAL '15 days'),
        (2, 'Notebook Lenovo',      'Eletrônicos',   5200.00, 'pago',      NOW() - INTERVAL '12 days'),
        (7, 'Impressora Laser',     'Eletrônicos',   1800.00, 'cancelado', NOW() - INTERVAL '10 days'),
        (3, 'Mouse Wireless',       'Periféricos',    180.00, 'pago',      NOW() - INTERVAL '8 days'),
        (8, 'HD Externo 2TB',       'Armazenamento',  420.00, 'pago',      NOW() - INTERVAL '6 days'),
        (4, 'Smartphone Samsung',   'Eletrônicos',   3200.00, 'pendente',  NOW() - INTERVAL '4 days'),
        (5, 'Tablet iPad',          'Eletrônicos',   4800.00, 'pago',      NOW() - INTERVAL '3 days'),
        (6, 'Cabo HDMI 2m',         'Acessórios',      45.00, 'pago',      NOW() - INTERVAL '2 days'),
        (1, 'SSD 1TB',              'Armazenamento',  650.00, 'pago',      NOW() - INTERVAL '1 day')
    `);
    console.log('✓ demo_pedidos populada (15 registros)');
  } else {
    console.log('— demo_pedidos já tem dados');
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS demo_financeiro (
      id SERIAL PRIMARY KEY,
      descricao VARCHAR(150) NOT NULL,
      tipo VARCHAR(10) NOT NULL,
      categoria VARCHAR(60),
      valor DECIMAL(10,2) NOT NULL,
      data_lancamento DATE NOT NULL
    )
  `);

  const finCount = await db.query<{ count: string }[]>(
    `SELECT COUNT(*) as count FROM demo_financeiro`,
  );

  if (parseInt(finCount[0].count) === 0) {
    await db.query(`
      INSERT INTO demo_financeiro (descricao, tipo, categoria, valor, data_lancamento) VALUES
        ('Vendas janeiro',       'receita',  'Vendas',        18500.00, '2026-01-31'),
        ('Aluguel janeiro',      'despesa',  'Fixo',           3200.00, '2026-01-05'),
        ('Folha janeiro',        'despesa',  'RH',            12000.00, '2026-01-30'),
        ('Vendas fevereiro',     'receita',  'Vendas',        22300.00, '2026-02-28'),
        ('Aluguel fevereiro',    'despesa',  'Fixo',           3200.00, '2026-02-05'),
        ('Folha fevereiro',      'despesa',  'RH',            12000.00, '2026-02-28'),
        ('Serviços fevereiro',   'receita',  'Serviços',       4800.00, '2026-02-20'),
        ('Vendas março',         'receita',  'Vendas',        31200.00, '2026-03-31'),
        ('Aluguel março',        'despesa',  'Fixo',           3200.00, '2026-03-05'),
        ('Folha março',          'despesa',  'RH',            13500.00, '2026-03-30'),
        ('Marketing março',      'despesa',  'Marketing',      2800.00, '2026-03-15'),
        ('Serviços março',       'receita',  'Serviços',       7600.00, '2026-03-22'),
        ('Vendas abril',         'receita',  'Vendas',        28900.00, '2026-04-01'),
        ('Aluguel abril',        'despesa',  'Fixo',           3200.00, '2026-04-05'),
        ('Consultoria abril',    'receita',  'Serviços',       9500.00, '2026-04-02')
    `);
    console.log('✓ demo_financeiro populada (15 registros)');
  } else {
    console.log('— demo_financeiro já tem dados');
  }

  console.log('\n✓ Seed concluído com sucesso.');
  console.log('  Login: demo@reportbuilder.dev / demo1234');
  console.log(
    '  Tabelas de teste: demo_clientes, demo_pedidos, demo_financeiro',
  );
  console.log(
    '  Para conectar no chat, use o banco reportbuilder (localhost:5432)\n',
  );

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
