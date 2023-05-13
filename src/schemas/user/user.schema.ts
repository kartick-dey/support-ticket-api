import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Audit } from '../common';

@Schema()
class User extends Audit {
  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: Boolean, default: true, required: true })
  active: boolean;

  @Prop({ type: String, default: 'User', required: true})
  role: string
}

export const USER_MODEL = User.name;

export type UserDocument = User & Document;

const schema = SchemaFactory.createForClass(User);

export const UserSchema = schema;
