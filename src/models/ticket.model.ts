import { ObjectId } from 'bson';

export interface ITicket {
  _id?: ObjectId;
  envID: string;
  ticketID: string;
  ticketNumber: number;
  ticketOwner: string;
  contactName: string;
  contactEmail: string;
  subject: string;
  priority?: string;
  resolution?: string;
  threadCount: number;
  status: string;
  classifications?: string;
  category?: string;
  subCategory?: string;
  sites?: string;
  company?: string;
  bugType?: string;
  channel: string;
  technicalTeamAssistanceNeeded?: string;
  description?: string;
  seen: boolean;
  dueDate?: Date
}
