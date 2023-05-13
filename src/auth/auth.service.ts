import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EmailSenderService,
  IEmailPayload,
} from 'src/email-sender/email-sender.service';
import { ICreateUser, IJwtUserData, IPasswordChange, IUser } from 'src/models';
import { UserDocument, USER_MODEL } from 'src/schemas/user';
import * as bcrypt from 'bcryptjs';
import * as shortid from 'shortid';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectModel(USER_MODEL) private readonly userModel: Model<UserDocument>,
    private sendEmailSvc: EmailSenderService,
    private jwt: JwtService,
    private configSvc: ConfigService
  ) {}

  public async createUser(user: ICreateUser): Promise<string> {
    try {
      if (!user.firstName || !user.lastName) {
        throw new Error(`First and last name can't be empty`);
      } else {
        user.firstName = user.firstName.trim();
        user.lastName = user.lastName.trim();
      }
      if (!user.email) {
        throw new Error(`Email can't be empty`);
      } else {
        if (!this.validEmail(user.email)) {
          throw new Error(`Invalid email address '${user.email}'`);
        } else {
          user.email = user.email.trim().toLowerCase();
        }
      }
      const existingUser = await this.userModel
        .findOne({ email: user.email })
        .lean();
      if (existingUser) {
        throw new Error('User is already present');
      }

      const { password, hashPwd } = await this.genPassword();
      user.password = hashPwd;
      const newUser = await this.userModel.create(user);
      this.logger.log(`User has beed created with email ${user.email}`);
      const fullName = `${newUser.firstName} ${newUser.lastName} `;
      await this.sendUserAccountEmail(
        newUser.email,
        fullName,
        password,
        'Welcome to Ticket Service',
        'new-user-email'
      );
      return 'New user has been created successfully';
    } catch (error) {
      this.logger.error('Error: [createUser]', error);
      throw error;
    }
  }

  private async sendUserAccountEmail(
    email: string,
    fullName: string,
    pwd: string,
    subj: string,
    templateName: string
  ): Promise<void> {
    try {
      const emailPayload: IEmailPayload = {
        subject: subj,
        templateName: templateName,
        to: email,
        body: {
          name: fullName,
          email: email,
          password: pwd,
        },
      };
      await this.sendEmailSvc.sendEmailNotification(emailPayload);
    } catch (error) {
      this.logger.error('Error: [sendUserAccountEmail]', error);
      throw error;
    }
  }

  private validEmail(email: string): boolean {
    try {
      const emailPattern =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return emailPattern.test(email?.trim());
    } catch (error) {
      this.logger.error('Error: [validEmail]', error);
      throw error;
    }
  }

  private async genPassword(
    pwd?: string
  ): Promise<{ password: string; hashPwd: string }> {
    try {
      const password = pwd ? pwd : shortid.generate();
      const salt = await bcrypt.genSalt(10);
      const hashPwd = await bcrypt.hash(password, salt);
      return { password, hashPwd };
    } catch (error) {
      this.logger.error('Error: [genPassword]', error);
      throw error;
    }
  }

  private async findUser(email: string): Promise<IUser> {
    try {
      return await this.userModel
        .findOne({ email: email, isDeleted: false })
        .lean();
    } catch (error) {
      this.logger.error('Error: [findUser]', error);
      throw error;
    }
  }

  public async getUserDetails(email: string): Promise<IUser> {
    try {
      const user = await this.findUser(email);
      delete user.password;
      return user;
    } catch (error) {
      this.logger.error('Error: [getUserDetails]', error);
      throw error;
    }
  }

  private async compareUserPassword(
    pwd: string,
    hashPwd: string
  ): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(pwd, hashPwd);
      if (isMatch) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      throw err;
    }
  }

  public async validateAndFetchUser(
    email: string,
    pwd: string
  ): Promise<IUser> {
    try {
      const user: IUser = await this.findUser(email.trim().toLowerCase());
      if (!user) {
        throw new Error(
          `There isn't an account for this username. Please register!`
        );
      }
      if (user.active === false) {
        throw new Error(
          'Your account is inactive. Please contact administrator.'
        );
      }
      const isMatch = await this.compareUserPassword(pwd, user.password);
      if (!isMatch) {
        throw new Error('Please enter valid username and password!');
      }
      return user;
    } catch (error) {
      this.logger.error('Error: [validateAndFetchUser]', error);
      throw error;
    }
  }

  public async generateUserToken(user: IUser): Promise<string> {
    try {
      const userData: IJwtUserData = {
        id: user._id.toString(),
        email: user.email,
        fullName: user.firstName + ' ' + user.lastName,
      };
      const token = this.jwt.signAsync(userData, {
        secret: this.configSvc.get('JWT_SECRET'),
      });
      return token;
    } catch (error) {
      this.logger.error('Error: [generateUserToken]', error);
      throw error;
    }
  }

  public async changePassword(
    email: string,
    changePwd: IPasswordChange
  ): Promise<string> {
    try {
      const user = await this.findUser(email);
      const isMatch = await this.compareUserPassword(
        changePwd.oldPassword,
        user.password
      );
      if (!isMatch) {
        throw new Error('Invalid old password!');
      }
      const { password, hashPwd } = await this.genPassword(
        changePwd.newPassword
      );
      await this.userModel.updateOne(
        { email: email },
        { $set: { password: hashPwd } }
      );
      const fullName = `${user.firstName} ${user.lastName} `;
      await this.sendUserAccountEmail(
        user.email,
        fullName,
        password,
        'Change Password',
        'change-password'
      );
      return 'Your password has been changed successfully';
    } catch (error) {
      this.logger.error('Error: [changePassword]', error);
      throw error;
    }
  }

  public async passwordReset(email: string, byAdmin = false): Promise<string> {
    try {
      const user = await this.findUser(email);
      if (!user) {
        throw new Error(
          `There isn't an account for this email to reset password`
        );
      }
      const { password, hashPwd } = await this.genPassword();
      await this.userModel.updateOne(
        { email: email },
        { $set: { password: hashPwd } }
      );
      const fullName = `${user.firstName} ${user.lastName} `;
      await this.sendUserAccountEmail(
        user.email,
        fullName,
        password,
        'Password Reset Email',
        'change-password'
      );
      return byAdmin
        ? password
        : 'Your password has been send to your register email';
    } catch (error) {
      this.logger.error('Error: [passwordReset]', error);
      throw error;
    }
  }

  public async loadAllUsers(): Promise<Array<IUser>> {
    try {
      const projection = {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        active: 1,
        role: 1,
      };
      const allUser = await this.userModel
        .find({ isDeleted: false }, projection)
        .lean();
      return allUser;
    } catch (error) {
      this.logger.error('Error: [loadAllUsers]', error);
      throw error;
    }
  }

  public async updateUserDetails(email: string, data: any): Promise<string> {
    try {
      if (!email) {
        throw new Error('Invalid user email to update user details');
      }
      const update = await this.userModel.updateOne(
        { email: email },
        { $set: data }
      );
      this.logger.log('Modified Count : ', update.modifiedCount);
      return 'User details has been updated successfully';
    } catch (error) {
      this.logger.error('Error: [updateUserDetails]', error);
      throw error;
    }
  }

  public async deleteUser(email: string) {
    try {
      await this.userModel.deleteOne({ email: email });
      return 'User has been deleted successfull';
    } catch (error) {
      this.logger.error('Error: [deleteUser]', error);
      throw error;
    }
  }
}
