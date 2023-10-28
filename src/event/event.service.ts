import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Event } from './schemas/event.schema';
import { User } from 'src/user/schemas/user.schema';

import {eventBody, EventSearch, Attendee} from './event.controller'
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as mongoose from 'mongoose';

interface DecodedToken {
  id: string;
  iat: Date;
  exp: Date
}


@Injectable()
export class EventService {
    constructor(
        @InjectModel(Event.name)
        private eventModel: mongoose.Model<Event>,
        // @InjectModel(User.name)
        private userModel: UserService,
        //  mongoose.Model<User>
        private jwt: JwtService
    ){}

    async getAllEvents(): Promise<Event[]>{
        return await this.eventModel.find({isCancelled: false});
    }

    async createEvent(event: Event, token: string): Promise<Event> {
      // validate user
      // validate token 
      const decodedToken: DecodedToken = this.jwt.decode(token) as DecodedToken

      console.log('Decoded token:', decodedToken, decodedToken.id );
      if(!decodedToken){
        throw new UnauthorizedException("UnAuthenticated user")
      }
      const validateUser = await this.userModel.findById(decodedToken.id)
      console.log("validateUser", validateUser)
      if (!validateUser){
        throw new NotFoundException("User Not Found, Kindly Register as a User..")
      }
      event.creator = decodedToken.id
        return await this.eventModel.create(event);
    }

    async registerToEvent( eventid: string, token: string): Promise<object>{

      const decodedToken: DecodedToken = this.jwt.decode(token) as DecodedToken

      console.log('Decoded token:', decodedToken, decodedToken.id );
      if(!decodedToken){
        throw new UnauthorizedException("UnAuthenticated user")
      }
        const event = await this.eventModel.findOne({_id:eventid, isCancelled: false} );
        if (!event) {
          throw new NotFoundException('Event not found')
          }
        const user = await this.userModel.findById( decodedToken.id )
        if(!user){
          throw new NotFoundException("Invalid Token")
        }
        if(event.attendees.includes(decodedToken.id)){
          // throw new Error('Already registered for the event.')
          return {msg: 'Already registered for the event.' }
        }
          if (event.attendees.length < event.maxAttendees) {
            event.attendees.push(decodedToken.id);
            await event.save();
            return event
          } else {
            return { msg: 'Event is full' };
          }
    }

    async cancelEvent(eventId: string, token:string): Promise<object> {

      const decodedToken: DecodedToken = this.jwt.decode(token) as DecodedToken

      console.log('Decoded token:', decodedToken, decodedToken.id );
      if(!decodedToken){
        throw new UnauthorizedException("UnAuthenticated user")
      }
        const event = await this.eventModel.findOne({_id:eventId, isCancelled: false});
        console.log("event value in cancelEvent", event,)
        if (!event) {
          throw new NotFoundException('Event not found');
        }
        const user = await this.userModel.findById(decodedToken.id)
        console.log("user value in cancelEvent", user)
        if(!user){
          throw new BadRequestException('Invalid token')
        }

        console.log(event.creator !== decodedToken.id)
        if(event.creator != decodedToken.id){
          throw new UnauthorizedException("You are not authorised to perform this action");
        }
      
        event.isCancelled = true;
        event.cancelledAt = new Date();
        await event.save();
        return event
      }


    async editEvent(token:string, eventId: string, events: eventBody): Promise<object>{

      const decodedToken: DecodedToken = this.jwt.decode(token) as DecodedToken

      console.log('Decoded token:', decodedToken, decodedToken.id );
      if(!decodedToken){
        throw new UnauthorizedException("UnAuthenticated user")
      }

        const event = await this.eventModel.findOne({_id:eventId, isCancelled: false});
        console.log(event)
        if (!event) {
          throw new NotFoundException('Event not found');
        }
        const user = await this.userModel.findById( decodedToken.id )
        console.log(user)
        if(!user){
            throw new BadRequestException('Invalid Token, User Not found')
        }

        console.log(event.creator !==  decodedToken.id )
        if(event.creator !=  decodedToken.id ){
            throw new UnauthorizedException("You are not authorised to perform this action");
        }

        event.title = events.title;
        event.description = events.description;
        event.date= events.date
        event.location = events.location
        event.maxAttendees = events.maxAttendees

        event.isEdited = true;
        event.editedAt = new Date();

        await event.save();
        return event

    }

    async searchEvents(search: EventSearch) : Promise<object>{
        const query: any = {
            isCancelled: false
        }; 

        if (search.keywords) {
        query.$or = [
            { title: { $regex: search.keywords, $options: 'i' } },
            // { description: { $regex: search.keywords, $options: 'i' } },
        ];
        }

        if (search.date) {
            const inputDate = new Date(search.date);
            const isoString = inputDate.toISOString();
            console.log(isoString);

        query.date = isoString;
        }

        if (search.location) {
        query.location = search.location;
        }

        const events = await this.eventModel.find(query);

        return events;

    }


    async listOfAttendees(eventid: string, token: string): Promise<Attendee[]> {

      const decodedToken: DecodedToken = this.jwt.decode(token) as DecodedToken

      console.log('Decoded token:', decodedToken, decodedToken.id );
      if(!decodedToken){
        throw new UnauthorizedException("UnAuthenticated user")
      }

      
      const data: Attendee[] = [];
      const attendeeList = await this.eventModel.findOne({ _id: eventid, isCancelled: false });
      // check for creator
      if(attendeeList.creator != decodedToken.id){
        throw new UnauthorizedException("Not allowed to download the list")
      }
      
        for (let id of attendeeList.attendees) {
          const userData = await this.userModel
            .findById(id)
            // .select({_id: 1, userName: 1, email: 1})
            // .exec(); // Add .exec() to execute the query
      
          if (userData) {
            data.push({name: userData.userName, email: userData.email});
            // data.push(userData)
          }
        }
      
        return data;
      }
      
      async cancelUserEvent(eventId: string, token:string): Promise<object> {
        const decodedToken: DecodedToken = this.jwt.decode(token) as DecodedToken

      console.log('Decoded token:', decodedToken, decodedToken.id );
      if(!decodedToken){
        throw new UnauthorizedException("UnAuthenticated user")
      }
        const event = await this.eventModel.findOne({_id:eventId, isCancelled: false});
        console.log(event)
        if (!event) {
          throw new NotFoundException('Event not found')
        }
        const user = await this.userModel.findById(decodedToken.id)
        console.log(user)
        if(!user){
          throw new NotFoundException("User Not Found")
        }
        const index = event.attendees.indexOf(decodedToken.id)
        if(index >= 0){
            event.attendees.splice(index, 1);
            await event.save();
            return event
        }
        return {msg : 'Your ticket has been successfully canceled for this event.'}
      }

      
    async getUserProfiles(token: string): Promise<object>{
      const decodedToken: DecodedToken = this.jwt.decode(token) as DecodedToken

      console.log('Decoded token:', decodedToken, decodedToken.id );
      if(!decodedToken){
        throw new UnauthorizedException("UnAuthenticated user")
      }
        const result = {
            eventCreated : [],
            eventJoined : []
        }
        const creator = await this.eventModel.find({creator: decodedToken.id}).select("title location date");
        if(creator && Array.isArray(creator)){
            result.eventCreated = [...creator]
        }
        const joined = await this.eventModel.find({ attendees: { $in: [decodedToken.id] } }).select("title location date");
        if(joined && Array.isArray(joined)) {
            result.eventJoined = [...joined];
        }
        return result

    }
    
}
