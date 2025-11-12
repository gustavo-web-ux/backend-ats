<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).




///
docker compose exec -e DATABASE_URL="mysql://root:root@mysql:3306/ats_saas" api-ats sh -lc '
NAME=rbac_permisos; TS=$(date +%Y%m%d%H%M%S); DIR=src/prisma/migrations/${TS}_${NAME};
mkdir -p "$DIR";
npx prisma migrate diff \
  --from-url="$DATABASE_URL" \
  --to-schema-datamodel=src/prisma/schema.prisma \
  --script > "$DIR/migration.sql";
echo "Nueva migración en: $DIR"
'


npx prisma migrate status --schema=src/prisma/schema.prisma

docker exec -it <nombre_del_contenedor> /bin/sh

ahora otra consulta, como habra roles, el candidato sera un rol tambien ?? PORQUE estoy pensando ahora asi -- Yo soy la empresa desarrolladora del sistema de reclutamiento, y todos los desarrolladores tienen rol superadministrador (acceso a todo) el cliente/empresa se le puede dar un rol administrador (acceso limitado el rol superadmin decide que acceso darle) para el caso en donde la empresa tenga una area de tic se le puede dar un rol de reclutador (acceso limitado el rol superadmin decide que acceso darle) ente otros roles, creo que el sistema ya esta contemplado para crear varios roles no ? pero eso si asignar permisos a roles no superadministradores


npm i @nestjs/jwt @nestjs/passport passport passport-jwt argon2 @prisma/client
npm i -D @types/cookie-parser






📈 Prioridad y Tareas

Te recomiendo que sigas este flujo modular y lo dividas en pequeñas tareas según lo que más necesitas ahora. Aquí un desglose:

- Roles y Permisos:

Implementar asignación de permisos por rol.

Agregar validación de permisos en los guards.

- Registro de Candidatos:

Endpoint de registro.

Endpoint para actualización de perfil.

- Gestión de Vacantes y Postulaciones:

Crear vacantes (y cargos).

Crear postulaciones para candidatos.

- Entrevistas y Feedback:

Programación de entrevistas.

Recolección de feedback.

- Reportes y Métricas:

Crear endpoints para obtener métricas del reclutamiento.



tengo un proyecto backned con nestjs + prisma, docker un bd mysql que lo levanto en docker, la api y la base de datos lo tengo en un mismo dokcer compose.yml , 
el proyecto lo subi a repositorio github, mi consulta es cuando haga un gitclone que debo tener instalado para levantar bien el proyecto ?



ok, como seria lo mejor tengo el rol superadmin, creo un nuevo tenants/empresa/cliente , luego debo crear usuarios para esa empresa, pero antes debo crear ya el rol o roles  ?? PORQUE TENGO OTRO MODULO DE PERMISOS Y ROLES, permisos y roles serian dos cosas diferentes no ?? LOS ROLES BASICOS para una empresa es admin, y reclutador , para el tema de los candidatos no se como deberia ser aahora porque en teoria ya va a poder a ver todas las postulaciones, y al registrarse podra postularse al que quiera, pero no solo a una, sino a las que el quiera, pero la empresa cliente puede pedir mas roles asi que se debe tener en cuenta que puede tener x cantidad de roles, por otro lado para ganar escalabilidad y flexibilidad, pensando en el front (otro desarrollador) los roles "no superadmin" estaran limitados segun lo que el superadmin le quiera dar, 










contraseña cuenta gmail monitoreo
---Monitoreo2025!










¡Vamos paso a paso! Sí: roles y permisos son cosas distintas.

Permisos = capacidades atómicas (ej. vacantes.create, postulaciones.move).

Roles = paquetes de permisos, siempre por tenant (ej. ADMIN, RECLUTADOR del tenant ACME).

Dado tu objetivo (escalable, simple y que el front pueda ocultar/mostrar cosas), te propongo este flujo base y dónde encaja en tu código actual:

1) Define el catálogo global de permisos (una vez)

Crea una lista fija de códigos y descríbelos en Permisos (semilla inicial):

tenants.read, tenants.write (solo SUPERADMIN)

roles.read, roles.write

users.read, users.create, users.update, users.disable

vacantes.read, vacantes.create, vacantes.update, vacantes.publish, vacantes.close

