import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DbConfigService } from './db-config.service';

@Module({
  imports: [MongooseModule.forRootAsync({ useClass: DbConfigService })],
  exports: [MongooseModule],
})
export class DbConfigModule {}
