import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ICreateUser, IPasswordChange, IUser, IUserLogin } from 'src/models';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authSvc: AuthService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  public async createUser(
    @Body() user: ICreateUser,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log('Imcoming request to create a new user');
      const result = await this.authSvc.createUser(user);
      res.status(200).json({
        success: true,
        message: result,
      });
    } catch (error) {
      this.logger.error('Error; [createUser]', error);
      res.status(402).json({
        success: false,
        message: error.message || 'Failed to create new user',
      });
    }
  }

  @Post('login')
  public async login(
    @Body() user: IUserLogin,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log(`Incoming request to login user by email ${user.email}`);
      req.session.destroy(async (error) => {
        try {
          if (error) {
            this.logger.error(`Failed to destroy the OAuth session`, error);
          }
          const userInfo: IUser = await this.authSvc.validateAndFetchUser(
            user.email,
            user.password
          );
          const token = await this.authSvc.generateUserToken(userInfo);
          res.cookie('token', token, {
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict',
          });
          delete userInfo.password;
          res.status(200).json({
            success: true,
            user: userInfo,
            message: 'Login Successful',
          });
        } catch (error) {
          this.logger.error(
            `Error in authenticating user '${user.email}'. `,
            error
          );
          res.status(402).json({
            success: false,
            message: error.message || 'Failed to login',
          });
        }
      });
    } catch (error) {
      this.logger.error(
        `Error in authenticating user '${user.email}'. `,
        error
      );
      res.status(402).json({
        success: false,
        message: error.message || 'Failed to login',
      });
    }
  }

  /**
   * returning authenticated user details
   * @param req
   * @param res
   */
  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  public async loadLoggedInUser(@Req() req: Request, @Res() res: Response) {
    try {
      this.logger.log(`Incoming request to load logged in user`);
      const user = await this.authSvc.getUserDetails(req?.user['email']);
      res.status(200).json({
        success: true,
        user: user,
      });
    } catch (error) {
      this.logger.error(`Error: [loadLoggedInUser] `, error);
      res.status(402).json({
        success: false,
        message: error.message || 'Failed to fetch logged in user details',
      });
    }
  }

  // load/all/users

  @Get('load/all/users')
  @UseGuards(AuthGuard('jwt'))
  public async loadAllUsers(@Req() req: Request, @Res() res: Response) {
    try {
      this.logger.log(`Incoming request to load all users`);
      const users = await this.authSvc.loadAllUsers();
      res.status(200).json({
        success: true,
        users: users,
      });
    } catch (error) {
      this.logger.error(`Error: [loadAllUsers] `, error);
      res.status(402).json({
        success: false,
        message: error.message || 'Failed to load all users',
      });
    }
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  public async changePassword(
    @Body() pwdInfo: IPasswordChange,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log(
        `Incoming request to chnage password for ${req.user['fullName']}(${req.user['email']})`
      );
      const result: string = await this.authSvc.changePassword(
        req?.user['email'],
        pwdInfo
      );
      res.clearCookie('token');
      res.status(200).json({
        success: true,
        message: result,
      });
    } catch (error) {
      this.logger.error(`Error: [changePassword] `, error);
      res.status(402).json({
        success: false,
        message: error.message || 'Failed to change password',
      });
    }
  }

  @Post('password-reset')
  public async passwordReset(
    @Body() body: { email: string },
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log(
        `Incoming request to reset password for email account (${body.email})`
      );
      const result: string = await this.authSvc.passwordReset(body.email);
      res.status(200).json({
        success: true,
        message: result,
      });
    } catch (error) {
      this.logger.error(`Error: [passwordReset] `, error);
      res.status(402).json({
        success: false,
        message: error.message || 'Failed to reset password',
      });
    }
  }

  @Put('update/:email')
  @UseGuards(AuthGuard('jwt'))
  public async updateUserDetails(
    @Body() body: any,
    @Param('email') email: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log(
        `Incoming request to update details for email account (${email.toString()})`
      );
      const result = await this.authSvc.updateUserDetails(email, body);
      res.status(200).json({
        success: true,
        message: result,
      });
    } catch (error) {
      this.logger.error('Error: [updateUserDetails]', error);
      res.status(402).json({
        success: false,
        message: error.message || 'Failed to update user details',
      });
    }
  }

  @Delete('delete/:email')
  @UseGuards(AuthGuard('jwt'))
  public async deleteUser(
    @Param('email') email: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log(
        `Incoming request to delete account for (${email.toString()})`
      );
      const result = await this.authSvc.deleteUser(email);
      res.status(200).json({
        success: true,
        message: result,
      });
    } catch (error) {
      this.logger.error('Error: [deleteUser]', error);
      res.status(402).json({
        success: false,
        message: error.message || 'Failed to delete user',
      });
    }
  }

  @Get('logout')
  public logout(@Req() req: Request, @Res() res: Response) {
    try {
      req.session.destroy((error) => {
        if (error) {
          return this.logger.error('Failed to destroy the session', error);
        }
        res.clearCookie('token');
        res.status(200).json({
          success: true,
          message: 'Successfully logged out',
        });
      });
    } catch (error) {
      this.logger.error(`Error: [logout] `, error);
      res.status(402).json({
        success: false,
        message: error.message || 'Failed to logout',
      });
    }
  }

  @Post('reset/password/by/admin')
  @UseGuards(AuthGuard('jwt'))
  public async passwordResetByAdmin(
    @Body() body: { email: string },
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log(
        `Incoming request to reset password for email account (${body.email}) by admin`
      );
      const pwd: string = await this.authSvc.passwordReset(body.email, true);
      res.status(200).json({
        success: true,
        password: pwd,
      });
    } catch (error) {
      this.logger.error(`Error: [passwordResetByAdmin] `, error);
      res.status(402).json({
        success: false,
        message: error.message || 'Failed to reset password by admin',
      });
    }
  }
}
