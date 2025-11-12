import { Controller, Get, Post, Body, Patch, Param, UseGuards, Delete } from '@nestjs/common';
import { PreguntasCompetenciaService } from './preguntas-competencia.service';
import { CreatePreguntasCompetenciaDto } from './dto/create-preguntas-competencia.dto';
import { UpdatePreguntasCompetenciaDto } from './dto/update-preguntas-competencia.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminReclutadorOrSuperAdminGuard } from '../common/guards/superadmin.guard';

@ApiTags('preguntas-competencia')
@Controller('preguntas-competencia')
export class PreguntasCompetenciaController {
  constructor(private readonly preguntasService: PreguntasCompetenciaService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Crear pregunta para un cargo' })
  @ApiBody({ type: CreatePreguntasCompetenciaDto })
  @ApiResponse({ status: 201, description: 'Pregunta creada' })
  create(@Body() dto: CreatePreguntasCompetenciaDto) {
    return this.preguntasService.create(dto);
  }

  @Get('by-cargo/:cargoId')
  @ApiOperation({ summary: 'Listar preguntas por cargo' })
  @ApiParam({ name: 'cargoId', description: 'ID del cargo' })
  listByCargo(@Param('cargoId') cargoId: string) {
    return this.preguntasService.listByCargo(cargoId);
  }

  @Get('by-vacante/:vacanteId')
  @ApiOperation({ summary: 'Listar preguntas por vacante' })
  @ApiParam({ name: 'vacanteId', description: 'ID de la vacante' })
  listByVacante(@Param('vacanteId') vacanteId: string) {
    return this.preguntasService.listByVacante(vacanteId);
  }

}


