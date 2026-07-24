-- CreateEnum
CREATE TYPE "Disciplina" AS ENUM ('ARQUITETONICO', 'ESTRUTURAL', 'ELETRICO', 'HIDRAULICO', 'CLIMATIZACAO', 'INCENDIO', 'PAISAGISMO', 'INTERIORES', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusAprovacao" AS ENUM ('PREPARACAO', 'PROTOCOLADO', 'EM_ANALISE', 'EXIGENCIA', 'APROVADO', 'INDEFERIDO');

-- AlterTable
ALTER TABLE "Documento" ADD COLUMN     "disciplina" "Disciplina" NOT NULL DEFAULT 'OUTRO',
ADD COLUMN     "prancha" TEXT,
ADD COLUMN     "revisao" TEXT;

-- CreateTable
CREATE TABLE "Aprovacao" (
    "id" TEXT NOT NULL,
    "orgao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "numeroProtocolo" TEXT,
    "dataProtocolo" TIMESTAMP(3),
    "prazo" TIMESTAMP(3),
    "status" "StatusAprovacao" NOT NULL DEFAULT 'PREPARACAO',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizacaoId" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "responsavelId" TEXT,

    CONSTRAINT "Aprovacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApontamentoHoras" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "horas" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT,
    "valorHora" DOUBLE PRECISION,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizacaoId" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "userId" TEXT,
    "etapaId" TEXT,

    CONSTRAINT "ApontamentoHoras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Aprovacao_organizacaoId_idx" ON "Aprovacao"("organizacaoId");

-- CreateIndex
CREATE INDEX "Aprovacao_projetoId_idx" ON "Aprovacao"("projetoId");

-- CreateIndex
CREATE INDEX "ApontamentoHoras_organizacaoId_idx" ON "ApontamentoHoras"("organizacaoId");

-- CreateIndex
CREATE INDEX "ApontamentoHoras_projetoId_idx" ON "ApontamentoHoras"("projetoId");

-- AddForeignKey
ALTER TABLE "Aprovacao" ADD CONSTRAINT "Aprovacao_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aprovacao" ADD CONSTRAINT "Aprovacao_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApontamentoHoras" ADD CONSTRAINT "ApontamentoHoras_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApontamentoHoras" ADD CONSTRAINT "ApontamentoHoras_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApontamentoHoras" ADD CONSTRAINT "ApontamentoHoras_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "EtapaProjeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
