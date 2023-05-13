import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class EnvConfiguration {
  @Prop({ type: Array<string> })
  status: string;

  @Prop({ type: Array<string> })
  classifications: string;

  @Prop({ type: Array<string> })
  category: string;

  @Prop({ type: Array<string> })
  subCategory: string;

  @Prop({ type: Array<string> })
  sites: string;

  @Prop({ type: Array<string> })
  company: string;

  @Prop({ type: Array<string> })
  bugType: string;
}

export const ENV_CONFIGIRATION_MODEL = EnvConfiguration.name;

export const EnvConfigurationSchema =
  SchemaFactory.createForClass(EnvConfiguration);
