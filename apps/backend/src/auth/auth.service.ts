import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.users.create(dto.email, dto.name, dto.password);
    return this.generateTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    return this.generateTokens(user.id, user.email);
  }

  async refresh(userId: string, refreshToken: string) {
    const valid = await this.users.validateRefreshToken(userId, refreshToken);
    if (!valid) throw new UnauthorizedException('Refresh token inválido');

    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();

    return this.generateTokens(user.id, user.email);
  }

  async logout(userId: string) {
    await this.users.clearRefreshToken(userId);
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN'),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
    });

    await this.users.saveRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }
}
