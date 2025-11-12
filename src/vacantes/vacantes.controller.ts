import { Controller, Post, Body, Get, Query, Patch, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { VacantesService } from './vacantes.service';
import { CreateVacanteDto } from './dto/create-vacante.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiCookieAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UpdateVacanteDto } from './dto/update-vacante.dto';
import { AdminReclutadorOrSuperAdminGuard, RolesPermitidosGuard } from '../common/guards/superadmin.guard';

@ApiTags('vacantes')
@Controller('vacantes')
export class VacantesController {
  constructor(private readonly vacantes: VacantesService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Crear vacante (requiere tenantSlug y cargoId)' })
  @ApiBody({ type: CreateVacanteDto })
  create(@Body() dto: CreateVacanteDto, @Req() req: any) {
    return this.vacantes.create(dto, req.user);
  }

  @Get('publicasTodas')
  @ApiOperation({ summary: 'Listar todas las vacantes públicas de todos los tenants' })
  listPublicasTodas() {
    return this.vacantes.listTodasPublicas();
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Listar vacantes propias (opcional: ?estado=cerrada)' })
  @ApiQuery({ name: 'tenant', required: true })
  @ApiQuery({ name: 'estado', required: false })
  list(@Query('tenant') tenant: string, @Query('estado') estado: string, @Req() req: any) {
    return this.vacantes.list(tenant.trim().toLowerCase(), req.user, estado);
  }

  @Get(':id/resumen')
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Obtener resumen de postulaciones con score' })
  @ApiParam({ name: 'id', description: 'ID de la vacante' })
  async resumen(@Param('id') id: string, @Req() req: any) {
    return this.vacantes.resumenPostulaciones(id, req.user);
  }


  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesPermitidosGuard) // un guard que permita candidatos y admins
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Obtener vacante por ID (según rol y permisos)' })
  @ApiParam({ name: 'id', description: 'ID de la vacante' })
  @ApiResponse({ status: 200, description: 'Vacante encontrada' })
  @ApiResponse({ status: 404, description: 'Vacante no encontrada' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  getById(@Param('id') id: string, @Req() req: any) {
    return this.vacantes.getById(id, req.user);
  }

  @Get('publicas')
  @ApiOperation({ summary: 'Listar vacantes públicas y abiertas (sin login)' })
  @ApiQuery({ name: 'tenant', required: true, description: 'Slug del tenant' })
  listPublicas(@Query('tenant') tenant: string) {
    if (!tenant) throw new BadRequestException('tenant es requerido');
    return this.vacantes.listPublicasTenantOnly(tenant.trim().toLowerCase());
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Actualizar vacante por ID (admin o superadmin)' })
  @ApiParam({ name: 'id', description: 'ID de la vacante' })
  @ApiBody({ type: UpdateVacanteDto })
  @ApiResponse({ status: 200, description: 'Vacante actualizada' })
  @ApiResponse({ status: 404, description: 'Vacante no encontrada' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async update(@Param('id') id: string, @Body() dto: UpdateVacanteDto, @Req() req: any) {
    return this.vacantes.update(id, dto, req.user);
  }

}
