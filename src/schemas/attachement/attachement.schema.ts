import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {Document} from 'mongoose'
import { Audit } from '../common';

@Schema({ timestamps: true })
class Attachement extends Audit {

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  location: string;

  @Prop({ type: String, required: true })
  contentType: string;

  @Prop({ type: Number, required: true })
  size: number;

  @Prop({type: String, required: true, default: 'attachment'})
  contentDisposition: string

  @Prop({type: String, required: true})
  contentId: string
}

export const ATTACHEMENT_MODEL = Attachement.name;

export type AttachementDocument = Attachement & Document

const schema = SchemaFactory.createForClass(Attachement);

schema.index({});

export const AttachementSchema = schema;
