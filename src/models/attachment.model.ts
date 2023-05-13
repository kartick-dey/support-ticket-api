import { ObjectId } from 'bson';

export interface IAttachment {
  _id?: ObjectId;
  envID?: string;
  name: string;
  contentType: string;
  size?: number;
  location?: string;
  content?: any;
  contentDisposition: string;
  contentId: string;
}

export type CONTENT_DISPOSITION = 'inline' | 'attachment';
