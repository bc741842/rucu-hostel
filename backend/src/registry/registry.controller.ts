import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RegistryService } from './registry.service';

class ImportRegistryDto {
  @IsString()
  @MinLength(10)
  @MaxLength(4_000_000)
  csv!: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('registry')
export class RegistryController {
  constructor(private readonly registryService: RegistryService) {}

  @Roles('super_admin', 'warden')
  @Get('summary')
  summary() {
    return this.registryService.summary();
  }

  @Roles('super_admin')
  @Post('import')
  importCsv(@Body() dto: ImportRegistryDto, @Req() req: any) {
    return this.registryService.importCsv(dto.csv, req.user.userId, req.ip);
  }
}
