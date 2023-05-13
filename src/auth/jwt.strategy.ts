import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IJwtUserData } from 'src/models';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authSvc: AuthService, private configSvc: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([JwtStrategy.extractJwt]),
      secretOrKey: configSvc.get('JWT_SECRET'),
    });
  }

  private static extractJwt(request: Request): string | null {
    if (request.cookies && 'token' in request.cookies) {
      return request.cookies.token;
    }
    return null;
  }

  async validate(payload: IJwtUserData) {
    console.log('User Information : ', payload);
    const userData = payload;
    const userInfo = await this.authSvc.getUserDetails(userData.email);
    if (!userInfo) {
      throw new UnauthorizedException(
        'Please login again. User session has expired'
      );
    }
    return userInfo;
  }
}
