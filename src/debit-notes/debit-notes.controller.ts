import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { DebitNotesService, CreateDebitNoteDto } from './debit-notes.service';

@Controller('debit-notes')
export class DebitNotesController {
  constructor(private readonly debitNotesService: DebitNotesService) {}

  @Post()
  create(@Body() dto: CreateDebitNoteDto) {
    return this.debitNotesService.create(dto);
  }

  @Get()
  findAll(@Query('companyId') companyId: string) {
    return this.debitNotesService.findAll(companyId);
  }
}
