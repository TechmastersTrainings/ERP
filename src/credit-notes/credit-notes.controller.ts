import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import {
  CreditNotesService,
  CreateCreditNoteDto,
} from './credit-notes.service';

@Controller('credit-notes')
export class CreditNotesController {
  constructor(private readonly creditNotesService: CreditNotesService) {}

  @Post()
  create(@Body() dto: CreateCreditNoteDto) {
    return this.creditNotesService.create(dto);
  }

  @Get()
  findAll(@Query('companyId') companyId: string) {
    return this.creditNotesService.findAll(companyId);
  }
}
