-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('EM_DIA', 'PENDENTE', 'ISENTO');

-- AlterTable
ALTER TABLE "Organizacao" ADD COLUMN     "contatoEmail" TEXT,
ADD COLUMN     "contatoNome" TEXT,
ADD COLUMN     "contatoTelefone" TEXT,
ADD COLUMN     "limiteArmazenamentoMB" INTEGER,
ADD COLUMN     "limiteProjetos" INTEGER,
ADD COLUMN     "limiteUsuarios" INTEGER,
ADD COLUMN     "notasInternas" TEXT,
ADD COLUMN     "plano" TEXT NOT NULL DEFAULT 'Grátis',
ADD COLUMN     "proximoVencimento" TIMESTAMP(3),
ADD COLUMN     "statusPagamento" "StatusPagamento" NOT NULL DEFAULT 'EM_DIA';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ultimoAcessoEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "detalhe" TEXT,
    "organizacaoId" TEXT,
    "orgNome" TEXT,
    "atorEmail" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminLog_organizacaoId_idx" ON "AdminLog"("organizacaoId");

-- CreateIndex
CREATE INDEX "AdminLog_criadoEm_idx" ON "AdminLog"("criadoEm");
