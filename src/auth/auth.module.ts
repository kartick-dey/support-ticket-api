import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EmailSenderModule } from 'src/email-sender/email-sender.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { SessionSerializer } from './session.serializer';

@Module({
  imports: [
    EmailSenderModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: true }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configSvc: ConfigService) => {
        return {
          secret: configSvc.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: configSvc.get<string | number>('JWT_EXPIRES'),
          },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy, SessionSerializer],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
