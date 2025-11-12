import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CargosService {
  constructor(private prisma: PrismaService) { }

  private present(c: any) {
    const { competenciasJson, tenant, ...rest } = c;
    return {
      ...rest,
      tenantName: tenant?.name, // ✅ Agrega el nombre del tenant
      tenantSlug: tenant?.slug,
      competencias: competenciasJson ? JSON.parse(competenciasJson) : undefined,
    };
  }

  async create(dto: CreateCargoDto, user: any) {
    // Para todos los usuarios, usás el tenant del token (más seguro)
    const tenantSlug = user.roles.includes('SUPERADMIN') ? user.tenant : user.tenant;

    if (!tenantSlug) {
      throw new ForbiddenException('No tienes acceso a este tenant');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const cargo = await this.prisma.cargos.create({
      data: {
        tenantId: tenant.id,
        nombre: dto.nombre,
        competenciasJson: dto.competencias !== undefined
          ? JSON.stringify(dto.competencias)
          : undefined,
      },
    });

    return this.present(cargo);
  }

  async listPaginated(tenantSlug: string | undefined, user: any, page = 1, limit = 10) {
    let whereCondition = {};

    if (tenantSlug) {
      const tenant = await this.prisma.tenants.findUnique({
        where: { slug: tenantSlug },
      });
      if (!tenant) throw new NotFoundException('Tenant no encontrado');

      // Verificación para usuarios que no son SUPERADMIN
      if (!user.roles.includes('SUPERADMIN') && user.tenant !== tenantSlug) {
        throw new ForbiddenException('No tienes acceso a este tenant');
      }

      whereCondition = { tenantId: tenant.id };
    } else {
      // Si no se pasa tenant y no es SUPERADMIN, no permitir
      if (!user.roles.includes('SUPERADMIN')) {
        throw new ForbiddenException('No tienes permisos para ver todos los cargos');
      }
      // SUPERADMIN sin filtro → whereCondition vacío (verá todos)
    }

    const skip = (page - 1) * limit;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.cargos.count({ where: whereCondition }),
      this.prisma.cargos.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          tenant: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
    ]);

    return {
      data: rows.map(this.present),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Opcional: listado general con filtro por tenant
  async findAll(tenantSlug?: string) {
    const rows = await this.prisma.cargos.findMany({
      where: tenantSlug ? { tenant: { slug: tenantSlug.toLowerCase() } } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.present);
  }

  // Opcional: obtener por id
  async findOne(id: string) {
    const cargo = await this.prisma.cargos.findUnique({ where: { id } });
    if (!cargo) throw new NotFoundException('Cargo no encontrado');
    return this.present(cargo);
  }

  async update(id: string, dto: UpdateCargoDto, user: any) {
    const cargo = await this.prisma.cargos.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!cargo) throw new NotFoundException('Cargo no encontrado');

    const isSuperadmin = user.roles.includes('SUPERADMIN');
    const belongsToTenant = cargo.tenant.slug === user.tenant;

    if (!isSuperadmin && !belongsToTenant) {
      throw new ForbiddenException('No tienes acceso a modificar este cargo');
    }

    const updated = await this.prisma.cargos.update({
      where: { id },
      data: {
        nombre: dto.nombre?.trim(),
        competenciasJson: dto.competencias !== undefined
          ? JSON.stringify(dto.competencias)
          : undefined,
      },
    });

    return this.present(updated);
  }

}
