// src/postulaciones/postulaciones.service.ts
import { BadRequestException, ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostulacionDto } from './dto/create-postulacione.dto';

@Injectable()
export class PostulacionesService {
  constructor(private prisma: PrismaService) { }

  /**
   * Crea una nueva postulación.
   * - Valida tenant, vacante y candidato
   * - Previene duplicados
   * - Registra evento de postulación inicial
   */
  async create(
    dto: CreatePostulacionDto,
    candidatoId: string,
    userContext: {
      userId?: string;
      accountId?: string;
      email?: string;
      ip?: string;
      userAgent?: string;
      path?: string;
    }
  ) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: dto.tenantSlug },
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const vacante = await this.prisma.vacantes.findUnique({
      where: { id: dto.vacanteId },
    });
    if (!vacante || vacante.tenantId !== tenant.id) {
      throw new BadRequestException('Vacante inválida para este tenant');
    }

    const candidato = await this.prisma.candidatos.findUnique({
      where: { id: candidatoId },
    });

    // if (!candidato || candidato.tenantId !== tenant.id) {
    //   throw new BadRequestException('Candidato inválido para este tenant');
    // }

    if (!candidato) {
      throw new BadRequestException('Candidato no encontrado');
    }

    try {
      const postulacion = await this.prisma.postulaciones.create({
        data: {
          tenantId: tenant.id,
          vacanteId: vacante.id,
          candidatoId: candidato.id,
          fuente: dto.fuente,
          mensaje: dto.mensaje,
          cvExtraUrl: dto.cvExtraUrl,
          estado: 'postulado',
          createdByUserId: userContext.userId,
          createdByAccountId: userContext.accountId,
        },
        include: {
          vacante: true,
          candidato: true,
        },
      });

      // Evento de postulación inicial
      await this.prisma.eventoPostulaciones.create({
        data: {
          tenantId: tenant.id,
          postulacionId: postulacion.id,
          estadoFrom: null,
          estadoTo: 'postulado',
          motivo: 'Postulación inicial',
        },
      });

      await this.prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          actorUserId: userContext.userId,
          actorAccountId: userContext.accountId,
          actorEmail: userContext.email,
          action: 'CREATE',
          entity: 'Postulaciones',
          entityId: postulacion.id,
          note: `Candidato se postuló a vacante "${vacante.id}"`,
          ip: userContext.ip,
          userAgent: userContext.userAgent,
          path: userContext.path,
        },
      });


      return postulacion;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('El candidato ya está postulado a esta vacante');
      }
      throw e;
    }
  }
  
  /**
   * Lista postulaciones filtrando por tenant, vacante, candidato o estado.
   */
  async list(tenantSlug: string,
    filters: {
      vacanteId?: string;
      candidatoId?: string;
      estado?: string;
    },
    user: {
      id: string;
      isSuperAdmin?: boolean;
      tenantId?: string;
      roles?: string[];
    }
  ) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    if (!user.isSuperAdmin && user.tenantId !== tenant.id) {
      throw new ForbiddenException('No puedes acceder a postulaciones de otro tenant');
    }

    if (filters.candidatoId && !user.isSuperAdmin) {
      // Aclaración: si se quiere restringir a cierto rol, se puede hacer aquí
      // Ejemplo: solo ADMIN puede usar candidatoId como filtro
      const isAdmin = user.roles?.includes('ADMIN');
      const isReclutador = user.roles?.includes('RECLUTADOR');

      if (!isAdmin && !isReclutador) {
        throw new ForbiddenException('No tienes permisos para filtrar por candidato');
      }
    }

    const where: any = {
      tenantId: tenant.id,
    };
    if (filters.vacanteId) where.vacanteId = filters.vacanteId;
    if (filters.candidatoId) where.candidatoId = filters.candidatoId;
    if (filters.estado) where.estado = filters.estado;

    return this.prisma.postulaciones.findMany({
      where,
      include: {
        vacante: true,
        candidato: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
