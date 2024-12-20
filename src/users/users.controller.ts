import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from '@src/users/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signUp(
    @Body('email') email: string,
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.usersService.signUp(email, username, password);
  }

  @Post('signin')
  async signIn(
    @Body('email') email: string,
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.usersService.signIn(email, username, password);
  }
}
