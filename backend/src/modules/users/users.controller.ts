import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: { userId: string }) {
    return this.usersService.findById(user.userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: { userId: string },
    @Body() body: { firstName?: string; lastName?: string; avatarUrl?: string },
  ) {
    return this.usersService.updateProfile(user.userId, body);
  }
}
