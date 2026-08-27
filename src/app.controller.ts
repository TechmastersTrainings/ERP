import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHomepage(@Res() res: Response): void {
    res.redirect('/index.html');
  }

  @Get('health')
  getHealth(): Promise<string> {
    return this.appService.getHello();
  }
}
