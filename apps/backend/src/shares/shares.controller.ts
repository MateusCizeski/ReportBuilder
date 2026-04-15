import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SharesService } from './shares.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('shares')
export class SharesController {
  constructor(private service: SharesService) {}

  @Get('public/:token')
  getPublic(@Param('token') token: string) {
    return this.service.getByToken(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':reportId')
  create(@Param('reportId') reportId: string, @CurrentUser() user: User) {
    return this.service.createShare(reportId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('report/:reportId')
  getByReport(@Param('reportId') reportId: string, @CurrentUser() user: User) {
    return this.service.getShareByReport(reportId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':reportId')
  delete(@Param('reportId') reportId: string, @CurrentUser() user: User) {
    return this.service.deleteShare(reportId, user.id);
  }
}
