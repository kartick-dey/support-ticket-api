import { Module } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { AttachmentController } from './attachment.controller';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [AttachmentService],
  controllers: [AttachmentController],
  exports: [AttachmentService],
})
export class AttachmentModule {}
