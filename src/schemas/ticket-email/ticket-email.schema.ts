import { Schema, Prop, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { TICKET_EMAIL_TYPE, IAttachment, IEmailAddress } from 'src/models';
import { Audit } from '../common';

@Schema({
  timestamps: true,
  collection: 'ticket-email',
  strict: true,
})
export class TicketEmail extends Audit {
  @Prop({ type: String, required: true })
  envID: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  })
  ticketObjId: string;

  @Prop({ type: Number, required: true, default: 1 })
  thread: number;

  @Prop({ type: String, required: true })
  html: string;

  @Prop({ type: String, required: true })
  text: string;

  @Prop(raw({}))
  headers: any;

  @Prop({ type: String, required: true })
  subject: string;

  @Prop({ type: String, required: true })
  messageId: string;

  @Prop({ type: String, required: true })
  priority: string;

  @Prop({
    type: [{ address: String, name: String }],
    required: true,
    _id: false,
  })
  from: Array<IEmailAddress>;

  @Prop({
    type: [{ address: String, name: String }],
    required: true,
    _id: false,
  })
  to: Array<IEmailAddress>;

  @Prop({ type: [{ address: String, name: String }], _id: false })
  cc?: Array<IEmailAddress>;

  @Prop({ type: [{ address: String, name: String }], _id: false })
  bcc?: Array<IEmailAddress>;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: Date, required: true })
  receivedDate: Date;

  @Prop({ type: Number })
  uid: number;

  @Prop({ type: Array })
  flags: any[];

  @Prop({
    type: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId },
        name: String,
        contentType: String,
      },
    ],
  })
  attachments?: Array<IAttachment>;

  @Prop({ type: Boolean, required: true, default: false })
  draft: boolean;

  @Prop({ type: String, required: true, default: 'Ticket' })
  ticketEmailType: TICKET_EMAIL_TYPE;

  @Prop({ type: String, required: true })
  originalSubject: string;

  @Prop({ type: String })
  senderName: string;

  @Prop({ type: String })
  senderEmail: string;

  @Prop({ type: String })
  recipientName: string;

  @Prop({ type: String })
  recipientEmail: string;
}

export const TICKET_EMAIL_MODEL = TicketEmail.name;

export type TicketEmailDocument = TicketEmail & Document;

const schema = SchemaFactory.createForClass(TicketEmail);

schema.index(
  { envID: 1, subject: 1, isDeleted: 1, thread: 1, from: 1 },
  { unique: true }
);

schema.index({ subject: 1, isDeleted: 1, envID: 1 }); //ticketObjId
schema.index({ ticketObjId: 1, isDeleted: 1, envID: 1 });
schema.index({ ticketObjId: 1, isDeleted: 1 });
schema.index({ ticketObjId: 1, isDeleted: 1, thread: 1 });
schema.index({ ticketObjId: 1, isDeleted: 1, draft: 1, ticketEmailType: 1 });

export const TicketEmailSchema = schema;