candidatos.read, candidatos.create, candidatos.update

postulaciones.read, postulaciones.move, postulaciones.comment

entrevistas.schedule, feedback.create

Esto lo puedes sembrar con un script o en un endpoint admin-only. Es estable y no depende del tenant.

2) Al crear un tenant, siembra roles por defecto (idempotente)

Cuando el SUPERADMIN hace POST /tenants, en el mismo transaction (o después) crea:

ADMIN con permisos “amplios” del tenant (usuarios, roles, vacantes, candidatos, etc., pero no tenants.*).

RECLUTADOR con permisos operativos (vacantes, candidatos, postulaciones, entrevistas, feedback) pero no administración de usuarios/roles.

Ejemplo de mapeo inicial:

ADMIN → roles.read/write, users.read/create/update/disable, vacantes.*, candidatos.*, postulaciones.*, entrevistas.schedule, feedback.create

RECLUTADOR → vacantes.read/create/update, vacantes.publish (opcional), candidatos.read/create/update, postulaciones.read/move/comment, entrevistas.schedule, feedback.create

Usa tu RolesPermisosService.createRole({ tenantSlug, name, permissionCodes }) para sembrarlos al toque de crear el tenant. Hazlo con upsert para que sea idempotente si re-ejecutas.

3) Creación de usuarios del tenant

SUPERADMIN: POST /auth/users (exige tenantSlug en el DTO).

ADMIN del tenant: POST /auth/tenant/users (ignoras el tenantSlug del body y usas req.user.tenant como ya haces).

El rol puede ser roleId o roleName. Si el cliente quiere nuevos roles, usa tu módulo roles-permisos para crearlos y asignar permisos.

Con esto, no “tienes” que crear roles manualmente antes: ya habrá ADMIN y RECLUTADOR semillados en cada tenant; y si el cliente pide algo especial, lo agregas con el módulo.

4) Guards en backend (mínimo)

SuperAdminGuard para todo lo de /tenants y cualquier cosa global.

TenantAdminGuard para la gestión de usuarios dentro del tenant.

A futuro: un PermGuard('perm.code') cuando empieces a chequear permisos granulares. Por ahora con roles te alcanza.

5) JWT y front

En tu validateLogin puedes (cuando decidas) expandir permisos de los roles del usuario y ponerlos en payload.perms (array de strings). El front solo chequea perms (o roles por ahora) para mostrar/ocultar botones/menú.

Por ahora ya cargas roles e isSuperAdmin. Está bien. Más adelante agregas perms resolviendo RolePermisos en el login.

6) Candidatos (no staff)

Con tu nuevo diseño:

No necesitan Usuarios (staff) ni roles del tenant.

Usan CandidatoCuentas (global) para autenticarse y pueden aplicar a cualquier tenant. Cada postulación crea (o upsertea) una ficha Candidatos en el tenant destino, enlazada a cuentaId.

Las rutas públicas para ver vacantes no requieren login. Para postular, sí.

Así mantienes el RBAC solo para personal de la empresa (ADMIN/RECLUTADOR) y separas el flujo candidato.

Qué tocar ahora (mini-checklist)

Sembrar permisos globales (una vez).

En TenantsService.create, después de crear el tenant, sembrar ADMIN y RECLUTADOR con los permisos sugeridos (usando tu RolesPermisosService).

Confirmar que:

