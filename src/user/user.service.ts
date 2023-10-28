import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import  mongoose from 'mongoose';
import * as bcrypt from "bcryptjs"
import { JwtService } from '@nestjs/jwt';
import { loginDto } from './user.controller';
import { ObjectId } from 'mongodb';

export type MyObjectId = ObjectId;
interface UserWithToken extends User {
    token: string;
  }

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: mongoose.Model<User>, private jwt: JwtService ){}

    async getAllUsers(): Promise<User[]>{
        return await this.userModel.find();
    }

    async createUser(user: User): Promise<User> {
        const {userName, email, password} = user
        const hashedPassword = await bcrypt.hash(password, 10)
        console.log("user" , user, {
            userName,email,password:hashedPassword
        } )
        const createdUser =  await this.userModel.create({
            userName,email,password : hashedPassword
        });

        const token = this.jwt.sign({id : createdUser._id})
        const userWithToken: UserWithToken = {
            ...createdUser.toObject(),
            token,
          };
      
          return userWithToken;
    }

    async findById(userid: string): Promise<User>{
        return await this.userModel.findById(userid)
    }

    async findOne(userid: MyObjectId): Promise<User>{
        return await this.userModel.findOne({_id: userid})
    }

    async login(login: loginDto): Promise<object>{
        const {email, password} = login
        const user = await this.userModel.findOne({email})
        if(!user){
            throw new UnauthorizedException("Invalid Email or Password")
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new UnauthorizedException("Invalid Email or Password");
        }
        const token = this.jwt.sign({id : user._id})
        return {token}
    }
}
