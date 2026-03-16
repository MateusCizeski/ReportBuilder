import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(private config: ConfigService) {
    const raw = this.config.get<string>('ENCRYPTION_KEY');
    if (!raw || raw.length < 32) {
      throw new Error('ENCRYPTION_KEY deve ter no mínimo 32 caracteres');
    }
    this.key = crypto.scryptSync(raw, 'reportbuilder_salt', 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return [
      iv.toString('hex'),
      tag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':');
  }

  decrypt(ciphertext: string): string {
    const [ivHex, tagHex, encryptedHex] = ciphertext.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return (
      decipher.update(Buffer.from(encryptedHex, 'hex')).toString('utf8') +
      decipher.final('utf8')
    );
  }
}