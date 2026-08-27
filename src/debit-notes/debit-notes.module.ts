import { Module } from '@nestjs/common';
import { DebitNotesService } from './debit-notes.service';
import { DebitNotesController } from './debit-notes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DebitNotesController],
  providers: [DebitNotesService],
  exports: [DebitNotesService],
})
export class DebitNotesModule {}
