import { Controller, Get, Query } from '@nestjs/common';
import { GstService } from './gst.service';

@Controller('gst')
export class GstController {
  constructor(private readonly gstService: GstService) {}

  @Get('summary')
  getGstSummary(@Query('companyId') companyId: string) {
    return this.gstService.getGstSummary(companyId);
  }

  @Get('gstr1')
  getGstr1Payload(@Query('companyId') companyId: string) {
    return this.gstService.getGstr1Payload(companyId);
  }

  @Get('gstr3b')
  getGstr3bPayload(@Query('companyId') companyId: string) {
    return this.gstService.getGstr3bPayload(companyId);
  }
}
