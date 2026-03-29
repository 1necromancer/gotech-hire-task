import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async register(username: string, password: string): Promise<any> {
    const hashed = await this.hashPassword(password);
    const user = this.userRepository.create({ username, password: hashed });
    const saved = await this.userRepository.save(user);
    const token = jwt.sign({ userId: saved.id, username }, JWT_SECRET, { expiresIn: '24h' });
    return { token, userId: saved.id };
  }

  async login(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      return null;
    }
    const isValid = await this.comparePassword(password, user.password);
    if (!isValid) {
      return null;
    }
    const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: '24h' });
    return { token, userId: user.id };
  }

  async getUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find();
    return users.map(({ password, ...user }) => user);
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }
}
