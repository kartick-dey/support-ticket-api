import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { NextFunction, Request, Response } from 'express';

import * as session from 'express-session';
import * as passport from 'passport';

import { json, urlencoded } from 'express';

async function bootstrap() {
  const port = process.env.SERVER_PORT || 3000;
  const app = await NestFactory.create(AppModule);

  // enabling cookie parser
  app.use(cookieParser());

  // setting response header
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Access-Control-Allow-Methods',
      'POST, PUT, OPTIONS, DELETE, GET'
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    next();
  });

  // enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // enable session
  app.use(
    session({
      secret: process.env.SECURITY_KEY,
      resave: false,
      saveUninitialized: false,
      name: process.env.SESSION_NAME,
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  // setting request payload size
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb' }));

  await app.listen(port);
}
bootstrap();
