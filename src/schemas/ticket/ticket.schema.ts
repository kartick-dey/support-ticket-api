import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ENVIRONMENT_MODEL } from '../environment/environment.schema';
import { TICKET_EMAIL_MODEL } from '../ticket-email/ticket-email.schema';
import { Document } from 'mongoose';
import { Audit } from '../common';

@Schema({ timestamps: true, collection: 'ticket', strict: true })
export class Ticket extends Audit {
  /**
   * Ticket Information
   */
  @Prop({ type: String, ref: ENVIRONMENT_MODEL, required: true })
  envID: string;

  @Prop({ type: String, required: true, unique: true })
  ticketID: string;

  @Prop({ type: Number, required: true, unique: true })
  ticketNumber: number;

  @Prop({ type: String, default: null })
  ticketOwner: string;

  @Prop({ type: String, default: null })
  contactName: string;

  @Prop({ type: String, required: true })
  contactEmail: string;

  @Prop({ type: String, ref: TICKET_EMAIL_MODEL, required: true })
  subject: string;

  @Prop({ type: String, default: null })
  priority: string;

  @Prop({ type: String, default: null })
  resolution: string;

  @Prop({ type: Number, default: 1 })
  threadCount: number;

  // environment configuartion
  @Prop({ tyep: String, required: true, default: 'New' })
  status: string;

  /**
   * Additional Information
   */
  // environment configuartion
  @Prop({ type: String, default: null })
  classifications: string;

  // environment configuartion
  @Prop({ type: String, default: null })
  category: string;

  // environment configuartion
  @Prop({ type: String, default: null })
  subCategory: string;

  // environment configuartion
  @Prop({ type: String, default: null })
  sites: string;

  // environment configuartion
  @Prop({ type: String, default: null })
  company: string;

  // environment configuartion
  @Prop({ type: String, default: null })
  bugType: string;

  @Prop({ type: String, default: null })
  channel: string;

  @Prop({ type: String, default: null })
  technicalTeamAssistanceNeeded: string;

  @Prop({ type: String, deafult: null })
  description: string;

  @Prop({ type: Boolean, required: true, default: false })
  seen: boolean;

  @Prop({ type: Date, default: null })
  dueDate: Date;
}

export const TICKET_MODEL = Ticket.name;

export type TicketDocument = Ticket & Document;

const schema = SchemaFactory.createForClass(Ticket);

schema.index({ _id: 1, isDeleted: 1 }, { unique: true });
schema.index({ ticketID: 1, isDeleted: 1 }, { unique: true });
schema.index({ envID: 1, ticketID: 1, isDeleted: 1 }, { unique: true });
schema.index({ envID: 1, subject: 1, isDeleted: 1 }, { unique: true });
schema.index({ envID: 1 });

export const TicketSchema = schema;
