import { Body, Controller, Get,Post, Param , Patch, NotFoundException, Query, BadRequestException, UnauthorizedException, Res, Headers,
    HttpException,HttpStatus} from '@nestjs/common';
import { EventService } from './event.service';
import { Event } from './schemas/event.schema';
import { Response } from 'express';
import * as createCsvWriter from 'csv-writer';
import * as fs from 'fs';


export class eventBody {
    title: string;
    description: string;
    date: Date;
    location: string;
    maxAttendees: number;
  }

export class EventSearch {
    keywords: string; 
    date: Date;
    location: string; 
  }
  
export  interface Attendee {
    name: string;
    email: string;
  }
   
@Controller('event')
export class EventController {
    constructor(private eventService: EventService){}

    @Get()
    async getAllEvents(): Promise<Event[]>{
        return this.eventService.getAllEvents();
    }

    @Post()
    async createEvent(@Body() event, @Headers('authorization') authorization: string): Promise<Event>{
        try{
        // token Validate
        if (!authorization || !authorization.startsWith('Bearer ')) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
          }
        const {title, description, date, location} = event
         if(title == undefined || title == ""){
            throw new BadRequestException("Title is required");
         }
         if(description == undefined || description == ""){
            throw new BadRequestException("description is required");
         }
         if(date == undefined || date == ""){
            throw new BadRequestException("date is required");
         }
         if(location == undefined || location == ""){
            throw new BadRequestException("location is required");
         }
          const token = authorization.substring(7);
          console.log('Bearer token:', token);
          
        return this.eventService.createEvent(event, token)
        }catch(error){
            switch(error.message){
                case "Title is required":
                    throw new BadRequestException("Title is required");
                case "description is required":
                    throw new BadRequestException("description is required");
                case "date is required":
                    throw new BadRequestException("date is required");
                case "location is required":
                    throw new BadRequestException("location is required");
                case 'Unauthorized':
                    throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
                case 'User Not Found, Kindly Register as a User..':
                    throw new NotFoundException("User Not Found, Kindly Register as a User..")
                case 'UnAuthenticated user':
                    throw new UnauthorizedException("UnAuthenticated user")
            }
        }
    }

    @Post('/register/:eventid')
    async registerToEvent(@Param('eventid') eventid: string, @Headers('authorization') authorization: string): Promise<object> {
        try{
            // token Validate
        if (!authorization || !authorization.startsWith('Bearer ')) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
          }
          const token = authorization.substring(7);
          console.log('Bearer token:', token);
        return this.eventService.registerToEvent(eventid, token)
        }catch(error){
            switch(error.message){
                case 'Unauthorized':
                    throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
                case 'UnAuthenticated user':
                    throw new UnauthorizedException("UnAuthenticated user")
                case 'Event not found':
                    throw new NotFoundException('Event not found');
                case 'Invalid token':
                    throw new BadRequestException('Invalid Token');
            }
        }
    }

    @Patch('/cancel/:eventid')
    async cancelEvent(@Param('eventid') eventid: string, @Headers('authorization') authorization: string): Promise<object> {
    try { 
        if (!authorization || !authorization.startsWith('Bearer ')) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
          }
          const token = authorization.substring(7);
          console.log('Bearer token:', token);
        const event = await this.eventService.cancelEvent(eventid, token);
        return event
    } catch (error) {
        console.log(error.message)
        switch(error.message){
            case 'Unauthorized':
                    throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            case 'UnAuthenticated user':
                throw new UnauthorizedException("UnAuthenticated user")
            case 'Event not found':
                throw new NotFoundException('Event not found');
            case 'Invalid token':
                throw new BadRequestException('Invalid token');
            case "You are not authorised to perform this action":
                throw new UnauthorizedException("You are not authorised to perform this action");
        }
    }
    }


    @Patch('/edit/:eventid')
    async editEvent( @Param("eventid") eventid : string ,@Body() events: eventBody, @Headers('authorization') authorization: string ): Promise<object> {
    try {
        if (!authorization || !authorization.startsWith('Bearer ')) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
          }
          const token = authorization.substring(7);
          console.log('Bearer token:', token);
        const event = await this.eventService.editEvent(token, eventid, events);
        return event;
    } catch (error) {
        console.log(error.message)
        switch(error.message){
            case 'Unauthorized':
                    throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            case 'UnAuthenticated user':
                throw new UnauthorizedException("UnAuthenticated user")
            case 'Event not found':
                throw new NotFoundException('Event not found');
            case 'Invalid Token, User Not found':
                throw new BadRequestException('Invalid Token, User Not found');
            case "You are not authorised to perform this action":
                throw new UnauthorizedException("You are not authorised to perform this action");
        }
    }
    }

    @Get('/search')
    async searchEvents(@Query() search: EventSearch):  Promise<object>  {
        try{
        return await this.eventService.searchEvents(search)
        }catch(err){
            console.log(err)
            throw new NotFoundException(err.message)
        }
    }

    @Get('/:eventid/attendees')
    async listOfAttendees(@Param('eventid') eventid: string, @Res() res: Response, @Headers('authorization') authorization: string ) {
    try {
        if (!authorization || !authorization.startsWith('Bearer ')) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
          }
          const token = authorization.substring(7);
          console.log('Bearer token:', token);
        const result: Attendee[] = await this.eventService.listOfAttendees(eventid, token);

        const csvWriter = createCsvWriter.createObjectCsvWriter({
        path: 'attendee_list.csv',
        header: [
            { id: 'name', title: 'Name' },
            { id: 'email', title: 'Email' },
        ],
        });

        const csvData = result.map((x) => ({
        name: x.name,
        email: x.email,
        }));

        csvWriter.writeRecords(csvData).then(() => {
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename=attendee_list.csv');
        res.download('attendee_list.csv', 'attendee_list.csv', (err) => {
            if (err) {
            res.status(500).json({ message: 'Error downloading CSV' });
            }else {
                fs.unlink('attendee_list.csv', (deleteError) => {
                  if (deleteError) {
                    console.error('Error deleting CSV file:', deleteError);
                  }
                });
              }
        });
        });
    } catch (err) {
        switch(err.message){
            case 'Unauthorized':
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            case 'UnAuthenticated user':
                throw new UnauthorizedException("UnAuthenticated user")
            case 'Not allowed to download the list':
                throw new UnauthorizedException("Creator of an event is allowed to download the list")
        }
    }
    }


    @Patch('/user/cancel/:eventid')
    async cancelUserEvent(@Headers('authorization') authorization: string ,@Param('eventid') eventid: string): Promise<object> {
    try { 
        if (!authorization || !authorization.startsWith('Bearer ')) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
          }
          const token = authorization.substring(7);
          console.log('Bearer token:', token);
        const event = await this.eventService.cancelUserEvent(eventid, token);
        return event
    } catch (error) {
        switch(error.message){
            case 'Unauthorized':
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            case 'UnAuthenticated user':
                throw new UnauthorizedException("UnAuthenticated user")
            case 'Event not found':
                throw new NotFoundException('Event not found');
            case 'User Not Found':
                throw new NotFoundException("User Not Found")
        }
    }
    }

    @Get('/userprofile/:userid')
    async getUserProfiles(@Headers('authorization') authorization: string ): Promise<object>{
        try{
            if (!authorization || !authorization.startsWith('Bearer ')) {
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
              }
              const token = authorization.substring(7);
              console.log('Bearer token:', token);
        return await this.eventService.getUserProfiles(token)
        }catch(err){
            switch(err.message){
                case 'Unauthorized':
                    throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
                case 'UnAuthenticated user':
                    throw new UnauthorizedException("UnAuthenticated user")
            }
        }
    }



}
