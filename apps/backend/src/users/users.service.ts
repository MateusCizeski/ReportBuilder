import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  async create(email: string, name: string, password: string): Promise<User> {
    const exists = await this.repo.findOneBy({ email });
    if (exists) throw new ConflictException('Email já cadastrado');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.repo.create({ email, name, passwordHash });
    return this.repo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    const hash = await bcrypt.hash(token, 10);
    await this.repo.update(userId, { refreshTokenHash: hash });
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.repo.update(userId, { refreshTokenHash: null });
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user?.refreshTokenHash) return false;
    return bcrypt.compare(token, user.refreshTokenHash);
  }
}
