import { Body, Controller, Post, Get, Req, Res, Put, Ip, UploadedFile, UseInterceptors, UseGuards, Headers, HttpCode, HttpStatus, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiCookieAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CandidatosService } from './candidatos.service';
import { AuthService } from '../auth/auth.service';
import { CandidateRegisterDto } from './dto/candidate-register.dto';
import { UpdateCandidatoDto } from './dto/update-candidato.dto';
import { CandidateLoginDto } from './dto/candidate-login.dto';
import { CreatePostulacionDto } from '../postulaciones/dto/create-postulacione.dto';
import { COOKIE_SECURE, COOKIE_DOMAIN, JWT_REFRESH_SECRET, REFRESH_TOKEN_TTL, ACCESS_TOKEN_TTL } from '../auth/auth.constants';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

// 🔁 Ruta física en el host (ya montada en Docker)
const AVATAR_STORAGE_PATH = '/home/administrador/uploads/avatars';
const CV_STORAGE_PATH = '/home/administrador/uploads/archivos'; // o /uploads/archivos si preferís más general


@ApiTags('auth - candidatos')
@Controller('auth/candidatos')
export class AuthCandidatosController {
    constructor(private readonly candidatosService: CandidatosService,
        private readonly authService: AuthService
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Registro público de candidatos' })
    @ApiResponse({ status: 201, description: 'Registro exitoso' })
    @ApiResponse({ status: 409, description: 'Email ya registrado' })
    register(@Body() dto: CandidateRegisterDto) {
        return this.candidatosService.register(dto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Login de candidato' })
    @ApiResponse({ status: 200, description: 'Login exitoso, token por cookie' })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
    login(@Body() dto: CandidateLoginDto, @Res({ passthrough: true }) res: Response) {
        return this.candidatosService.login(dto, res);
    }

    @Get('me')
    @ApiOperation({ summary: 'Obtener perfil del candidato autenticado' })
    @UseGuards(AuthGuard('jwt'))
    @ApiCookieAuth('access-token') // útil para Swagger
    getProfile(@Req() req) {
        //const { id, cuentaId, email } = req.user;
        const { cuentaId, tipoUsuario } = req.user;

        //console.log('🔐 Usuario autenticado:', { id, cuentaId, email });

        if (!cuentaId || tipoUsuario !== 'candidato') {
            throw new ForbiddenException('Solo los candidatos pueden acceder a este recurso');
        }

        // ✅ obtenemos el perfil a partir del id de la cuenta
        return this.candidatosService.findByCuentaId(cuentaId, true); // puedes pasar true si querés incluir postulaciones
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiCookieAuth('access-token')
    @Put('me') // 🔲 Nuevo: editar perfil
    updateProfile(@Req() req, @Body() dto: UpdateCandidatoDto) {
        return this.candidatosService.updateByCuentaId(req.user.sub, dto);
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiCookieAuth('access-token')
    @Post('postular') // 🔲 Nuevo: postularse a vacante
    postular(
        @Req() req,
        @Body() dto: CreatePostulacionDto,
        @Ip() ip: string,
        @Headers('user-agent') userAgent: string,
        @Headers('referer') referer: string,
    ) {
        const userContext = {
            userId: undefined,
            accountId: req.user.sub,
            email: req.user.email,
            ip,
            userAgent,
            path: referer,
        };

        return this.candidatosService.postularDesdeCandidatoCuenta(req.user.sub, dto, userContext);
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiCookieAuth('access-token')
    @Get('mis-postulaciones')
    getMisPostulaciones(@Req() req) {
        const { cuentaId, email } = req.user;

        if (!cuentaId) {
            throw new BadRequestException('Cuenta no válida o token incompleto');
        }

        //console.log('🔍 Candidato autenticado:', email, cuentaId);

        return this.candidatosService.getMisPostulaciones(cuentaId);
    }

    @Post('avatar')
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(FileInterceptor('avatar', {
        storage: diskStorage({
            destination: AVATAR_STORAGE_PATH,
            filename: (req, file, cb) => {
                const uniqueName = `avatar-${Date.now()}${extname(file.originalname)}`;
                cb(null, uniqueName);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp|jpg)$/)) {
                cb(new BadRequestException('Formato de imagen no soportado'), false);
            } else {
                cb(null, true);
            }
        },
    }))
    @ApiConsumes('multipart/form-data') // 👈 NECESARIO
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                avatar: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async uploadAvatar(
        @UploadedFile() file: Express.Multer.File,
        @Req() req,
    ) {
        if (!file) {
            throw new BadRequestException('No se recibió ningún archivo');
        }

        // 🧠 Guardamos el nombre del archivo en la base de datos
        await this.candidatosService.actualizarAvatar(req.user.cuentaId, file.filename);

        return {
            message: 'Avatar subido correctamente',
            filename: file.filename,
            url: `/auth/candidatos/avatar/${file.filename}`, // para acceder luego
        };
    }

    @Post('cv')
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(FileInterceptor('cv', {
        storage: diskStorage({
            destination: CV_STORAGE_PATH,
            filename: (req, file, cb) => {
                const uniqueName = `cv-${Date.now()}${extname(file.originalname)}`;
                cb(null, uniqueName);
            },
        }),
        fileFilter: (req, file, cb) => {
            const allowed = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ];
            if (!allowed.includes(file.mimetype)) {
                cb(new BadRequestException('Solo se permiten archivos PDF o Word'), false);
            } else {
                cb(null, true);
            }
        },
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                cv: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiOperation({ summary: 'Subir archivo CV del candidato autenticado' })
    @ApiCookieAuth('access-token')
    async uploadCV(
        @UploadedFile() file: Express.Multer.File,
        @Req() req,
    ) {
        if (!file) throw new BadRequestException('No se recibió ningún archivo');

        const cuentaId = req.user.cuentaId;
        await this.candidatosService.actualizarCV(cuentaId, file.filename);

        return {
            message: 'CV subido correctamente',
            filename: file.filename,
            url: `/auth/candidatos/cv/${file.filename}`,
        };
    }

    @Post('cv-temp')
    @UseInterceptors(FileInterceptor('cv', {
        storage: diskStorage({
            destination: CV_STORAGE_PATH,
            filename: (req, file, cb) => {
                const uniqueName = `cv-${Date.now()}${extname(file.originalname)}`;
                cb(null, uniqueName);
            },
        }),
        fileFilter: (req, file, cb) => {
            const allowed = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ];
            if (!allowed.includes(file.mimetype)) {
                cb(new BadRequestException('Solo se permiten archivos PDF o Word'), false);
            } else {
                cb(null, true);
            }
        },
        limits: { fileSize: 5 * 1024 * 1024 },
    }))
    @ApiOperation({ summary: 'Subir CV temporal antes de registrarse' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                cv: { type: 'string', format: 'binary' },
            },
        },
    })
    async uploadTempCV(
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('No se recibió ningún archivo');

        return {
            message: 'CV cargado temporalmente',
            filename: file.filename,
            url: `/public/archivos/${file.filename}`,
        };
    }

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

}
