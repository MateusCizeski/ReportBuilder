import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Report } from '../reports/report.entity';
import { User } from '../users/user.entity';

@Entity('shares')
export class Share {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  token!: string;

  @ManyToOne(() => Report, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportId' })
  report!: Report;

  @Column()
  reportId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @Column({ type: 'jsonb', nullable: true })
  snapshotRows!: Record<string, any>[] | null;

  @Column({ nullable: true })
  snapshotRowCount!: number;

  @Column({ default: 0 })
  viewCount!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
