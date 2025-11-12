import { Module } from '@nestjs/common';
import { RespuestasPostulacionService } from './respuestas-postulacion.service';
import { RespuestasPostulacionController } from './respuestas-postulacion.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RespuestasPostulacionController],
  providers: [RespuestasPostulacionService],
})
export class RespuestasPostulacionModule {}
