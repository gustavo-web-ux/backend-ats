import { PartialType } from '@nestjs/mapped-types';
import { CreatePreguntasCompetenciaDto } from './create-preguntas-competencia.dto';

export class UpdatePreguntasCompetenciaDto extends PartialType(CreatePreguntasCompetenciaDto) {}
