import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { SaveContextDto } from './dto/save-context.dto';
import { ChatDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private service: AiService) {}

  @Post('context')
  saveContext(
    @Body() dto: SaveContextDto,
    @Body('datasourceId') datasourceId: string,
  ) {
    return this.service.saveContext(dto, datasourceId);
  }

  @Get('context/:datasourceId')
  getContexts(@Param('datasourceId') datasourceId: string) {
    return this.service.getContexts(datasourceId);
  }

  @Get('context/:datasourceId/suggest')
  suggestContexts(
    @Param('datasourceId') datasourceId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.suggestContexts(datasourceId, user.id);
  }

  @Post('chat')
  chat(@Body() dto: ChatDto, @CurrentUser() user: User) {
    return this.service.chat(dto, user.id);
  }
}
