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
import { Workspace } from '../workspaces/workspace.entity';
import { Datasource } from '../datasources/datasource.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text' })
  sql!: string;

  @Column({ type: 'jsonb', nullable: true })
  rows!: Record<string, any>[] | null;

  @Column({ nullable: true })
  rowCount!: number;

  @Column({ nullable: true })
  executionMs!: number;

  @Column({ type: 'varchar', default: 'table' })
  visualType!: 'table' | 'bar' | 'line' | 'pie';

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace!: Workspace;

  @Column()
  workspaceId!: string;

  @ManyToOne(() => Datasource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'datasourceId' })
  datasource!: Datasource;

  @Column()
  datasourceId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
