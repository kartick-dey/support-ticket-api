import { Global, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common/services';
import { ConfigService } from '@nestjs/config';

@Global()
@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);
  constructor(
    private mailerSvc: MailerService,
    private config: ConfigService
  ) {}

  public sendEmailNotification(emailPayload: IEmailPayload) {
    this.logger.log('Executing [sendEmailNotification]...');
    this.mailerSvc
      .sendMail({
        from: `"${this.config.get('EMAIL_USER_NAME')}" <${this.config.get(
          'WATCHER_EMAIL'
        )}>`,
        to: emailPayload.to,
        subject: emailPayload.subject,
        cc: emailPayload.cc || [],
        bcc: emailPayload.bcc || [],
        template: emailPayload.templateName,
        context: {
          body: emailPayload.body,
        },
        attachments: emailPayload.attachments,
      })
      .then((result) => {
        this.logger.log(
          `Email has beed triggered successfully to ${result.envelope.to}`
        );
      })
      .catch((error) => {
        this.logger.error('Error: [sendEmailNotification]', error);
      });
  }

  public sendReplyEmailNotification(emailPayload: IEmailReplyPayload) {
    this.logger.log('Executing [sendEmailNotification]...');
    this.mailerSvc
      .sendMail({
        from: `"${this.config.get('EMAIL_USER_NAME')}" <${this.config.get(
          'WATCHER_EMAIL'
        )}>`,
        to: emailPayload.to,
        subject: emailPayload.subject,
        cc: emailPayload.cc || [],
        bcc: emailPayload.bcc || [],
        inReplyTo: emailPayload.messageId,
        template: emailPayload.templateName,
        context: {
          body: emailPayload.body,
        },
        attachments: emailPayload.attachments || [],
      })
      .then((result) => {
        this.logger.log(
          `Email reply has been triggered successfully to ${result.envelope.to}`
        );
      })
      .catch((error) => {
        this.logger.error('Error: [sendReplyEmailNotification]', error);
      });
  }
}

export interface IEmailPayload {
  subject: string;
  to: string | IEmailAddress | Array<string | IEmailAddress>;
  cc?: string | IEmailAddress | Array<string | IEmailAddress>;
  bcc?: string | IEmailAddress | Array<string | IEmailAddress>;
  body: any;
  templateName: string;
  attachments?: Array<IEmailAttachment>;
}

export interface IEmailReplyPayload {
  subject: string;
  to: string | IEmailAddress | Array<string | IEmailAddress>;
  cc?: string | IEmailAddress | Array<string | IEmailAddress>;
  bcc?: string | IEmailAddress | Array<string | IEmailAddress>;
  messageId: string;
  body: any;
  templateName: string;
  attachments?: Array<IEmailAttachment>;
}

export interface IEmailAddress {
  name: string;
  address: string;
}

export interface IEmailAttachment {
  filename: string;
  path?: string;
  content?: string;
  contentType?: string;
}
