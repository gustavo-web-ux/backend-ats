import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class CandidatoGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;

        if (!user) {
            throw new ForbiddenException('No autenticado');
        }

        if (user.tipoUsuario !== 'candidato') {
            throw new ForbiddenException('Solo candidatos pueden acceder a este recurso');
        }

        return true;
    }
}
