import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  async signUp(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.userService.signUp(username, password);
  }

  @Post('signin')
  async signIn(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.userService.signIn(username, password);
  }
}
