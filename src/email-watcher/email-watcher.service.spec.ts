import { Test, TestingModule } from '@nestjs/testing';
import { EmailWatcherService } from './email-watcher.service';

describe('EmailWatcherService', () => {
  let service: EmailWatcherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailWatcherService],
    }).compile();

    service = module.get<EmailWatcherService>(EmailWatcherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
