import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Audit {
  @Prop({ type: Date, required: true, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, required: true, default: Date.now })
  updatedAt: Date;

  @Prop({ type: String, required: true, default: 'SITE-ADMIN' })
  createdBy: string;

  @Prop({ type: String, required: true, default: 'SITE-ADMIN' })
  updatedBy: string;

  @Prop({ type: Boolean, required: true, default: false })
  isDeleted: string;
}

const schema = SchemaFactory.createForClass(Audit);
export const AuditSchema = schema;
