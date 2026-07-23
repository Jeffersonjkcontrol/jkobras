-- CreateEnum
CREATE TYPE "TipoCusto" AS ENUM ('DIARIA', 'HORA', 'EMPREITADA', 'MENSALISTA');

-- CreateEnum
CREATE TYPE "StatusTarefa" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA');

-- AlterTable
ALTER TABLE "SubEtapa" ADD COLUMN     "responsavelProfId" TEXT;

-- CreateTable
CREATE TABLE "Profissional" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "funcao" TEXT NOT NULL,
    "tipoCusto" "TipoCusto" NOT NULL DEFAULT 'DIARIA',
    "custoValor" DOUBLE PRECISION,
    "telefone" TEXT,
    "cpf" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "contatoEmergencia" TEXT,
    "chavePix" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizacaoId" TEXT NOT NULL,

    CONSTRAINT "Profissional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlocacaoProjeto" (
    "id" TEXT NOT NULL,
    "funcaoNaObra" TEXT,
    "tipoCusto" "TipoCusto" NOT NULL DEFAULT 'DIARIA',
    "custoValor" DOUBLE PRECISION,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizacaoId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,

    CONSTRAINT "AlocacaoProjeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarefaProfissional" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusTarefa" NOT NULL DEFAULT 'PENDENTE',
    "prazo" TIMESTAMP(3),
    "custo" DOUBLE PRECISION,
    "concluidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizacaoId" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "profissionalId" TEXT,

    CONSTRAINT "TarefaProfissional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Profissional_organizacaoId_idx" ON "Profissional"("organizacaoId");

-- CreateIndex
CREATE INDEX "AlocacaoProjeto_organizacaoId_idx" ON "AlocacaoProjeto"("organizacaoId");

-- CreateIndex
CREATE INDEX "AlocacaoProjeto_projetoId_idx" ON "AlocacaoProjeto"("projetoId");

-- CreateIndex
CREATE UNIQUE INDEX "AlocacaoProjeto_profissionalId_projetoId_key" ON "AlocacaoProjeto"("profissionalId", "projetoId");

-- CreateIndex
CREATE INDEX "TarefaProfissional_organizacaoId_idx" ON "TarefaProfissional"("organizacaoId");

-- CreateIndex
CREATE INDEX "TarefaProfissional_projetoId_idx" ON "TarefaProfissional"("projetoId");

-- AddForeignKey
ALTER TABLE "SubEtapa" ADD CONSTRAINT "SubEtapa_responsavelProfId_fkey" FOREIGN KEY ("responsavelProfId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profissional" ADD CONSTRAINT "Profissional_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlocacaoProjeto" ADD CONSTRAINT "AlocacaoProjeto_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlocacaoProjeto" ADD CONSTRAINT "AlocacaoProjeto_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarefaProfissional" ADD CONSTRAINT "TarefaProfissional_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarefaProfissional" ADD CONSTRAINT "TarefaProfissional_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
