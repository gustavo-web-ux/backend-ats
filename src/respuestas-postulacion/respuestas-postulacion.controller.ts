import { Controller, Get, Post, Body, Patch, Param, UseGuards, Delete } from '@nestjs/common';
import { RespuestasPostulacionService } from './respuestas-postulacion.service';
import { CreateRespuestasPostulacionDto } from './dto/create-respuestas-postulacion.dto';
import { UpdateRespuestasPostulacionDto } from './dto/update-respuestas-postulacion.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CandidatoGuard } from '../common/guards/candidato.guard';

@ApiTags('respuestas-postulacion')
@Controller('respuestas-postulacion')
export class RespuestasPostulacionController {
  constructor(private readonly respuestasService: RespuestasPostulacionService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), CandidatoGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Registrar respuesta a una pregunta de postulación' })
  @ApiBody({ type: CreateRespuestasPostulacionDto })
  create(@Body() dto: CreateRespuestasPostulacionDto) {
    return this.respuestasService.create(dto);
  }

  @Get('by-postulacion/:postulacionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Listar respuestas por postulación' })
  @ApiParam({ name: 'postulacionId', description: 'ID de la postulación' })
  listByPostulacion(@Param('postulacionId') postulacionId: string) {
    return this.respuestasService.listByPostulacion(postulacionId);
  }

  @Post('bulk')
  @UseGuards(AuthGuard('jwt'), CandidatoGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Enviar respuestas en lote de una postulación' })
  bulkCreate(@Body() respuestas: CreateRespuestasPostulacionDto[]) {
    return this.respuestasService.bulkCreate(respuestas);
  }

}
