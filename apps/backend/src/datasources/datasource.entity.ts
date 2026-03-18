import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export type DatasourceType = 'postgresql' | 'mysql' | 'mssql';

@Entity('datasources')
export class Datasource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: DatasourceType;

  @Column()
  host: string;

  @Column()
  port: number;

  @Column()
  database: string;

  @Column()
  username: string;

  @Column()
  passwordEncrypted: string;

  @Column({ default: false })
  useSsl: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
