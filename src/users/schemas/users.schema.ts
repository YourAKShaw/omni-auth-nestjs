import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: false, unique: true }) // Ensure email is required and unique
  email!: string;

  @Prop({ required: false, unique: true }) // Ensure username is unique
  username!: string;

  @Prop({ required: true })
  password!: string;
}

export const UsersSchema = SchemaFactory.createForClass(User);
