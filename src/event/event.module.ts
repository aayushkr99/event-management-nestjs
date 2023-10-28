import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from './schemas/event.schema';
import { userSchema } from 'src/user/schemas/user.schema';
import { UserService } from 'src/user/user.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';


@Module({
  imports: [
    PassportModule.register({defaultStrategy: 'jwt'}),
    JwtModule.registerAsync({
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET'),
            signOptions: {
                expiresIn : configService.get<string | number>('JWT_EXPIRES')
            }
        })
    }),
    MongooseModule.forFeature([{name: "Event", schema: EventSchema},{name: "User", schema: userSchema} ]
  )],
  controllers: [EventController],
  providers: [EventService, UserService]
})
export class EventModule {}
