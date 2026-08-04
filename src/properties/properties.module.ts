import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { AdminSecretGuard } from '../common/guards/admin-secret.guard';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, AdminSecretGuard],
  exports: [PropertiesService],
})
export class PropertiesModule {}
