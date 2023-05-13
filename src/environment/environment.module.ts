import { Module } from '@nestjs/common';
import { EnvironmentService } from './environment.service';

@Module({
  imports: [],
  providers: [EnvironmentService],
  exports: []
})
export class EnvironmentModule {}
