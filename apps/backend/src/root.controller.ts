import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller()
export class RootController {
  @Get()
  root() {
    return {
      service: 'Dutchy API',
      status: 'ok',
      health: '/api/health',
      hint: 'This URL is the API only. Deploy apps/frontend as a separate Railway service for the web UI.',
    };
  }
}
