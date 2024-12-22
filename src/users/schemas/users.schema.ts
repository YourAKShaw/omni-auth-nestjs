import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';

export type UserDocument = User & Document;

// Define schema options with collation
const schemaOptions: SchemaOptions = {
  collation: { locale: 'en', strength: 2 },
};

@Schema(schemaOptions)
export class User {
  @Prop({
    required: false,
    unique: true,
    index: true,
  })
  email!: string;

  @Prop({
    required: false,
    unique: true,
    index: true,
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

  @Prop({ required: true })
  password!: string;
}

export const UsersSchema = SchemaFactory.createForClass(User);

// Create case-insensitive indexes
UsersSchema.index(
  { username: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);
UsersSchema.index(
  { email: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);
