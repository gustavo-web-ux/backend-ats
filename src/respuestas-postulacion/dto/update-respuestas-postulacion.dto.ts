import { PartialType } from '@nestjs/mapped-types';
import { CreateRespuestasPostulacionDto } from './create-respuestas-postulacion.dto';

export class UpdateRespuestasPostulacionDto extends PartialType(CreateRespuestasPostulacionDto) {}
