import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IEnvConfiguration } from 'src/models';
import { Audit } from '../common';
import { EnvConfiguration } from './configuration.schema';

@Schema({ timestamps: true, collection: 'environment', strict: true })
class Environment extends Audit {
  @Prop({ type: String, required: true, unique: true })
  envID: string;

  @Prop({ tyep: String, required: true })
  name: string;

  @Prop({ tyep: String, required: true })
  url: string;

  @Prop({ tyep: String, required: true })
  email: string;

  @Prop({ tyep: String, required: true })
  phone: string;

  @Prop({type: EnvConfiguration})
  configuration: IEnvConfiguration
}

export const ENVIRONMENT_MODEL = Environment.name;

export const EnvironmentSchema = SchemaFactory.createForClass(Environment);