/tenants/** sigue con SuperAdminGuard (ok).

/auth/users → SuperAdminGuard.

/auth/tenant/users → TenantAdminGuard (ya fuerza el tenant del token).

(Opcional) En login, cuando quieras, agrega perms resolviendo permisos por rol para que el front oculte/active acciones por permiso, no solo por rol.












✅ MÓDULO DE CANDIDATOS — ¿Qué debe tener para estar completo?
📦 1. Modelo Prisma → ✅ Ya lo tenés

Candidatos

Relación con CandidatoCuentas

Relaciones con Postulaciones y Tenants → ✔️

✍️ 2. DTOs necesarios → ✅ Ya tenés todos
DTO	Propósito	Estado
CreateCandidatoDto	Crear desde backend (admin)	✅
CandidateRegisterDto	Registro público desde frontend	✅
CandidateLoginDto	Login público	✅
UpdateCandidatoDto	(opcional) editar perfil luego	🔜 (podés hacerlo simple más adelante)
🧠 3. Service (CandidatosService)
Método	Propósito	Estado
create()	Solo para admin	✅
register()	Registro de candidatos desde frontend	🚧 Debés implementarlo (te ayudo abajo)
findOne()	Obtener datos del candidato logueado	🚧 Recomendado
update()	(opcional) actualizar datos del perfil	🔜
🎛️ 4. Controller (CandidatosController)
Ruta	Método	Comentario
POST /candidatos	create()	Protegido, solo admin
POST /auth/candidatos/register	register()	Público, autoregistro
GET /candidatos/me	findOne()	Protegido, obtener perfil del candidato logueado
PATCH /candidatos/me	update()	(Opcional) permitir editar perfil

Para me, usás el token JWT para identificar al candidato (decodificando cuentaId)

🛡️ 5. Autenticación (AuthService)
Función	Propósito
hashPassword()	Hashear al registrar
comparePassword()	Verificar al loguear
generateToken()	Crear JWT para frontend
validateUserByToken()	Para @UseGuards() con JWT















fecha 04/10/2025


hola, estoy desarrollando un backend. api con nestjs + prisma y mysql, y docker, ya va tomando forma dicha api, es para un sistema de reclutamiento, con un enfoque multiempresa, pero aun tengo algunos ajsuste que pulir, pero quiero que me ayudes o quiero enfocar en la idea general, asi tengo la estructura --- /src# ll drwxr-xr-x 12 root root 4096 Sep 28 19:33 ./ drwxr-xr-x 8 root root 4096 Oct 3 11:30 ../ -rw-r--r-- 1 root root 89 Aug 31 10:38 .gitignore -rw-r--r-- 1 root root 639 Aug 31 10:10 app.controller.spec.ts -rw-r--r-- 1 root root 315 Sep 15 11:53 app.controller.ts -rw-r--r-- 1 root root 1226 Sep 28 19:33 app.module.ts -rw-r--r-- 1 root root 152 Sep 7 13:42 app.service.ts drwxr-xr-x 4 root root 4096 Sep 14 17:28 auth/ drwxr-xr-x 4 root root 4096 Sep 25 11:50 candidatos/ drwxr-xr-x 4 root root 4096 Sep 19 10:41 cargos/ drwxr-xr-x 6 root root 4096 Sep 14 15:49 common/ drwxr-xr-x 4 root root 4096 Sep 28 19:33 entrevistas/ -rw-r--r-- 1 root root 1575 Sep 23 14:53 main.ts drwxr-xr-x 4 root root 4096 Sep 19 11:39 postulaciones/ drwxr-xr-x 3 root root 4096 Sep 14 17:33 prisma/ drwxr-xr-x 4 root root 4096 Sep 16 11:43 roles-permisos/ drwxr-xr-x 4 root root 4096 Sep 15 14:38 tenants/ drwxr-xr-x 4 root root 4096 Sep 19 11:38 vacantes/ ------ tenants seria como la empresa o cliente, te mostrare los mmodelos de la BD







ya tengo algunos guards y demas, mi consulta es otra cosa, mira mas o menos esto -- ¿Querés que te ayude a hacer un diagrama de flujo o una descripción escrita paso a paso? ----- hasta este momento tengo pensado asi -- el superadmin crea o registra una nueva empresa o cliente, por defecto en el endpoint que ya tengo sea crean 2 roles por defecto para la empresa o cliente , que es ADMIN y RECLUTADOR, esta el ROL superadmin que solo los desarrolladores del sistema lo pueden tener, ahora dependiendo de la empresa ocliente se pueden crear otros roles, pero lo general es admin y reclutador, y luego hay un rol medio especial que es el de candidato. Luego de que el superadmin haya registrado la empresa, crear los usuarios y le asigna los roles creados (admin o reclutador), te mostrare los services ok ?
































Buena pregunta. Organizar qué módulos deben permitir actualización (update) y con qué nivel de acceso según los roles (SuperAdmin, Admin, Reclutador) es clave para mantener una arquitectura segura y ordenada.

Vamos a evaluarlo módulo por módulo 👇

📁 auth (usuarios)

Update necesario: ✅ Sí

¿Quién puede hacer update?

SuperAdmin: ✅ Puede actualizar cualquier usuario de cualquier tenant

Admin: ✅ Puede actualizar usuarios de su propio tenant (no superadmins)

Reclutador: ⚠️ Solo podría actualizar su propio perfil (si es necesario)

🔐 Deberías tener:

PATCH /auth/users/:id → SuperAdmin

PATCH /auth/tenant/users/:id → Admin (validar que el user.tenantId coincida con el del req.user)

PATCH /auth/me → Para que el usuario actual actualice su propio nombre o password

📁 tenants

Update necesario: ✅ Sí

¿Quién puede hacer update?

SuperAdmin: ✅ Puede actualizar cualquier tenant

Admin: ❌ No (por lo general)

Reclutador: ❌ No

🛑 Generalmente, solo SuperAdmin debería modificar información de tenants (nombre, slug, status).

📁 roles-permisos

Update necesario: ✅ Depende

¿Quién puede hacer update?

SuperAdmin: ✅ Puede modificar roles/permisos de cualquier tenant

Admin: ⚠️ Opcional. Si querés permitirles crear o editar roles para su propio tenant

Reclutador: ❌ No

🛠️ Depende de si querés una gestión flexible de roles por tenant.

📁 candidatos

Update necesario: ✅ Sí

¿Quién puede hacer update?

SuperAdmin: ✅ Cualquiera

Admin: ✅ Solo candidatos de su tenant

Reclutador: ✅ Solo candidatos de su tenant

💡 Muy común que Admin y Reclutador necesiten editar datos de candidatos.

📁 vacantes

Update necesario: ✅ Sí

¿Quién puede hacer update?

SuperAdmin: ✅ Cualquier vacante

Admin: ✅ Solo vacantes de su tenant

Reclutador: ✅ Solo vacantes de su tenant

📁 postulaciones

Update necesario: ✅ Sí

¿Quién puede hacer update?

SuperAdmin: ✅

Admin: ✅ De su tenant

Reclutador: ✅ De su tenant

🔁 Muy común actualizar estado, feedback, entrevistas, etc.

📁 entrevistas

Update necesario: ✅ Sí

¿Quién puede hacer update?

SuperAdmin: ✅

Admin: ✅ De su tenant

Reclutador: ✅ De su tenant

📁 feedback

Update necesario: ✅ Sí

¿Quién puede hacer update?

SuperAdmin: ✅

Admin: ✅ De su tenant

Reclutador: ✅ De su tenant

📁 cargos

Update necesario: ✅ Sí

¿Quién puede hacer update?

SuperAdmin: ✅

Admin: ✅ De su tenant

Reclutador: ⚠️ Opcional, generalmente no

✅ Resumen por rol y módulo
Módulo	SuperAdmin	Admin (tenant)	Reclutador (tenant)
auth	✅ Todos	✅ Su tenant	⚠️ Solo perfil
tenants	✅	❌	❌
roles-permisos	✅	⚠️ Opcional	❌
candidatos	✅	✅	✅
vacantes	✅	✅	✅
postulaciones	✅	✅	✅
entrevistas	✅	✅	✅
feedback	✅	✅	✅
cargos	✅	✅	⚠️ Opcional






APP-MOVIL
1°
base de datos: msyql (dockerizada) backend-api: nestjs + prisma (dockerizada) frontend-app: react native con expo, intefaz para movil se utilizo para emular una vista de movil algunas cosas de android studio ...-- ahora teniendo en cuenta todo eso --- te consultare lo siguiente



2°
quiero hacer que le app sea offline, seria con mysqllite ??? que cambiaria porque el backned si esta en comunicacion con el frontend pero no esta totalmente integrado al front para que sea offline, tampoco en la actual app-front no tiene su base de datos interno en el telefono donde esta instalado, basiacmente seria una nueva version de la app, como seria para empezar ?


3°
si es cierto, el backend ya lo tenog, pero como seria para integrar un backend parecido pero ya a la app o seria la BD la que tengo que integrar ??, para que guarde local los datos, y cuando tenga coenxion a internet, wifi, se haga la sincronizacion, pero seria directo ya a un backend del servidor central, no a la api-backend de la app movil que tenog ahora y esta en otro servidor de menor tamaño,



App móvil (con SQLite)
   ↙️            ↘️
 Lectura       Escritura local
   ⬇️                ⬇️
     Sincronización directa ➝ API Central (cuando hay conexión)

















Punto 1 
Se tiene un servidor central, en donde hay una bd central y una api (central) que interactua con la bd central,
en dicha bd central hay tabla sucursal, y hay varias sucursales, con su id y su descripcion, y vamos a suponer que en 
mi entorno de desarrollo (proceso de transicion a  offline) estoy aun pensando y creo que la app debera ser
hibrida online (para ciertas datos) pero lo fundamental es que tambien sea offline tambien para ciertos datos.
Volviendo a lo de bd central hay tabla sucursal, y hay varias sucursales, supongamos que ya existe la sucursal que 
tengo que usar para la app de una sucursal, y solo necesito indicar o consulta el id y su descripcion para que la bd central me envie o consulte los datos y lo guarde
ya en el sqllite cuando tenga señal de internet, la insercion de la sucursal sera basicamente 1 por telefono hasta este momento
y lo de la consulta de la sucursal e insercion sera solo una vez, ya guardado en la bd local sqllite, la app debera
trabajar offline con la sucursal que ya esta guardada en la bd local sqllite, mi consulta es como podria hacer
esa logica de obtener la sucursal (id y descripcion) desde la bd local sqllite. Un punto importante para dejar claro
es que entre la bd central y la app movil, el puente sera la api central seria una comunicacion bidireccional mas o menos, la app no se conecta directamente a la bd central
sino que la app movil se conecta a la api central y la api central se conecta a la bd central. 



Punto 2
Lo que tengo:
BD sqlserver central (servidor central).
api, nodejs-express central con js (servidor central).

app-movil react-native (cliente movil).
bd local sqlite (cliente movil). (esto apenas lo estoy probando, ya tengo 2 tablas, sucursales)

consideraciones:
se podria hacer la app con webscoket ??
en caso de que si deberia de hacer un nueva api central con webscoket??
porque la api-central actual es no es con webscoket, es con peticiones http normales (get, post, put, delete).
la bd central deberia de tener algun cambio para que pueda trabajar con webscoket ??







(Opcional) Validar que las preguntas pertenezcan al cargo de la vacante postulada

Esto puede hacerse si querés asegurar integridad estricta, revisando si cada preguntaId pertenece al mismo cargoId de la vacanteId de la postulación. Esto lo podés agregar dentro del bulkCreate, aunque inicialmente podés dejarlo simple para validar funcionalidad.










✅ ¿Dónde deberían ir las Preguntas?
🔹 ¿Quién crea las preguntas?

👉 El reclutador o admin al crear un cargo.

🔹 ¿Dónde deben gestionarse (crear/listar)?

📍 Módulo: corp
📂 Ubicación sugerida: modules/corp/pages/PreguntasCargo.jsx

Podés agregar la gestión de preguntas como una sección dentro del detalle del cargo o como una vista separada.

✅ ¿Dónde deberían ir las Respuestas?
🔹 ¿Quién responde?

👉 El candidato al postularse a una vacante (ligada a un cargo que tiene preguntas).

🔹 ¿Dónde deben mostrarse o responderse?

📍 Módulo: ext
📂 Ubicación sugerida: modules/ext/pages/RespondePreguntas.jsx

Ese formulario se debería mostrar después de que el candidato inicie la postulación.

✅ ¿Dónde deberían verse las respuestas y el resumen (scores)?
🔹 ¿Quién las ve?

👉 Superadmin, admin o reclutador

🔹 ¿Dónde deben listarse?

📍 Módulo: corp
📂 Página sugerida: modules/corp/pages/VacanteResumen.jsx

Acá se visualiza el matchScore, estado del candidato y datos útiles.

🧭 Flujo completo visual (resumen):
Usuario	Acción	Módulo	Página sugerida
Admin	Crear preguntas	corp	PreguntasCargo.jsx
Candidato	Responder preguntas	ext	RespondePreguntas.jsx
Reclutador	Ver resumen y scores	corp	VacanteResumen.jsx
¿Cómo seguimos?

Puedo ayudarte ahora con:

La página para gestionar preguntas (corp)

La página para responder preguntas (ext)

El resumen de scores (corp) – si no lo termina