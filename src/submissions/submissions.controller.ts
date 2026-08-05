import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminSecretGuard } from '../common/guards/admin-secret.guard';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionStatusDto } from './dto/update-submission-status.dto';
import { SubmissionsService } from './submissions.service';

@Controller()
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  /** Public — website inquiry / contact form */
  @Post('submissions')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(@Body() dto: CreateSubmissionDto) {
    return this.submissionsService.create(dto);
  }

  /** Protected — admin Messages page */
  @Get('admin/submissions')
  @UseGuards(AdminSecretGuard)
  findAll(
    @Query('formType') formType?: string,
    @Query('status') status?: string,
  ) {
    return this.submissionsService.findAll({ formType, status });
  }

  /** Protected — mark new / read / replied */
  @Patch('admin/submissions/:id/status')
  @UseGuards(AdminSecretGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSubmissionStatusDto,
  ) {
    return this.submissionsService.updateStatus(id, dto);
  }

  /** Protected — delete a message */
  @Delete('admin/submissions/:id')
  @UseGuards(AdminSecretGuard)
  remove(@Param('id') id: string) {
    return this.submissionsService.remove(id);
  }
}
