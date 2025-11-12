// src/respuestas-postulacion/respuestas-postulacion.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRespuestasPostulacionDto } from './dto/create-respuestas-postulacion.dto';

@Injectable()
export class RespuestasPostulacionService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateRespuestasPostulacionDto) {
    // Verificar postulacion válida
    const postulacion = await this.prisma.postulaciones.findUnique({
      where: { id: dto.postulacionId },
    });
    if (!postulacion) throw new NotFoundException('Postulación no encontrada');

    // Verificar pregunta válida
    const pregunta = await this.prisma.preguntasCompetencia.findUnique({
      where: { id: dto.preguntaId },
    });
    if (!pregunta) throw new NotFoundException('Pregunta no encontrada');

    // Crear respuesta
    return this.prisma.respuestasPostulacion.create({
      data: {
        postulacionId: dto.postulacionId,
        preguntaId: dto.preguntaId,
        respuestaTexto: dto.respuestaTexto,
      },
    });
  }

  // 🔍 Listar todas las respuestas de una postulación
  async listByPostulacion(postulacionId: string) {
    return this.prisma.respuestasPostulacion.findMany({
      where: { postulacionId },
      include: { pregunta: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async bulkCreate(respuestas: CreateRespuestasPostulacionDto[]) {
    if (!respuestas || respuestas.length === 0) {
      throw new BadRequestException('Debe incluir al menos una respuesta');
    }

    const created = await this.prisma.$transaction(
      respuestas.map(r => this.prisma.respuestasPostulacion.create({ data: r }))
    );

    return { saved: created.length };
  }

}
