import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user;
    if (user?.isSuperAdmin) return true;
    throw new ForbiddenException('Acceso denegado: no tiene permisos para esta acción');
  }
}


// tenant-admin.guard.ts
@Injectable()
export class TenantAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const u = req.user;
    if (!u) throw new ForbiddenException();
    // ADMIN del tenant (podés admitir RECLUTADOR si querés)
    return Array.isArray(u.roles) && u.roles.includes('ADMIN');
  }
}

//admin-or-superadmin
@Injectable()
export class AdminOrSuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user;

    if (!user) throw new ForbiddenException('No autenticado');

    const isSuperAdmin = user?.isSuperAdmin === true;
    const isTenantAdmin = Array.isArray(user.roles) && user.roles.includes('ADMIN');

    if (isSuperAdmin || isTenantAdmin) {
      return true;
    }

    throw new ForbiddenException('Acceso denegado: no tiene permisos para esta acción');
  }
}

@Injectable()
export class AdminReclutadorOrSuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user;
    if (!user) throw new ForbiddenException('No autenticado');

    const isSuperAdmin = user?.isSuperAdmin === true;
    const roles = user?.roles || [];

    const isAdminOrReclutador = Array.isArray(roles) &&
      (roles.includes('ADMIN') || roles.includes('RECLUTADOR'));

    if (isSuperAdmin || isAdminOrReclutador) {
      return true;
    }

    throw new ForbiddenException('Acceso denegado: no tiene permisos para esta acción');
  }
}

@Injectable()
export class RolesPermitidosGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    if (!user) throw new ForbiddenException('No autenticado');

    const roles = user.roles || [];
    const isSuperAdmin = user?.isSuperAdmin === true;
    const isCandidate = user.tipoUsuario === 'candidato'; // ✅ CAMBIO CLAVE

    if (
      isSuperAdmin ||
      roles.includes('ADMIN') ||
      roles.includes('RECLUTADOR') ||
      isCandidate
    ) {
      return true;
    }

    throw new ForbiddenException('No tienes permisos para acceder a este recurso');
  }
}