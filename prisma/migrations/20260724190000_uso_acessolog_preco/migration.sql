-- AlterTable: preço mensal cobrado do escritório (base do MRR)
ALTER TABLE "Organizacao" ADD COLUMN "precoMensal" DOUBLE PRECISION;

-- CreateTable: histórico de acessos (logins) para o painel de uso
CREATE TABLE "AcessoLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userNome" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "organizacaoId" TEXT,
    "orgNome" TEXT,
    "ip" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcessoLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcessoLog_organizacaoId_idx" ON "AcessoLog"("organizacaoId");

-- CreateIndex
CREATE INDEX "AcessoLog_criadoEm_idx" ON "AcessoLog"("criadoEm");
