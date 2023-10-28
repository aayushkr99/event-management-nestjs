import { Body, Controller, Get, Post, UnauthorizedException, BadRequestException} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';

export interface loginDto{
    email: string,
    password: string
}

@Controller('user')
export class UserController {
    constructor(private userService: UserService){}

    @Get()
    async getAllUsers(): Promise<User[]> {
        try{
        return await this.userService.getAllUsers();
        }catch(error){
            console.log(error)
            throw new Error(error)
        }
    }

    @Post()
    async createUser(@Body() body ): Promise<User>{
        try{
            const {userName, email,password} = body
            if(userName == undefined || userName == ""){
                throw new BadRequestException("userName is required");
            }
            if(email == undefined || email == ""){
                throw new BadRequestException("email is required");
            }
            if(password == undefined || password == ""){
                throw new BadRequestException("password is required");
            }
        return await this.userService.createUser(body);
        }catch(error){
            console.log(error)
            switch(error.message){
            case "userName is required":
                throw new BadRequestException("userName is required");
            case "email is required":
                throw new BadRequestException("email is required");
            case "password is required":
                throw new BadRequestException("password is required");
        }
        }
    }

    @Post('login')
    async login(@Body() login: loginDto): Promise<object>{
        try{
            const {email, password} = login
            if(email == undefined || email == ""){
                throw new BadRequestException("email is required");
            }
            if(password == undefined || password == ""){
                throw new BadRequestException("password is required");
            }
        return await this.userService.login(login)
        }catch(err){
            console.log(err)
            switch(err.message){
                case 'Invalid Email or Password':
                    throw new UnauthorizedException("Invalid Email or Password")
                case "email is required":
                    throw new BadRequestException("email is required");
                case "password is required":
                    throw new BadRequestException("password is required");
            }
        }
    }
}
