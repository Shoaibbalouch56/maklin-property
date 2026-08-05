import { Module } from '@nestjs/common';
import { AdminSecretGuard } from '../common/guards/admin-secret.guard';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  controllers: [SubmissionsController],
  providers: [SubmissionsService, AdminSecretGuard],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
