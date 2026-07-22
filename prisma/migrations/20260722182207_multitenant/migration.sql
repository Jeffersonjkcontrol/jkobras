/*
  Warnings:

  - Added the required column `organizacaoId` to the `Cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizacaoId` to the `DiarioObra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizacaoId` to the `EtapaProjeto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizacaoId` to the `Projeto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizacaoId` to the `SubEtapa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Papel" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "organizacaoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DiarioObra" ADD COLUMN     "organizacaoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EtapaProjeto" ADD COLUMN     "organizacaoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Projeto" ADD COLUMN     "organizacaoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SubEtapa" ADD COLUMN     "organizacaoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizacaoId" TEXT;

-- CreateTable
CREATE TABLE "Organizacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoData" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organizacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organizacao_slug_key" ON "Organizacao"("slug");

-- CreateIndex
CREATE INDEX "Cliente_organizacaoId_idx" ON "Cliente"("organizacaoId");

-- CreateIndex
CREATE INDEX "DiarioObra_organizacaoId_idx" ON "DiarioObra"("organizacaoId");

-- CreateIndex
CREATE INDEX "EtapaProjeto_organizacaoId_idx" ON "EtapaProjeto"("organizacaoId");

-- CreateIndex
CREATE INDEX "Projeto_organizacaoId_idx" ON "Projeto"("organizacaoId");

-- CreateIndex
CREATE INDEX "SubEtapa_organizacaoId_idx" ON "SubEtapa"("organizacaoId");

-- CreateIndex
CREATE INDEX "User_organizacaoId_idx" ON "User"("organizacaoId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
