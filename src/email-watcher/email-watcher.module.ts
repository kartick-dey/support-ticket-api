import { Module } from '@nestjs/common';
import { TicketModule } from 'src/ticket/ticket.module';
import { EmailWatcherService } from './email-watcher.service';

@Module({
  imports: [TicketModule],
  providers: [EmailWatcherService]
})
export class EmailWatcherModule {}
