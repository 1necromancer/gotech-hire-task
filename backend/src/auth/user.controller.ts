import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('users')
export class UserController {
  constructor(private authService: AuthService) {}

  @Get()
  async getUsers(@Headers('authorization') auth: string) {
    if (!auth) {
      throw new UnauthorizedException('Token required');
    }
    const token = auth.replace('Bearer ', '');
    const decoded = this.authService.verifyToken(token);
    if (!decoded) {
      throw new UnauthorizedException('Invalid token');
    }
    return this.authService.getUsers();
  }
}
