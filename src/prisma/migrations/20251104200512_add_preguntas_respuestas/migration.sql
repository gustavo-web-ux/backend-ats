-- CreateTable
CREATE TABLE `PreguntasCompetencia` (
    `id` VARCHAR(191) NOT NULL,
    `cargoId` VARCHAR(191) NOT NULL,
    `texto` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `opciones` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RespuestasPostulacion` (
    `id` VARCHAR(191) NOT NULL,
    `postulacionId` VARCHAR(191) NOT NULL,
    `preguntaId` VARCHAR(191) NOT NULL,
    `respuestaTexto` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RespuestasPostulacion_postulacionId_idx`(`postulacionId`),
    INDEX `RespuestasPostulacion_preguntaId_idx`(`preguntaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PreguntasCompetencia` ADD CONSTRAINT `PreguntasCompetencia_cargoId_fkey` FOREIGN KEY (`cargoId`) REFERENCES `Cargos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RespuestasPostulacion` ADD CONSTRAINT `RespuestasPostulacion_postulacionId_fkey` FOREIGN KEY (`postulacionId`) REFERENCES `Postulaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RespuestasPostulacion` ADD CONSTRAINT `RespuestasPostulacion_preguntaId_fkey` FOREIGN KEY (`preguntaId`) REFERENCES `PreguntasCompetencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
