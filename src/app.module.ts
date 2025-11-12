import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TenantResolver } from './common/middleware/tenant-resolver.middleware';
import { TenantsModule } from './tenants/tenants.module';
import { RolesPermisosModule } from './roles-permisos/roles-permisos.module';
import { CandidatosModule } from './candidatos/candidatos.module';
import { CargosModule } from './cargos/cargos.module';
import { VacantesModule } from './vacantes/vacantes.module';
import { PostulacionesModule } from './postulaciones/postulaciones.module';
import { EntrevistasModule } from './entrevistas/entrevistas.module';
import { FeedbackModule } from './feedback/feedback.module';
import { PreguntasCompetenciaModule } from './preguntas-competencia/preguntas-competencia.module';
import { RespuestasPostulacionModule } from './respuestas-postulacion/respuestas-postulacion.module';

@Module({
  imports: [PrismaModule, AuthModule, TenantsModule, RolesPermisosModule, CandidatosModule, CargosModule, VacantesModule, PostulacionesModule, EntrevistasModule, FeedbackModule, PreguntasCompetenciaModule, RespuestasPostulacionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    //consumer.apply(TenantResolver).forRoutes('*');
  }
}
