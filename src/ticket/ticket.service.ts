import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TicketDocument, TICKET_MODEL } from 'src/schemas/ticket';
import {
  TicketEmailDocument,
  TICKET_EMAIL_MODEL,
} from 'src/schemas/ticket-email';
import {
  IAttachment,
  ITicketEmail,
  ITicketReplyData,
  IUser,
  IWatcherEmailAttachment,
  TICKET_EMAIL_TYPE,
} from '../models';
import * as shortid from 'shortid';
import { ITicket } from 'src/models';
import { AttachmentService } from 'src/attachment/attachment.service';
import {
  EmailSenderService,
  IEmailPayload,
  IEmailReplyPayload,
  IEmailAttachment,
} from 'src/email-sender/email-sender.service';
import { Constants } from 'src/utils/constant';
import { SharedService } from 'src/shared/shared.service';
import { ObjectId } from 'bson';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    @InjectModel(TICKET_EMAIL_MODEL)
    private readonly ticketEmailModel: Model<TicketEmailDocument>,
    @InjectModel(TICKET_MODEL)
    private readonly ticketModel: Model<TicketDocument>,
    private attachmentSvc: AttachmentService,
    private sendEmailSvc: EmailSenderService,
    private sharedSvc: SharedService,
    private configSvc: ConfigService
  ) {}

  private async getEmailCountBySubject(subject: string, envID: string) {
    try {
      const filter: any = {
        subject: subject,
        isDeleted: false,
        envID: envID,
      };
      return this.ticketEmailModel.countDocuments(filter);
    } catch (error) {
      this.logger.error('Error: [getEmailCountBySubject]', error);
      throw error;
    }
  }

  private transformEmailToTicket(email: ITicketEmail, currTicketNum: number) {
    try {
      const ticket: ITicket = {
        envID: email.envID,
        ticketID: shortid.generate(),
        ticketNumber: currTicketNum,
        ticketOwner: 'L1 Team',
        contactName: this.getNameFromMailAddress(email.from[0]),
        contactEmail: email.from[0]?.address,
        subject: email.subject,
        threadCount: email.thread,
        status: 'New',
        channel: 'Email',
        seen: false,
      };
      return ticket;
    } catch (error) {
      this.logger.error('Error: [transformEmailToTicket]', error);
      throw error;
    }
  }

  private async findTicketBySubject(subject: string, envID: string) {
    try {
      const filter = {
        subject: subject,
        envID: envID,
        isDeleted: false,
      };
      const ticket = await this.ticketModel.findOne(filter).lean();
      return ticket;
    } catch (error) {
      this.logger.error('Error: [findTicketBySubject]', error);
      throw error;
    }
  }

  private async totalTicketCount(envID: string) {
    try {
      const count = await this.ticketModel.countDocuments({ envID: envID });
      return count;
    } catch (error) {
      this.logger.error('Error: [totalTicketCount]', error);
      throw error;
    }
  }

  private async createOrUpdateTicket(email: ITicketEmail) {
    try {
      this.logger.log('Executing [createOrUpdateTicket]...');
      const currentTicket: ITicket = await this.findTicketBySubject(
        email.subject.trim().toString(),
        email.envID
      );
      if (!currentTicket) {
        const tktCount = await this.totalTicketCount(email.envID);
        const ticket: ITicket = this.transformEmailToTicket(
          email,
          tktCount + 1
        );
        const result = await this.ticketModel.create(ticket);
        this.logger.log('Ticket is created successfully...');
        return { id: result._id, tktNum: result.ticketNumber };
      } else {
        const data = {
          threadCount: currentTicket.threadCount + 1,
        };
        const updateResp = await this.updateTicketById(currentTicket._id, data);
        if (updateResp.modifiedCount) {
          this.logger.log(
            `Ticket(${currentTicket.ticketID}) is updated successfully...`
          );
        }
        return { id: currentTicket._id, tktNum: currentTicket.ticketNumber };
      }
    } catch (error) {
      this.logger.error('Error: [createOrUpdateTicket]', error);
      throw error;
    }
  }

  private async sendTicketEmailToSupportTeam(
    email: ITicketEmail,
    tktNum: number
  ) {
    try {
      let attachments: Array<IEmailAttachment> = [];
      if (email.attachments && email.attachments.length > 0) {
        attachments = await this.extractAttachmentInfo(email.attachments);
      }
      const sendTo = ['kartick.dey1995@gmail.com'];
      const emailPayload: IEmailPayload = {
        subject: `[## ${tktNum} ##] Ticket has been assigned to your team`,
        body: email.html,
        to: sendTo,
        templateName: 'send-ticket-to-support',
        attachments: attachments || [],
      };
      await this.sendEmailSvc.sendEmailNotification(emailPayload);
      this.logger.log('Ticket is has been send to support team...');
    } catch (error) {
      this.logger.error('Error: [sendTicketEmailToSupportTeam]', error);
      throw error;
    }
  }

  private async extractAttachmentInfo(attachments: Array<IAttachment>) {
    try {
      const _attachments: Array<IEmailAttachment> = [];
      for (let i = 0; i < attachments.length; i++) {
        const filePath = await this.attachmentSvc.downloadFile(
          attachments[i]._id
        );
        _attachments.push({ filename: attachments[i].name, path: filePath });
      }
      return _attachments.length > 0 ? _attachments : [];
    } catch (error) {
      this.logger.error('Error: [extractAttachmentInfo]', error);
      throw error;
    }
  }

  private async getThreadCount(subject: string, envID: string) {
    try {
      const count = await this.getEmailCountBySubject(subject, envID);
      return count === 0 ? 1 : count + 1;
    } catch (error) {
      this.logger.error('Error: [getThreadCount]', error);
      throw error;
    }
  }

  private tranformBeforeSave(mail: any) {
    try {
      const subject: string = mail.subject.toString();
      if (subject.startsWith('Re: ')) {
        mail.parsedSubject = mail.subject.toString().replace(/Re: /g, '');
      } else if (subject.startsWith('Fwd: ')) {
        mail.parsedSubject = mail.subject.toString().replace(/Fwd: /g, '');
      }
      const email: ITicketEmail = {
        from: mail.from,
        to: mail.to,
        cc: mail.cc || [],
        subject: mail.parsedSubject || mail.subject,
        originalSubject: mail.subject,
        headers: mail.headers,
        text: mail.text || '',
        html: mail.html,
        messageId: mail.messageId,
        receivedDate: mail.receivedDate,
        uid: mail.uid,
        date: mail.date,
        flags: mail.flags,
        priority: mail.priority,
        ticketEmailType: 'Ticket',
        draft: false,
        senderName: this.getNameFromMailAddress(mail.from[0]),
        senderEmail: mail.from[0].address || '',
        recipientName: this.getNameFromMailAddress(mail.to[0]),
        recipientEmail: mail.to[0].address || '',
      };
      return email;
    } catch (error) {
      this.logger.error('Error: [tranformBeforeSave]', error);
      throw error;
    }
  }

  private getNameFromMailAddress(mailAddress: {
    name: string;
    address: string;
  }) {
    try {
      if (mailAddress.name) {
        return mailAddress.name;
      } else {
        return mailAddress.address.split('@')[0];
      }
    } catch (error) {
      this.logger.error('Error: [getNameFromMailAddress] ', error);
      throw error;
    }
  }

  public async storeEmailAsTicket(mail: any) {
    try {
      if (!mail.subject.startsWith('Ticket:')) {
        return;
      }
      this.logger.log('Exceuting [storeEmailAsTicket]...');
      const email: ITicketEmail = this.tranformBeforeSave(mail);
      let emailWithInlineDoc = null;
      if (email.subject && email.from[0].address) {
        email.envID = 'productionenv';
        email.thread = await this.getThreadCount(email.subject, email.envID);
        const { id, tktNum } = await this.createOrUpdateTicket(email);
        if (id) {
          email.ticketObjId = id;
          emailWithInlineDoc = { ...email };
          if (mail.attachments && mail.attachments.length > 0) {
            email.attachments = await this.uploadAttachments(
              id,
              email.envID,
              mail.attachments
            );
            emailWithInlineDoc = { ...email };
            email.html = this.replaceInlineHtmlDocUrl(email);
            email.attachments = email.attachments.filter(
              (e) => e.contentDisposition !== 'inline'
            );
          }
          const ticketEmail = await this.ticketEmailModel.create(email);
          this.logger.log('Email has beed stored successfully...');
          await this.sendTicketEmailToSupportTeam(emailWithInlineDoc, tktNum);
          return ticketEmail;
        } else {
          throw new Error(
            'Error: Unable to create/update ticket and store email'
          );
        }
      } else {
        this.logger.error('Error: Subject and sender email is not provided');
      }
    } catch (error) {
      this.logger.error('Error: [storeEmailAsTicket]', error);
      throw error;
    }
  }

  private replaceInlineHtmlDocUrl(email: ITicketEmail) {
    try {
      let html = email.html;
      email.attachments.forEach((each) => {
        if (each.contentDisposition === 'inline') {
          html = html.replace(
            `cid:${each.contentId}`,
            `http://localhost:3000/attachment/download/${each._id.toString()}`
          );
        }
      });
      html = html.split('<blockquote')[0];
      return html;
    } catch (error) {
      this.logger.error('Error: [replaceInlineHtmlDocUrl]', error);
      throw error;
    }
  }

  private async uploadAttachments(
    ticketId: ObjectId,
    envID: string,
    attachments: Array<IWatcherEmailAttachment>
  ) {
    try {
      this.logger.log('Executing [uploadAttachments]...');
      const _attachments: Array<IAttachment> = [];
      let contentIds = attachments.map((e) => e.contentId);
      contentIds = await this.attachmentSvc.getExistingDocmentsContentIds(
        contentIds
      );
      attachments = attachments.filter(
        (e) => !contentIds.includes(e.contentId)
      );
      for (let i = 0; i < attachments.length; i++) {
        const attachment: IAttachment = {
          name: attachments[i].fileName,
          contentType: attachments[i].contentType,
          size: attachments[i].length,
          content: attachments[i].content,
          envID: envID,
          contentDisposition: attachments[i].contentDisposition || 'attachment',
          contentId: attachments[i].contentId || shortid.generate(),
        };
        const file: any = await this.attachmentSvc.uploadFile(
          attachment,
          ticketId
        );
        _attachments.push({
          _id: file._id,
          name: file.name,
          contentType: file.contentType,
          location: file.location,
          contentDisposition: file.contentDisposition,
          contentId: file.contentId,
        });
      }
      return _attachments;
    } catch (error) {
      this.logger.error('Error: [uploadAttachments]', error);
      throw error;
    }
  }

  public async updateTicketById(
    id: ObjectId,
    data: Partial<ITicket>
  ): Promise<any> {
    try {
      const updateResp = await this.ticketModel.updateOne(
        {
          _id: id,
          isDeleted: false,
        },
        { $set: data }
      );
      return updateResp;
    } catch (error) {
      this.logger.error('Error: [updateTicketById]', error);
      throw error;
    }
  }

  public async createTicket(ticket: ITicket) {
    try {
      ticket.ticketID = shortid.generate();
      const _ticket = await this.ticketModel.create(ticket);
      return _ticket;
    } catch (error) {
      this.logger.error('Error: [createTicket]', error);
      if (error.name === 'validationError') {
        throw new BadRequestException(error.errors);
      }
      throw new ServiceUnavailableException();
    }
  }

  public async replyOrDraftTicket(replyPayload: ITicketReplyData, user: any) {
    try {
      const ticket: ITicket = await this.ticketModel
        .findOne({ _id: new ObjectId(replyPayload.ticketId.toString()) })
        .lean();
      const replyEmail: ITicketEmail = this.tranformToTickeEmail(
        ticket,
        replyPayload,
        user
      );
      replyEmail.ticketObjId = new ObjectId(replyPayload.ticketId);
      if (!replyPayload.draft) {
        if (replyPayload.ticketEmailType === 'Forward') {
          await this.sendForwardEmail(replyPayload, ticket.subject);
        } else if (replyPayload.ticketEmailType === 'Reply') {
          await this.sendReplyEmail(replyEmail, replyPayload);
        }
      }
      let emailTicket: any;
      if (replyPayload._id) {
        await this.updateTicketEmail(replyPayload._id.toString(), replyEmail);
      } else {
        emailTicket = await this.ticketEmailModel.create(replyEmail);
        await this.ticketModel.updateOne(
          { _id: new ObjectId(replyPayload.ticketId) },
          {
            $set: {
              threadCount: emailTicket.thread,
              ticketOwner: user.firstName + ' ' + user.lastName,
            },
          }
        );
      }
      return emailTicket ? emailTicket : replyEmail;
    } catch (error) {
      this.logger.error('Error: [replyOrDraftTicket]', error);
      throw error;
    }
  }

  private async updateTicketEmail(_id: string, replyEmail: ITicketEmail) {
    try {
      const data = {
        html: replyEmail.html,
        text: replyEmail.text,
        to: replyEmail.to,
        cc: replyEmail.cc,
        bcc: replyEmail.bcc,
        date: replyEmail.date,
        receivedDate: replyEmail.receivedDate,
        attachments: replyEmail.attachments,
        draft: replyEmail.draft,
        senderName: replyEmail.senderName,
        senderEmail: replyEmail.senderEmail,
        recipientName: replyEmail.recipientName,
        recipientEmail: replyEmail.recipientEmail,
      };
      const resp = await this.ticketEmailModel.updateOne(
        { _id: new ObjectId(_id.toString()) },
        { $set: data }
      );
      return resp;
    } catch (error) {
      this.logger.error('Error: [updateTicketEmail]', error);
      throw error;
    }
  }

  private async sendReplyEmail(
    tktEmail: ITicketEmail,
    replyPayload: ITicketReplyData
  ) {
    try {
      const originalTicketEmail = await this.loadTicketEmailByThread(
        tktEmail.ticketObjId.toString(),
        1
      );
      const attachments: Array<any> =
        replyPayload.inlineImgDetails.length > 0
          ? [...replyPayload.inlineImgDetails]
          : [];
      if (tktEmail.attachments.length > 0) {
        const attach = await this.formatToEmailAttachment(tktEmail.attachments);
        attachments.push(...attach);
      }
      const emailData: IEmailReplyPayload = {
        subject: tktEmail.subject,
        messageId: originalTicketEmail.messageId,
        body: replyPayload.emailHtml,
        templateName: 'reply-ticket',
        to: tktEmail.to,
        attachments: attachments,
      };
      await this.sendEmailSvc.sendReplyEmailNotification(emailData);
    } catch (error) {
      this.logger.error('Error: [sendReplyEmail]', error);
      throw error;
    }
  }

  private async sendForwardEmail(
    replyPayload: ITicketReplyData,
    subject: string
  ) {
    try {
      const emailData: IEmailPayload = {
        to: replyPayload.to,
        cc: replyPayload.cc,
        bcc: replyPayload.bcc,
        subject: subject,
        body: replyPayload.emailHtml,
        templateName: 'reply-ticket',
        attachments:
          replyPayload.inlineImgDetails.length > 0
            ? replyPayload.inlineImgDetails
            : [],
      };
      await this.sendEmailSvc.sendEmailNotification(emailData);
    } catch (error) {
      this.logger.error('Error: [sendForwardEmail]', error);
      throw error;
    }
  }

  private tranformToTickeEmail(
    ticket: ITicket,
    payload: ITicketReplyData,
    user: IUser
  ) {
    try {
      const ticketEmail: ITicketEmail = {
        ticketEmailType: payload.ticketEmailType,
        envID: Constants.ENV_ID,
        thread: payload._id ? ticket.threadCount : ticket.threadCount + 1,
        html: payload.content,
        text: payload.content,
        headers: {
          from: `${this.configSvc.get('EMAIL_USER_NAME')} <${this.configSvc.get(
            'WATCHER_EMAIL'
          )}>`,
          subject: ticket.subject,
          cc: '',
          date: new Date(),
          to: '',
        },
        subject: ticket.subject,
        originalSubject: ticket.subject,
        messageId: shortid.generate(),
        priority: 'medium',
        from: [
          {
            name: this.configSvc.get('EMAIL_USER_NAME'),
            address: this.configSvc.get('WATCHER_EMAIL'),
          },
        ],
        to: payload.to.map((e) => {
          return { address: e, name: ticket.contactName };
        }),
        cc:
          payload.cc.map((e) => {
            return { address: e, name: e.match(/^(.+)@/)[1] };
          }) || [],
        bcc:
          payload.bcc.map((e) => {
            return { address: e, name: e.match(/^(.+)@/)[1] };
          }) || [],
        date: new Date(),
        receivedDate: new Date(),
        uid: null,
        flags: null,
        attachments: payload.attachments,
        draft: payload.draft,
        senderName: user.firstName + ' ' + user.lastName,
        senderEmail: user.email,
        recipientName: ticket.contactName,
        recipientEmail: ticket.contactEmail,
      };
      return ticketEmail;
    } catch (error) {
      this.logger.error('Error: [tranformToTickeEmail]', error);
      throw error;
    }
  }

  private async formatToEmailAttachment(attachments: Array<IAttachment>) {
    try {
      const _att: Array<IEmailAttachment> = [];
      for (let i = 0; i < attachments.length; i++) {
        const filePath = await this.attachmentSvc.downloadFile(
          attachments[i]._id
        );
        _att.push({
          filename: attachments[i].name,
          contentType: attachments[i].contentType,
          path: filePath,
        });
      }
      return _att;
    } catch (error) {
      this.logger.error('Error: [formatToEmailAttachment]', error);
      throw error;
    }
  }

  public async loadAllTickets() {
    try {
      const allTickets: Array<ITicket> = await this.ticketModel
        .find({ isDeleted: false, envID: Constants.ENV_ID })
        .sort({ _id: -1 })
        .lean();
      return allTickets;
    } catch (error) {
      this.logger.error('Error: [loadAllTickets]', error);
      throw error;
    }
  }

  private tranformQueryToFilter(query: any) {
    try {
      const filter: any = {};
      if (query.search) {
        const srchNum = Number(query.search?.toString().trim());
        if (!isNaN(srchNum)) {
          filter['$or'] = [
            {
              ticketNumber: srchNum,
            },
            {
              $where: `/^${query.search
                .toString()
                .trim()}.*/.test(this.ticketNumber)`,
            },
            { subject: { $regex: query.search.toString(), $options: 'i' } },
          ];
        } else {
          filter.subject = { $regex: query.search.toString(), $options: 'i' };
        }
      } else {
        const _qFilters = [];
        Object.keys(query).forEach((key) => {
          if (key !== 'condition') {
            const obj: any = {};
            obj[key] = query[key];
            _qFilters.push(obj);
          }
        });
        if (_qFilters.length > 0) {
          if (query.condition === 'AND') {
            filter['$and'] = _qFilters;
          } else {
            filter['$or'] = _qFilters;
          }
        }
      }
      return filter;
    } catch (error) {
      this.logger.error('Error: [tranformQueryToFilter]', error);
      throw error;
    }
  }

  public async loadTicketsByFilters(query: any) {
    try {
      let filter: any = {
        isDeleted: false,
      };
      if (query) {
        const qFilter = this.tranformQueryToFilter(query);
        filter = { ...filter, ...qFilter };
      }

      const tkts: Array<ITicket> = await this.ticketModel
        .find(filter)
        .sort({ _id: -1 })
        .lean();
      return tkts;
    } catch (error) {
      this.logger.error('Error: [loadTicketsByFilters]', error);
      throw error;
    }
  }

  public async loadTicketEmailByThread(ticketId: string, thread: number) {
    try {
      if (!ticketId) return null;
      if (!this.sharedSvc.isValidObjectId(ticketId)) return null;
      const filter = {
        ticketObjId: new ObjectId(ticketId),
        isDeleted: false,
        thread: thread,
      };
      const ticket: ITicketEmail = await this.ticketEmailModel
        .findOne(filter)
        .lean();
      return ticket;
    } catch (error) {
      this.logger.error('Error: [loadTicketEmailByThread]', error);
      throw error;
    }
  }

  public async loadDraftTicketEmail(
    ticketId: string,
    ticketEmailType: TICKET_EMAIL_TYPE
  ) {
    try {
      if (!ticketId) return null;
      if (!this.sharedSvc.isValidObjectId(ticketId)) return null;
      const filter = {
        ticketObjId: new ObjectId(ticketId),
        isDeleted: false,
        draft: true,
        ticketEmailType: ticketEmailType,
      };
      const ticket: ITicketEmail = await this.ticketEmailModel
        .findOne(filter)
        .lean();
      return ticket;
    } catch (error) {
      this.logger.error('Error: [loadDraftTicketEmail]', error);
      throw error;
    }
  }

  public async loadDraftTicketEmailById(tktEmailId: string) {
    try {
      if (!tktEmailId) return null;
      if (!this.sharedSvc.isValidObjectId(tktEmailId)) return null;
      const filter = {
        _id: new ObjectId(tktEmailId),
        isDeleted: false,
        draft: true,
      };
      const ticket: ITicketEmail = await this.ticketEmailModel
        .findOne(filter)
        .lean();
      return ticket;
    } catch (error) {
      this.logger.error('Error: [loadDraftTicketEmailById]', error);
      throw error;
    }
  }

  public async loadTicketEmailThreads(ticketId: string) {
    try {
      const emailThreads: Array<ITicketEmail> = await this.ticketEmailModel
        .find({ ticketObjId: new ObjectId(ticketId), isDeleted: false })
        .sort({ thread: -1 })
        .lean();
      return emailThreads;
    } catch (error) {
      this.logger.error('Error: [loadTicketEmailThreads]', error);
      throw error;
    }
  }

  public async loadTicketById(ticketId: string) {
    try {
      const ticket: ITicket = await this.ticketModel
        .findOne({ _id: new ObjectId(ticketId), isDeleted: false })
        .lean();
      return ticket;
    } catch (error) {
      this.logger.error('Error: [loadTicketById]', error);
      throw error;
    }
  }
}
