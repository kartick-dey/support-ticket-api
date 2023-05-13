import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttachementSchema, ATTACHEMENT_MODEL } from 'src/schemas/attachement';
import { EnvironmentSchema, ENVIRONMENT_MODEL } from 'src/schemas/environment';
import { TicketSchema, TICKET_MODEL } from 'src/schemas/ticket';
import {
  TicketEmailSchema,
  TICKET_EMAIL_MODEL,
} from 'src/schemas/ticket-email';
import { UserSchema, USER_MODEL } from 'src/schemas/user';

const MODELS = [
  { name: TICKET_EMAIL_MODEL, schema: TicketEmailSchema },
  { name: TICKET_MODEL, schema: TicketSchema },
  { name: ENVIRONMENT_MODEL, schema: EnvironmentSchema },
  { name: ATTACHEMENT_MODEL, schema: AttachementSchema },
  { name: USER_MODEL, schema: UserSchema },
];

@Global()
@Module({
  imports: [MongooseModule.forFeature(MODELS)],
  exports: [MongooseModule],
})
export class DatabaseModuleModule {}
