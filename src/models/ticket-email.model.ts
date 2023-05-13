import { ObjectId } from 'bson';
import { IAttachment } from './attachment.model';

export interface ITicketEmail {
  _id?: any;
  ticketObjId?: ObjectId;
  envID?: string;
  isDeleted?: boolean;
  thread?: number;
  html: string;
  text: string;
  headers: IEmailHeader;
  subject: string;
  messageId: string;
  priority: string;
  from: Array<IEmailAddress>;
  to: Array<IEmailAddress>;
  cc?: Array<IEmailAddress>;
  bcc?: Array<IEmailAddress>;
  date: any;
  receivedDate: any;
  uid: string;
  flags: string;
  attachments?: Array<IAttachment>;
  ticketEmailType: TICKET_EMAIL_TYPE;
  draft: boolean,
  originalSubject?: string,
  senderName: string,
  senderEmail: string,
  recipientName: string,
  recipientEmail: string
}

export type TICKET_EMAIL_TYPE = 'Ticket' | 'Reply' | 'Forward'

interface IEmailHeader {
  from: string;
  date: any;
  subject: string;
  to: string;
  cc: string;
}

export interface IEmailAddress {
  address: string;
  name: string;
}

export interface ITicketReplyData {
  _id?: string | ObjectId;
  ticketId: string;
  from: Array<string>;
  to: Array<string>;
  cc: Array<string>;
  bcc: Array<string>;
  type: ReplyForward;
  content: string;
  attachments: Array<IAttachment>;
  draft: boolean,
  ticketEmailType: TICKET_EMAIL_TYPE,
  senderName: string,
  senderEmail: string,
  emailHtml: string,
  inlineImgDetails: Array<IInlineImg>
}

export interface IInlineImg {
  filename: string;
  content: any;
  contentType: string;
  cid: string;
  encoding: string;
  contentDisposition: string;
}

export type ReplyForward = 'reply' | 'replyAll' | 'forward';
