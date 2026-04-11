import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Datasource } from '../datasources/datasource.entity';

@Entity('business_contexts')
export class BusinessContext {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Datasource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'datasourceId' })
  datasource!: Datasource;

  @Column()
  datasourceId!: string;

  @Column()
  tableName!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'jsonb', nullable: true })
  columnDescriptions!: Record<string, string> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
