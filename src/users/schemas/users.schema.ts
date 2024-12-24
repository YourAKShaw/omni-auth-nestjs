import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';

export type UserDocument = User & Document;

const schemaOptions: SchemaOptions = {
  collation: { locale: 'en', strength: 2 },
};

@Schema(schemaOptions)
export class User {
  @Prop({
    required: false,
    unique: true,
  })
  email!: string;

  @Prop({
    required: false,
    unique: true,
  })
  username!: string;

  @Prop({
    required: false,
  })
  countryCode!: number;

  @Prop({
    required: false,
  })
  phoneNumber!: number;

  @Prop({
    required: false,
  })
  whatsappCountryCode!: number;

  @Prop({
    required: false,
  })
  whatsappPhoneNumber!: number;

  @Prop({ required: true })
  password!: string;
}

export const UsersSchema = SchemaFactory.createForClass(User);
