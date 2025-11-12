import { BadRequestException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import {
  ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL, JWT_SECRET, JWT_REFRESH_SECRET,
  COOKIE_DOMAIN, COOKIE_SECURE,
} from './auth.constants';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { UpdateTenantUserDto } from './dto/update-tenant-user.dto'
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) { }

  // Login para cualquier usuario (incluye SUPERADMIN en tenant 'root')
  async validateLogin(
    email: string,
    password: string,
    tenantSlug?: string,
    fallbackTenantSlug?: string
  ) {
    const emailLower = email.toLowerCase();
    const slug = tenantSlug ?? fallbackTenantSlug;

    // ========== 1) Slug presente → intento login directo ==========
    if (slug) {
      const tenant = await this.prisma.tenants.findUnique({ where: { slug } });
      if (!tenant) {
        throw new BadRequestException('Empresa (tenant) inválida.');
      }

      const user = await this.prisma.usuarios.findFirst({
        where: { email: emailLower, tenantId: tenant.id, active: true },
        include: { roles: { include: { role: true } } },
      });

      if (!user) {
        throw new BadRequestException('Usuario no registrado.');
      }

      const passwordValid = await argon2.verify(user.password, password);
      if (!passwordValid) {
        throw new BadRequestException('Correo o contraseña incorrectos.');
      }

      const roles = user.roles.map(r => r.role.name);

      if (slug) return this.tryLoginOnTenant(emailLower, password, slug);
    }

    // ========== 2) SUPERADMIN login en root tenant ==========
    const root = await this.prisma.tenants.findUnique({ where: { slug: 'root' } });
    if (root) {
      const uRoot = await this.prisma.usuarios.findFirst({
        where: { tenantId: root.id, email: emailLower, active: true },
        include: { roles: { include: { role: true } } },
      });

      if (uRoot && await argon2.verify(uRoot.password, password)) {
        const roles = uRoot.roles.map(r => r.role.name);
        if (roles.includes('SUPERADMIN')) {
          return this.buildPayload(uRoot, root, roles, true);
        }
      }
    }

    // ========== 3) Email pertenece a un único tenant activo ==========
    const matches = await this.prisma.usuarios.findMany({
      where: { email: emailLower, active: true },
      select: { tenantId: true },
      take: 2,
    });

    const tenantIds = Array.from(new Set(matches.map(m => m.tenantId)));
    if (tenantIds.length === 1) {
      const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantIds[0] } });

      if (tenant) {
        const user = await this.prisma.usuarios.findFirst({
          where: { tenantId: tenant.id, email: emailLower, active: true },
          include: { roles: { include: { role: true } } },
        });

        if (!user) {
          throw new BadRequestException('Usuario no registrado.');
        }

        const passwordValid = await argon2.verify(user.password, password);
        if (!passwordValid) {
          throw new BadRequestException('Correo o contraseña incorrectos.');
        }

        const roles = user.roles.map(r => r.role.name);

        // ✅ Usar slug real del tenant obtenido
        return this.tryLoginOnTenant(emailLower, password, tenant.slug);
      }

    }

    // ========== 4) Ambiguo, no se encontró, o múltiples tenants ==========
    throw new BadRequestException('Debe indicar la empresa (tenant).');
  }

  // Igual que la tuya
  private async tryLoginOnTenant(email: string, password: string, slug: string) {
    const tenant = await this.prisma.tenants.findUnique({ where: { slug } });
    if (!tenant) throw new BadRequestException('Tenant inválido');

    const user = await this.prisma.usuarios.findFirst({
      where: { email, tenantId: tenant.id, active: true },
      include: { roles: { include: { role: true } } },
    });
    if (!user || !(await argon2.verify(user.password, password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const roles = user.roles.map(r => r.role.name);
    const isSuperAdmin = roles.includes('SUPERADMIN') && tenant.slug === 'root';
    return this.buildPayload(user, tenant, roles, isSuperAdmin);
  }

  private buildPayload(user: any, tenant: any, roles: string[], isSuperAdmin: boolean) {
    const perms: string[] = isSuperAdmin ? ['*'] : [];
    const payload = { sub: user.id, tid: tenant.id, roles, perms, isSuperAdmin, email: user.email, tenant: tenant.slug };
    return { user, tenant, payload };
  }

  signAccess(payload: any) {
    return this.jwt.sign(payload, { secret: JWT_SECRET, expiresIn: ACCESS_TOKEN_TTL });
  }

  signRefresh(payload: { sub: string; tid: string; }) {
    return this.jwt.sign(payload, { secret: JWT_REFRESH_SECRET, expiresIn: REFRESH_TOKEN_TTL });
  }

  cookieOpts(maxAgeMs?: number) {
    return {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SECURE ? ('none' as const) : ('lax' as const),
      domain: COOKIE_DOMAIN,
      path: '/',
      maxAge: maxAgeMs,
    };
  }

  ttlToMs(ttl: string) {
    const m = ttl.match(/^(\d+)([smhd])$/i);
    if (!m) return 0; const n = +m[1], u = m[2].toLowerCase();
    return n * (u === 's' ? 1000 : u === 'm' ? 60000 : u === 'h' ? 3600000 : 86400000);
  }

  async bootstrapCreateSuperadmin(dto: { name: string; email: string; password: string; }) {
    const root = await this.prisma.tenants.upsert({
      where: { slug: 'root' }, update: {}, create: { name: 'Root', slug: 'root' },
    });
    const superRole = await this.prisma.roles.upsert({
      where: { tenantId_name: { tenantId: root.id, name: 'SUPERADMIN' } },
      update: {}, create: { tenantId: root.id, name: 'SUPERADMIN' },
    });

    // permitir solo si aún no hay SUPERADMIN
    const exists = await this.prisma.usuarioRoles.findFirst({ where: { roleId: superRole.id } });
    if (exists) throw new ForbiddenException('Ya existe un superadministrador');

    const email = dto.email.toLowerCase();
    const hash = await argon2.hash(dto.password);

    try {
      const user = await this.prisma.usuarios.create({
        data: { tenantId: root.id, name: dto.name, email, password: hash, active: true },
      });
      await this.prisma.usuarioRoles.create({ data: { userId: user.id, roleId: superRole.id } });

      const payload = { sub: user.id, tid: root.id, roles: ['SUPERADMIN'], perms: ['*'], isSuperAdmin: true };
      return { user, tenant: { slug: 'root', id: root.id }, payload };
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Email ya existe en root');
      throw e;
    }
  }

  async adminCreateOrPromoteSuperadmin(dto: { name: string; email: string; password?: string }) {
    const root = await this.prisma.tenants.upsert({
      where: { slug: 'root' }, update: {}, create: { name: 'Root', slug: 'root' },
    });
    const superRole = await this.prisma.roles.upsert({
      where: { tenantId_name: { tenantId: root.id, name: 'SUPERADMIN' } },
      update: {}, create: { tenantId: root.id, name: 'SUPERADMIN' },
    });

    const email = dto.email.toLowerCase();
    const dataUpdate: any = { name: dto.name };
    let passwordHash: string | undefined;

    if (dto.password) {
      passwordHash = await argon2.hash(dto.password);
      dataUpdate.password = passwordHash;
    }

    // crea o actualiza usuario en root
    const user = await this.prisma.usuarios.upsert({
      where: { tenantId_email: { tenantId: root.id, email } },
      update: dataUpdate,
      create: {
        tenantId: root.id,
        name: dto.name,
        email,
        password: passwordHash ?? (await argon2.hash(Math.random().toString(36).slice(2))), // por si no envían password
        active: true,
      },
    });

    // asigna rol SUPERADMIN (idempotente)
    await this.prisma.usuarioRoles.upsert({
      where: { userId_roleId: { userId: user.id, roleId: superRole.id } },
      update: {},
      create: { userId: user.id, roleId: superRole.id },
    });

    return user;
  }

  async createTenantUser(dto: {
    name: string;
    email: string;
    password: string;
    tenantSlug?: string;
    roleId?: string;
    roleName?: string;
    candidatoId?: string;
  }) {
    // ✅ 1) exigir y normalizar el slug
    const slug = dto.tenantSlug?.toString().trim().toLowerCase();
    if (!slug) throw new BadRequestException('tenantSlug es requerido');

    // ✅ 2) buscar el tenant por el slug ya normalizado
    const tenant = await this.prisma.tenants.findUnique({ where: { slug } });
    if (!tenant) throw new BadRequestException('Tenant inválido');

    // 🔎 Validación opcional del candidato
    let candidateIdToLink: string | null = null;
    if (dto.candidatoId) {
      const cand = await this.prisma.candidatos.findUnique({ where: { id: dto.candidatoId } });
      if (!cand || cand.tenantId !== tenant.id) {
        throw new BadRequestException('Candidato inválido para este tenant');
      }
      const alreadyLinked = await this.prisma.usuarios.findFirst({
        where: { tenantId: tenant.id, candidatoId: dto.candidatoId },
      });
      if (alreadyLinked) throw new ConflictException('Este candidato ya tiene un usuario');
      candidateIdToLink = cand.id;
    }

    // 🔐 Resolver rol
    let role;
    if (dto.roleId) {
      role = await this.prisma.roles.findUnique({ where: { id: dto.roleId } });
      if (!role || role.tenantId !== tenant.id) throw new BadRequestException('Rol inválido para este tenant');
      if (role.name === 'SUPERADMIN') throw new ForbiddenException('SUPERADMIN se crea solo por flujo dedicado');
    } else {
      const normalized = (dto.roleName ?? 'CANDIDATO').trim().toUpperCase().replace(/-/g, '_');
      if (normalized === 'SUPERADMIN') throw new ForbiddenException('SUPERADMIN se crea solo por flujo dedicado');
      // Buscar rol existente
      role = await this.prisma.roles.findUnique({
        where: { tenantId_name: { tenantId: tenant.id, name: normalized } },
      });

      if (!role) {
        throw new BadRequestException(`Rol inválido para este tenant: ${normalized}`);
      }
    }

    const email = dto.email.toLowerCase();
    const hash = await argon2.hash(dto.password);

    try {
      const user = await this.prisma.usuarios.create({
        data: {
          tenantId: tenant.id,
          name: dto.name,
          email,
          password: hash,
          active: true,
          candidatoId: candidateIdToLink,
        },
      });

      await this.prisma.usuarioRoles.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });

      const { password, ...safe } = user as any;
      return { ...safe, roles: [role.name], tenant: { id: tenant.id, slug: tenant.slug } };
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Email ya existe en este tenant');
      if (e.code === 'P2003') throw new BadRequestException('FK inválida (revisa candidatoId/tenant)');
      throw e;
    }
  }

  async updateTenantUserById(
    currentUserId: string,
    currentRoles: string[],
    id: string,
    dto: UpdateTenantUserDto
  ) {
    const user = await this.prisma.usuarios.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const currentUser = await this.prisma.usuarios.findUnique({
      where: { id: currentUserId },
      select: { tenantId: true },
    });

    // Si no sos superadmin, asegurate de que sea del mismo tenant
    const isSuperAdmin = currentRoles.includes('SUPERADMIN');

    if (!isSuperAdmin) {
      if (!currentUser || currentUser.tenantId !== user.tenantId) {
        throw new ForbiddenException('No tienes permisos para editar este usuario');
      }
    }

    const data: any = {};

    if (dto.name) data.name = dto.name.trim();
    if (dto.email) data.email = dto.email.toLowerCase();
    if (dto.password) data.password = await argon2.hash(dto.password);

    if (dto.tenantSlug && dto.tenantSlug !== '') {
      const tenant = await this.prisma.tenants.findUnique({ where: { slug: dto.tenantSlug } });
      if (!tenant) throw new BadRequestException('Tenant inválido');
      data.tenantId = tenant.id;
    }

    // ⚠️ Roles: si se envía roleId o roleName, validar y asignar
    let updatedRole;
    if (dto.roleId || dto.roleName) {
      const tenantId = data.tenantId || user.tenantId;

      if (dto.roleId) {
        const role = await this.prisma.roles.findUnique({ where: { id: dto.roleId } });
        if (!role || role.tenantId !== tenantId) {
          throw new BadRequestException('Rol inválido para el tenant');
        }
        if (role.name === 'SUPERADMIN') {
          throw new ForbiddenException('No se puede asignar el rol SUPERADMIN');
        }
        updatedRole = role;
      } else if (dto.roleName) {
        const normalized = dto.roleName.trim().toUpperCase().replace(/-/g, '_');

        if (normalized === 'SUPERADMIN') {
          throw new ForbiddenException('No se puede asignar el rol SUPERADMIN');
        }

        // 🚫 No crear si no existe — buscar solamente
        const existingRole = await this.prisma.roles.findUnique({
          where: {
            tenantId_name: {
              tenantId,
              name: normalized,
            },
          },
        });

        if (!existingRole) {
          throw new BadRequestException(`El rol "${normalized}" no existe para este tenant`);
        }

        updatedRole = existingRole;
      }

      // 🔁 Eliminar roles anteriores si solo debe haber uno
      await this.prisma.usuarioRoles.deleteMany({ where: { userId: id } });

      // Asignar nuevo rol
      await this.prisma.usuarioRoles.create({
        data: {
          userId: id,
          roleId: updatedRole.id,
        },
      });
    }

    try {
      const updated = await this.prisma.usuarios.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          tenantId: true,
        },
      });

      return {
        ...updated,
        role: updatedRole?.name,
      };
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Email ya está en uso');
      throw e;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Función para obtener usuarios según el rol
  async findUsersByRole(
    currentUserId: string,
    roles: string[],
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    let where: any = {};

    if (roles.includes('SUPERADMIN')) {
      where = {}; // ve todos
    } else if (roles.includes('ADMIN')) {
      const tenant = await this.prisma.usuarios.findUnique({
        where: { id: currentUserId },
        select: { tenantId: true },
      });

      if (!tenant) throw new BadRequestException('Usuario no encontrado');

      where = { tenantId: tenant.tenantId }; // solo los de su tenant
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.usuarios.findMany({
        where,
        skip,
        take: limit,
        include: {
          roles: {
            include: { role: true }, // 👈 nombre del rol
          },
          tenants: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.usuarios.count({ where }),
    ]);

    // 🔁 Formateamos la respuesta para que coincida con tu SELECT
    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      name_usuario: u.name,
      tenantId: u.tenantId,
      active: u.active,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      //name_rol: u.roles?.[0]?.role?.name || null, // asumiendo un solo rol
      name_rol: u.roles.map(r => r.role.name).join(', '),
      name_empresa: u.tenants?.name || null,
    }));

    return {
      data: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(currentUserId: string, roles: string[], userId: string) {
    let where: any = { id: userId };

    // Si NO es SUPERADMIN, se restringe al tenant del usuario actual
    if (!roles.includes('SUPERADMIN')) {
      const currentUser = await this.prisma.usuarios.findUnique({
        where: { id: currentUserId },
        select: { tenantId: true },
      });

      if (!currentUser) {
        throw new BadRequestException('Usuario actual no encontrado');
      }

      // 👇 Solo puede ver usuarios dentro de su mismo tenant
      where.tenantId = currentUser.tenantId;
    }

    const user = await this.prisma.usuarios.findFirst({
      where,
      include: {
        roles: { include: { role: true } },
        tenants: { select: { name: true, slug: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado o sin permisos para verlo');
    }

    return {
      id: user.id,
      email: user.email,
      name_usuario: user.name,
      tenantId: user.tenantId,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      name_rol: user.roles.map((r) => r.role.name).join(', '),
      name_empresa: user.tenants?.name || null,
      slug_empresa: user.tenants?.slug || null,
    };
  }

}
