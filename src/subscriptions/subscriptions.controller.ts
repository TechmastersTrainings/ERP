import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { SubscriptionsService, UpgradePlanDto } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  getSubscription(@Query('organizationId') organizationId: string) {
    return this.subscriptionsService.getSubscription(organizationId);
  }

  @Post('upgrade')
  upgradePlan(@Body() dto: UpgradePlanDto) {
    return this.subscriptionsService.upgradePlan(dto);
  }
}
