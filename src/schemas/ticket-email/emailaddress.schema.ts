import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class EmailAddress {
    
    @Prop({type: String})
    address: string

    @Prop({type: String})
    name: string
}

export const EmailAddressSchema = SchemaFactory.createForClass(EmailAddress);
