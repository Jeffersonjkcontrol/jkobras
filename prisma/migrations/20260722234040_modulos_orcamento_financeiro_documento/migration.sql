-- CreateEnum
CREATE TYPE "StatusOrcamento" AS ENUM ('RASCUNHO', 'ENVIADO', 'APROVADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "StatusLancamento" AS ENUM ('PREVISTO', 'REALIZADO');

-- CreateEnum
CREATE TYPE "CategoriaDocumento" AS ENUM ('PLANTA', 'CONTRATO', 'LICENCA', 'ORCAMENTO', 'FOTO', 'OUTRO');

-- CreateTable
CREATE TABLE "Orcamento" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "status" "StatusOrcamento" NOT NULL DEFAULT 'RASCUNHO',
    "observacoes" TEXT,
    "validadeDias" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizacaoId" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,

    CONSTRAINT "Orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemOrcamento" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL DEFAULT 'un',
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "valorUnitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "orcamentoId" TEXT NOT NULL,

    CONSTRAINT "ItemOrcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LancamentoFinanceiro" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "TipoLancamento" NOT NULL DEFAULT 'DESPESA',
    "categoria" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "status" "StatusLancamento" NOT NULL DEFAULT 'REALIZADO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizacaoId" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,

    CONSTRAINT "LancamentoFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "CategoriaDocumento" NOT NULL DEFAULT 'OUTRO',
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizacaoId" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "enviadoPorId" TEXT,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Orcamento_organizacaoId_idx" ON "Orcamento"("organizacaoId");

-- CreateIndex
CREATE INDEX "Orcamento_projetoId_idx" ON "Orcamento"("projetoId");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_organizacaoId_idx" ON "LancamentoFinanceiro"("organizacaoId");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_projetoId_idx" ON "LancamentoFinanceiro"("projetoId");

-- CreateIndex
CREATE INDEX "Documento_organizacaoId_idx" ON "Documento"("organizacaoId");

-- CreateIndex
CREATE INDEX "Documento_projetoId_idx" ON "Documento"("projetoId");

-- AddForeignKey
ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOrcamento" ADD CONSTRAINT "ItemOrcamento_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
