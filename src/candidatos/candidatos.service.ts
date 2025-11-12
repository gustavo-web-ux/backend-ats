import { ConflictException, Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { CreateCandidatoDto } from './dto/create-candidato.dto';
import { CandidateRegisterDto } from './dto/candidate-register.dto';
import { CandidateLoginDto } from './dto/candidate-login.dto';
import { UpdateCandidatoDto } from './dto/update-candidato.dto';
import { PostulacionesService } from '../postulaciones/postulaciones.service'; // 👈
import { CreatePostulacionDto } from '../postulaciones/dto/create-postulacione.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { Response } from 'express';

@Injectable()
export class CandidatosService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private postulacionesService: PostulacionesService,
  ) { }

  private present(c: any) {
    // Opcional: exponer "perfil" (objeto) y ocultar perfilJson
    const perfil = c.perfilJson ? JSON.parse(c.perfilJson) : undefined;
    const { perfilJson, ...rest } = c;
    return { ...rest, perfil };
  }

  async create(dto: CreateCandidatoDto) {
    const tenant = await this.prisma.tenants.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    try {
      const cand = await this.prisma.candidatos.create({
        data: {
          tenantId: tenant.id,
          nombre: dto.nombre.trim(),
          email: dto.email.toLowerCase(),
          telefono: dto.telefono,
          cvUrl: dto.cvUrl,
          perfilJson: dto.perfil ? JSON.stringify(dto.perfil) : undefined,
        },
      });

      // 👇 crear usuario automáticamente (rol CANDIDATO) si se pidió
      // if (dto.createUser && dto.password) {
      //   await this.authService.createTenantUser({
      //     name: dto.nombre,
      //     email: dto.email,
      //     password: dto.password,
      //     tenantSlug: dto.tenantSlug,
      //     roleName: 'CANDIDATO',
      //     candidatoId: cand.id,       // 👈 vínculo 1:1
      //   });
      // }

      return this.present(cand);
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Ya existe un candidato con ese email en este tenant');
      throw e;
    }
  }

  async register(dto: CandidateRegisterDto) {
    // 🔥 Eliminamos lógica de tenantSlug
    const exists = await this.prisma.candidatoCuentas.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Ya existe una cuenta con ese email');

    const hashedPassword = await this.authService.hashPassword(dto.password);
    const cuenta = await this.prisma.candidatoCuentas.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
      },
    });

    const candidato = await this.prisma.candidatos.create({
      data: {
        nombre: dto.name,
        email: dto.email,
        telefono: dto.telefono,
        cvUrl: dto.cvUrl,
        cuentaId: cuenta.id,
      },
    });

    return this.present(candidato);
  }

  async login(dto: CandidateLoginDto, res: Response) {
    const cuenta = await this.prisma.candidatoCuentas.findUnique({
      where: { email: dto.email },
      include: { candidatos: true },
    });

    if (!cuenta) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatch = await this.authService.comparePassword(dto.password, cuenta.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const candidato = cuenta.candidatos?.[0];
    // ✅ asegurate de que tenga un candidato asociado
    if (!candidato) {
      throw new UnauthorizedException('No se encontró candidato asociado a la cuenta');
    }

    const payload = {
      id: candidato.id,      // id real del candidato
      cuentaId: cuenta.id,   // id de la cuenta
      email: cuenta.email,
      tipoUsuario: 'candidato', // 👈 AGREGALO AQUÍ
      tenantId: candidato.tenantId,      // <--- agregar
    };

    const accessToken = await this.authService.signAccess(payload);

    // ✅ DEBUG: imprimir el token y el payload
    //console.log('🔐 Candidate login payload:', payload);
    //console.log('📦 JWT:', accessToken);

    res.cookie('access_token', accessToken, this.authService.cookieOpts());

    return {
      access_token: accessToken,
      message: 'Login exitoso',
      // ⚠️ Solo para debug temporal: devolvé también el payload
      payload, // podés quitarlo después
      candidatoId: candidato.id,
    };
  }

  async findByCuentaId(cuentaId: string, includePostulaciones = false) {
    if (includePostulaciones) {
      const candidato = await this.prisma.candidatos.findFirst({
        where: { cuentaId },
        include: {
          postulaciones: {
            include: {
              vacante: {
                include: {
                  tenant: { select: { name: true, slug: true } }, // ✅ ver de qué empresa es la vacante
                  cargo: true,
                },
              },
              eventos: true,
              entrevistas: true,
              feedbacks: true,
            },
            orderBy: { createdAt: 'desc' }, // 👌 opcional: mostrar postulaciones más recientes primero
          },
        },
      });

      if (!candidato) {
        throw new NotFoundException('Candidato no encontrado');
      }

      return {
        candidato: {
          id: candidato.id,
          nombre: candidato.nombre,
          email: candidato.email,
          telefono: candidato.telefono,
          cvUrl: candidato.cvUrl,
          avatarFilename: candidato.avatarFilename, // ✅ AÑADIDO
        },
        tipoUsuario: 'candidato',
        postulaciones: candidato.postulaciones.map((p) => ({
          id: p.id,
          estado: p.estado,
          mensaje: p.mensaje,
          createdAt: p.createdAt,
          vacante: {
            id: p.vacante.id,
            //titulo: p.vacante.titulo,
            cargo: p.vacante.cargo?.nombre,
            empresa: p.vacante.tenant.name,
            slug: p.vacante.tenant.slug,
          },
        })),
      };
    }

    // Caso sin includePostulaciones
    const candidato = await this.prisma.candidatos.findFirst({
      where: { cuentaId },
    });

    if (!candidato) {
      throw new NotFoundException('Candidato no encontrado');
    }

    return {
      ...this.present(candidato),
      tipoUsuario: 'candidato', // 👈 útil para frontend o autenticación
    };
  }

  async updateByCuentaId(cuentaId: string, dto: UpdateCandidatoDto) {
    const candidato = await this.prisma.candidatos.findFirst({
      where: { cuentaId },
    });

    if (!candidato) throw new NotFoundException('Candidato no encontrado');

    const updated = await this.prisma.candidatos.update({
      where: { id: candidato.id },
      data: {
        nombre: dto.nombre,
        telefono: dto.telefono,
        cvUrl: dto.cvUrl,
        perfilJson: dto.perfil ? JSON.stringify(dto.perfil) : undefined,
      },
    });

    return this.present(updated);
  }

  async postularDesdeCandidatoCuenta(
    cuentaId: string,
    dto: CreatePostulacionDto,
    userContext: any,
  ) {
    const candidato = await this.prisma.candidatos.findFirst({
      where: { cuentaId },
    });
    if (!candidato) throw new NotFoundException('Candidato no encontrado');

    return this.postulacionesService.create(dto, candidato.id, userContext);
  }

  async getMisPostulaciones(cuentaId: string) {
    const candidato = await this.prisma.candidatos.findFirst({
      where: { cuentaId },
      include: {
        postulaciones: {
          include: {
            vacante: {
              include: {
                tenant: { select: { name: true } },
                cargo: true,
              },
            },
            eventos: true,
            entrevistas: true,
            feedbacks: true,
          },
        },
      },
    });

    if (!candidato) throw new NotFoundException('Candidato no encontrado');

    return candidato.postulaciones;
  }

  async actualizarAvatar(cuentaId: string, filename: string) {
    const candidato = await this.prisma.candidatos.findFirst({
      where: { cuentaId },
    });

    if (!candidato) throw new BadRequestException('Candidato no encontrado');

    await this.prisma.candidatos.update({
      where: { id: candidato.id },
      data: { avatarFilename: filename },
    });
  }

  async actualizarCV(cuentaId: string, filename: string) {
    const candidato = await this.prisma.candidatos.findFirst({
      where: { cuentaId },
    });

    if (!candidato) throw new NotFoundException('Candidato no encontrado');

    return this.prisma.candidatos.update({
      where: { id: candidato.id },
      data: { cvUrl: filename },
    });
  }

}
