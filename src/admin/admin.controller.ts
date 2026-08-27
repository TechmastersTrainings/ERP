import { Controller, Get, Post, Param } from '@nestjs/common';
import { AdminService } from './admin.service.js';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('pending-approvals')
  async getPending() {
    return this.adminService.getPendingRegistrations();
  }

  @Post('approve-tenant/:id')
  async approve(@Param('id') id: string) {
    return this.adminService.approveTenant(id);
  }
}
