import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, trim: true })
    userName: string;

    @Prop({ required: true, trim: true , unique: true})
    email: string;

    @Prop({ required: true,  trim: true  })
    password: string;

}

export type userDocument = User & Document;
export const userSchema = SchemaFactory.createForClass(User);