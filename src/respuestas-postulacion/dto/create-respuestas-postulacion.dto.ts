// src/respuestas-postulacion/dto/create-respuestas-postulacion.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRespuestasPostulacionDto {
    @ApiProperty({ description: 'ID de la postulación' })
    @IsNotEmpty() @IsString()
    postulacionId: string;

    @ApiProperty({ description: 'ID de la pregunta de competencia' })
    @IsNotEmpty() @IsString()
    preguntaId: string;

    @ApiProperty({ description: 'Texto o valor de la respuesta del candidato' })
    @IsNotEmpty() @IsString()
    respuestaTexto: string;
}
