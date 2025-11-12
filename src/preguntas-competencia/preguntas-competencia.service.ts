import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePreguntasCompetenciaDto } from './dto/create-preguntas-competencia.dto';
import { UpdatePreguntasCompetenciaDto } from './dto/update-preguntas-competencia.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PreguntasCompetenciaService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreatePreguntasCompetenciaDto) {
    // Validar que el cargo exista
    const cargo = await this.prisma.cargos.findUnique({
      where: { id: dto.cargoId },
    });
    if (!cargo) throw new NotFoundException('Cargo no encontrado');

    if (dto.opciones) {
      try {
        const parsed = JSON.parse(dto.opciones);
        if (!Array.isArray(parsed)) {
          throw new BadRequestException('Las opciones deben ser un array JSON');
        }
      } catch {
        throw new BadRequestException('Formato JSON inválido en opciones');
      }
    }

    const pregunta = await this.prisma.preguntasCompetencia.create({
      data: {
        cargoId: dto.cargoId,
        texto: dto.texto,
        tipo: dto.tipo,
        opciones: dto.opciones,
      },
    });

    return pregunta;
  }

  async listByCargo(cargoId: string) {
    return this.prisma.preguntasCompetencia.findMany({
      where: { cargoId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listByVacante(vacanteId: string) {
    const vacante = await this.prisma.vacantes.findUnique({
      where: { id: vacanteId },
      include: { cargo: true },
    });

    if (!vacante) throw new NotFoundException('Vacante no encontrada');

    return this.prisma.preguntasCompetencia.findMany({
      where: { cargoId: vacante.cargoId },
      orderBy: { createdAt: 'asc' },
    });
  }

}
