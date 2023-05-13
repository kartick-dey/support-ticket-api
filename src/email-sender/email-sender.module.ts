import { Global, Module } from '@nestjs/common';
import { EmailSenderService } from './email-sender.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('SMTP_HOST'),
          secure: true,
          auth: {
            user: config.get('WATCHER_EMAIL'),
            pass: config.get('WATCHER_EMAIL_PWD'),
          },
        },
        defaults: {
          from: `"${config.get('EMAIL_USER_NAME')}" <${config.get(
            'WATCHER_EMAIL'
          )}>`,
        },
        template: {
          dir: join(__dirname, 'email-template'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailSenderService],
  exports: [EmailSenderService],
})
export class EmailSenderModule {}
