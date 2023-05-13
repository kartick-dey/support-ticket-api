import { Module } from '@nestjs/common';
import { EmailWatcherModule } from './email-watcher/email-watcher.module';
import { ConfigModule } from '@nestjs/config';
import { DbConfigModule } from './db-config/db-config.module';
import { EmailSenderModule } from './email-sender/email-sender.module';
import { TicketModule } from './ticket/ticket.module';
import { EnvironmentModule } from './environment/environment.module';
import { DatabaseModuleModule } from './database-module/database-module.module';
import { AttachmentModule } from './attachment/attachment.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    EmailWatcherModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DbConfigModule,
    DatabaseModuleModule,
    EmailSenderModule,
    TicketModule,
    EnvironmentModule,
    AttachmentModule,
    SharedModule,
    AuthModule,
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
