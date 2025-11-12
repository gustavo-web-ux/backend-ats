// src/preguntas-competencia/dto/create-preguntas-competencia.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreatePreguntasCompetenciaDto {
    @ApiProperty({ description: 'ID del cargo al que pertenece la pregunta' })
    @IsNotEmpty() @IsString()
    cargoId: string;

    @ApiProperty({ description: 'Texto de la pregunta' })
    @IsNotEmpty() @IsString()
    texto: string;

    @ApiProperty({
        description: 'Tipo de pregunta',
        enum: ['multiple_choice', 'checkbox', 'open_text'],
    })
    @IsNotEmpty() @IsIn(['multiple_choice', 'checkbox', 'open_text'])
    tipo: string;

    @ApiProperty({
        description: 'Opciones en formato JSON (solo si aplica)',
        required: false,
        example: '["Buena", "Regular", "Mala"]',
    })
    @IsOptional() @IsString()
    opciones?: string;
}
