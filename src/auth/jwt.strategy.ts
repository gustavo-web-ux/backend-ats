// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_SECRET } from '../auth/auth.constants';

function fromAccessCookie(req: any): string | null {
  return req?.cookies?.['access_token'] ?? null;
}

// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKey: JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromExtractors([
        fromAccessCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
    });
  }

  validate(payload: any) {
    return {
      id: payload.sub,                  // 👈 mapeamos correctamente
      tid: payload.tid,
      cuentaId: payload.cuentaId,       // ✅ necesario para el endpoint del candidato
      tipoUsuario: payload.tipoUsuario, // ✅ necesario para validar que sea "candidato"
      roles: payload.roles || [],
      perms: payload.perms || [],
      isSuperAdmin: payload.isSuperAdmin || false,
      email: payload.email,
      tenant: payload.tenant,
    };
  }
}

