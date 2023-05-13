import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as notifier from 'mail-watcher';
import { TicketService } from 'src/ticket/ticket.service';
import * as fileSys from 'fs';
import * as util from 'util';
import * as shortid from 'shortid';

@Injectable()
export class EmailWatcherService {
  private fsWriteFile = util.promisify(fileSys.writeFile);
  private readonly logger = new Logger(EmailWatcherService.name);
  constructor(private config: ConfigService, private ticketSvc: TicketService) {
    this.startEmailWatcher();
    this.logger.log('Email watcher has been started...');
  }

  private getImapObject() {
    return {
      user: this.config.get('WATCHER_EMAIL'),
      password: this.config.get('WATCHER_EMAIL_PWD'),
      host: this.config.get('IMAP_HOST'),
      port: parseInt(this.config.get('IMAP_HOST_PORT')),
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    };
  }

  private async startEmailWatcher() {
    try {
      const imap: IIAMPObj = this.getImapObject();
      const watcher = notifier(imap);
      watcher
        .on('end', () => watcher.start())
        .on('mail', async (mail) => {
          try {
            this.logger.log(
              `From: ${mail.from[0].address}, Subject: ${mail.subject}`
            );
            await this.ticketSvc.storeEmailAsTicket(mail);
          } catch (error) {
            await this.fsWriteFile(
              `./emails-json-file/ERROR-${mail.subject.replace(
                /[^a-zA-Z ]/g,
                ''
              )}-${shortid.generate()}-watcher-email.json`,
              JSON.stringify(mail),
              'utf-8'
            );
            this.logger.error('Error: [startEmailWatcher] ', error);
          }
        })
        .start();
    } catch (error) {
      this.logger.error('Error: [startEmailWatcher]', error);
    }
  }
}

export interface IIAMPObj {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  tlsOptions: { rejectUnauthorized: boolean };
}
