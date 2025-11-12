import { Body, Controller, Get, Post, Req, Res, Patch, Param, Query, UnauthorizedException, UseGuards, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BootstrapSuperadminDto } from './dto/bootstrap-superadmin.dto';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { UpdateTenantUserDto } from './dto/update-tenant-user.dto';
import { SuperAdminGuard, TenantAdminGuard, AdminOrSuperAdminGuard } from '../common/guards/superadmin.guard';
import { COOKIE_SECURE, COOKIE_DOMAIN, JWT_REFRESH_SECRET, REFRESH_TOKEN_TTL, ACCESS_TOKEN_TTL } from './auth.constants';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiSecurity, ApiCookieAuth, ApiParam } from '@nestjs/swagger';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];  // o cualquier tipo que defina los roles
  isSuperAdmin: boolean;  // Si lo necesitas
  // Agrega los campos adicionales que tu usuario tenga
}

// Extiende la interfaz Request de Express para agregar la propiedad user
interface RequestWithUser extends Request {
  user: User; // Asegúrate de que la propiedad 'user' sea del tipo 'User'
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private prisma: PrismaService, private jwt: JwtService) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuario' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login exitoso. Devuelve access token y datos del usuario' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const slug = dto.tenantSlug?.trim().toLowerCase();

    const u = await this.auth.validateLogin(dto.email, dto.password, slug);

    const access = this.auth.signAccess(u.payload);
    //const refresh = this.auth.signRefresh({ sub: u.payload.sub, tid: u.payload.tid });

    res.cookie('access_token', access, {
      ...this.auth.cookieOpts(this.auth.ttlToMs(ACCESS_TOKEN_TTL)),
      path: '/',                       // 👈 clave
    });
    //res.cookie(REFRESH_COOKIE, refresh, this.auth.cookieOpts(this.auth.ttlToMs(REFRESH_TOKEN_TTL)));

    return { access_token: access, message: 'Login exitoso' };
    // return {
    //   access_token: access,
    //   user: {
    //     id: u.payload.sub,
    //     email: u.user.email,
    //     roles: u.payload.roles,
    //     tenant: u.tenant.slug,
    //   },
    // };
  }

  @UseGuards(AuthGuard('jwt')) // ✅ Solo JWT guard
  @Get('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica si el token actual es válido' })
  @ApiResponse({ status: 200, description: 'Token válido' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  validate(@Req() req: any) {
    const user = req.user;
    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        tenant: user.tenant,
        roles: user.roles,
        tipoUsuario: 'corporativo',
      },
    };
  }

  @Post('bootstrap-superadmin')
  @ApiOperation({ summary: 'Bootstrap para crear superadmin (usado una sola vez)' })
  @ApiBody({ type: BootstrapSuperadminDto })
  @ApiResponse({ status: 201, description: 'Superadmin creado correctamente' })
  @ApiResponse({ status: 403, description: 'Bootstrap deshabilitado o token inválido' })
  async bootstrapSuperadmin(
    @Body() dto: BootstrapSuperadminDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    // console.log('BOOTSTRAP HIT');
    // console.log('HDR', req.header?.('X-Bootstrap-Token'));
    // console.log('ENV', process.env.BOOTSTRAP_TOKEN, 'ALLOW', process.env.ALLOW_BOOTSTRAP);
    // console.log('DTO', dto);
    if (process.env.ALLOW_BOOTSTRAP !== 'true') {
      throw new ForbiddenException('Bootstrap deshabilitado');
    }
    // const token = req.header('X-Bootstrap-Token');
    // if (!token || token !== process.env.BOOTSTRAP_TOKEN) {
    //   throw new ForbiddenException('Token inválido');
    // }

    const u = await this.auth.bootstrapCreateSuperadmin(dto);
    const access = this.auth.signAccess(u.payload);
    res.cookie('access_token', access, {
      ...this.auth.cookieOpts(this.auth.ttlToMs(ACCESS_TOKEN_TTL)),
      path: '/', // 👈 importante para que la cookie viaje a todas las rutas
    });
    //const refresh = this.auth.signRefresh({ sub: u.payload.sub, tid: u.payload.tid });

    //res.cookie(REFRESH_COOKIE, refresh, this.auth.cookieOpts(this.auth.ttlToMs(REFRESH_TOKEN_TTL)));
    //return { access_token: access, user: { id: u.payload.sub, email: u.user.email, roles: u.payload.roles, tenant: u.tenant.slug } };
    return { message: 'Superadmin creado', access_token: access };
  }

  @Post('admin/superadmins')
  @UseGuards(AuthGuard('jwt'), SuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Crear o promocionar un nuevo superadmin' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string' }
      },
      required: ['name', 'email']
    }
  })
  @ApiResponse({ status: 201, description: 'Superadmin creado/promocionado' })
  async createAnotherSuperadmin(@Body() dto: { name: string; email: string; password?: string }) {
    const user = await this.auth.adminCreateOrPromoteSuperadmin(dto);
    return { ok: true, user: { id: user.id, email: user.email, name: user.name } };
  }

  @Post('users')
  @UseGuards(AuthGuard('jwt'), SuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Crear un usuario para un tenant (SUPERADMIN)' })
  @ApiBody({ type: CreateTenantUserDto })
  @ApiResponse({ status: 201, description: 'Usuario creado para tenant' })
  async createTenantUser(@Body() dto: CreateTenantUserDto) {
    return this.auth.createTenantUser(dto);
  }

  @Get('users/:id')
  @UseGuards(AuthGuard('jwt'), AdminOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Obtener un usuario por ID (acceso según rol)' })
  @ApiParam({ name: 'id', description: 'ID del usuario a obtener' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado o sin permisos' })
  async findUserById(
    @Param('id') id: string,
    @Req() req: RequestWithUser
  ) {
    const currentUserId = req.user.id;
    const userRoles = req.user.roles;
    return this.auth.findById(currentUserId, userRoles, id);
  }

  @Post('tenant/users')
  @UseGuards(AuthGuard('jwt'), TenantAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Crear usuario en tenant (ADMIN)' })
  async createUserInMyTenant(@Body() dto: CreateTenantUserDto, @Req() req: any) {
    // Ignorá cualquier tenantSlug que venga en el body
    const { tenantSlug, ...rest } = dto;
    return this.auth.createTenantUser({ ...rest, tenantSlug: req.user.tenant });
  }

  @Get('users')
  @UseGuards(AuthGuard('jwt'), AdminOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Obtener usuarios según rol' })
  @ApiResponse({ status: 200, description: 'Usuarios obtenidos correctamente' })
  async findUsersByRole(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: RequestWithUser  // Accedemos a la solicitud para obtener el usuario logueado
  ) {
    const currentUserId = req.user.id;  // Obtenemos el ID del usuario desde la solicitud
    const userRole = req.user.roles;    // Obtenemos los roles del usuario desde la solicitud

    // Llamamos al servicio pasando la información necesaria
    return this.auth.findUsersByRole(currentUserId, userRole, page, limit);
  }

  @Patch('users/:id')
  @UseGuards(AuthGuard('jwt'), AdminOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Actualizar usuario de tenant (SUPERADMIN)' })
  @ApiParam({ name: 'id', description: 'ID del usuario a actualizar' })
  @ApiBody({ type: UpdateTenantUserDto })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'Email en uso' })
  async updateTenantUser(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateTenantUserDto
  ) {
    const currentUserId = req.user.id;
    const currentRoles = req.user.roles;

    return this.auth.updateTenantUserById(currentUserId, currentRoles, id, dto);
  }

  // @Post('refresh')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Refrescar access token usando refresh token (cookie)' })
  // @ApiResponse({ status: 200, description: 'Nuevo access token generado' })
  // @ApiResponse({ status: 401, description: 'Refresh token inválido o ausente' })
  // async refresh(@Req() req: any) {
  //   const token = req.cookies?.[REFRESH_COOKIE];
  //   if (!token) throw new UnauthorizedException('No refresh token');

  //   let decoded: any;
  //   try { decoded = this.jwt.verify(token, { secret: JWT_REFRESH_SECRET }); }
  //   catch { throw new UnauthorizedException('Refresh inválido'); }

  //   // Revalida usuario
  //   const user = await this.auth['prisma'].usuarios.findUnique({ where: { id: decoded.sub } });
  //   if (!user || user.tenantId !== decoded.tid) throw new UnauthorizedException('Usuario/tenant inválido');

  //   // Carga datos mínimos para el access (roles/perms si ya tenés RBAC completo)
  //   const roles = await this.auth['prisma'].usuarioRoles.findMany({
  //     where: { userId: user.id }, include: { role: true },
  //   }).then(rs => rs.map(r => r.role.name));
  //   const tenant = await this.auth['prisma'].tenants.findUnique({ where: { id: decoded.tid } });
  //   const isSuperAdmin = roles.includes('SUPERADMIN') && tenant?.slug === 'root';

  //   const access = this.auth.signAccess({ sub: user.id, tid: decoded.tid, roles, perms: isSuperAdmin ? ['*'] : [], isSuperAdmin });
  //   return { access_token: access };
  // }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión y limpiar cookie' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada correctamente' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SECURE ? 'none' : 'lax',
      domain: COOKIE_DOMAIN,   // en dev, suele ser undefined
      path: '/',               // debe coincidir con el set
    });
    return { message: 'Cierre de sesión exitoso' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario actual' })
  async me(@Req() req: any) {
    const user = req.user;

    // 🔧 Tipamos tenant correctamente
    const tenant: { name: string; slug: string } | null =
      user.tid
        ? await this.prisma.tenants.findUnique({
          where: { id: user.tid },
          select: { name: true, slug: true },
        })
        : null;

    return {
      id: user.sub,
      tenantId: user.tid ?? null,
      tenantSlug: tenant?.slug ?? null,
      tenantName: tenant?.name ?? null,
      roles: user.roles ?? [],
      perms: user.perms ?? [],
      isSuperAdmin: user.isSuperAdmin ?? false,
      email: user.email ?? null,
      tipoUsuario: 'corporativo',
    };
  }


}
