import { Global, Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { AttachmentModule } from 'src/attachment/attachment.module';
import { EmailSenderModule } from 'src/email-sender/email-sender.module';
import { SharedModule } from 'src/shared/shared.module';
import { AuthModule } from 'src/auth/auth.module';

@Global()
@Module({
  imports: [EmailSenderModule, SharedModule, AttachmentModule, AuthModule],
  providers: [TicketService],
  exports: [TicketService],
  controllers: [TicketController]
})
export class TicketModule {}
