import { Module } from '@nestjs/common';
import { PreguntasCompetenciaService } from './preguntas-competencia.service';
import { PreguntasCompetenciaController } from './preguntas-competencia.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PreguntasCompetenciaController],
  providers: [PreguntasCompetenciaService],
})
export class PreguntasCompetenciaModule {}
