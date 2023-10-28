import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { type } from "os";

@Schema({ timestamps: true })
export class Event {
    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    date: Date;

    @Prop({ required: true })
    location: string;

    @Prop({ required: true })
    maxAttendees: number;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User'})
    creator: string;

    @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'User' })
    attendees: string[];

    @Prop({type: Boolean,default: false})
    isCancelled: boolean;

    @Prop()
    cancelledAt: Date;

    @Prop({type: Boolean,default: false})
    isEdited: boolean;

    @Prop()
    editedAt: Date;
}

export type EventDocument = Event & Document;
export const EventSchema = SchemaFactory.createForClass(Event);
