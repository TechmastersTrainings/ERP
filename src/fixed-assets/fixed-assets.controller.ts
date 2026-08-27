import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { FixedAssetsService } from './fixed-assets.service.js';

@Controller('fixed-assets')
export class FixedAssetsController {
  constructor(private readonly fixedAssetsService: FixedAssetsService) {}

  @Post()
  async createAsset(
    @Body()
    body: {
      companyId: string;
      assetName: string;
      assetCategory: string;
      purchaseCost: number;
      depreciationMethod?: 'WDV' | 'SLM';
      depreciationRate?: number;
    },
  ) {
    return this.fixedAssetsService.createAsset(body);
  }

  @Get()
  async getAssets(@Query('companyId') companyId: string) {
    return this.fixedAssetsService.getAssets(companyId || '');
  }

  @Post('depreciate')
  async runDepreciation(@Body() body: { companyId: string }) {
    return this.fixedAssetsService.runAnnualDepreciation(body.companyId);
  }
}
