import { Controller, Get, Post, Body, Req, Query, Patch, Param, UseGuards, Delete, ForbiddenException } from '@nestjs/common';
import { CargosService } from './cargos.service';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminReclutadorOrSuperAdminGuard } from '../common/guards/superadmin.guard';

@ApiTags('cargos')
@Controller('cargos')
export class CargosController {
  constructor(private readonly cargos: CargosService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Crear cargo (requiere tenantSlug)' })
  @ApiBody({ type: CreateCargoDto })
  @ApiResponse({ status: 201, description: 'Cargo creado' })
  create(@Body() dto: CreateCargoDto, @Req() req: any) {
    return this.cargos.create(dto, req.user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Listar cargos paginados' })
  @ApiQuery({ name: 'tenant', required: false, description: 'Slug del tenant para filtrar' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad por página (default: 10)' })
  async list(
    @Query('tenant') tenant: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: any,
  ) {
    const t = tenant?.trim().toLowerCase();

    // 🔢 Conversión segura
    const pageNumber = Math.max(1, parseInt(page || '1', 10));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit || '10', 10)));

    // 🚨 Si no es SUPERADMIN y no se pasa tenant, se restringe
    if (!req.user.roles.includes('SUPERADMIN') && !t) {
      throw new ForbiddenException('Debes especificar un tenant');
    }

    return this.cargos.listPaginated(t, req.user, pageNumber, limitNumber);
  }


  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cargo por id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Cargo encontrado' })
  @ApiResponse({ status: 404, description: 'Cargo no encontrado' })
  findOne(@Param('id') id: string) {
    return this.cargos.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Actualizar un cargo por ID' })
  @ApiParam({ name: 'id', description: 'ID del cargo' })
  @ApiBody({ type: UpdateCargoDto })
  @ApiResponse({ status: 200, description: 'Cargo actualizado exitosamente' })
  @ApiResponse({ status: 403, description: 'No autorizado para modificar este cargo' })
  @ApiResponse({ status: 404, description: 'Cargo no encontrado' })
  update(@Param('id') id: string, @Body() dto: UpdateCargoDto, @Req() req: any) {
    return this.cargos.update(id, dto, req.user);
  }

}
