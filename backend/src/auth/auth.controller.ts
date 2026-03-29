import { Controller, Post, Body, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto.username, dto.password);
  }

  @Post('login')
  async login(@Body() dto: CreateUserDto) {
    const result = await this.authService.login(dto.username, dto.password);
    if (!result) {
      return { error: 'Invalid credentials' };
    }
    return result;
  }
}
