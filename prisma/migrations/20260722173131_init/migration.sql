-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN', 'GESTOR', 'USUARIO');

-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "StatusProjeto" AS ENUM ('PLANEJAMENTO', 'EM_ANDAMENTO', 'PAUSADA', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "StatusSubEtapa" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "StatusItemRDO" AS ENUM ('OK', 'ATENCAO', 'PROBLEMA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'USUARIO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "recebeNotificacoes" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoCliente" NOT NULL DEFAULT 'PF',
    "cpfCnpj" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projeto" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'Residencial',
    "descricao" TEXT,
    "endereco" TEXT,
    "areaM2" DOUBLE PRECISION,
    "status" "StatusProjeto" NOT NULL DEFAULT 'PLANEJAMENTO',
    "dataInicioPrev" TIMESTAMP(3) NOT NULL,
    "dataFimPrev" TIMESTAMP(3) NOT NULL,
    "valorContrato" DOUBLE PRECISION,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" TEXT NOT NULL,
    "responsavelId" TEXT,

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtapaProjeto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "inicioPrev" TIMESTAMP(3) NOT NULL,
    "fimPrev" TIMESTAMP(3) NOT NULL,
    "inicioReal" TIMESTAMP(3),
    "fimReal" TIMESTAMP(3),
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "projetoId" TEXT NOT NULL,

    CONSTRAINT "EtapaProjeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubEtapa" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusSubEtapa" NOT NULL DEFAULT 'PENDENTE',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "concluidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etapaId" TEXT NOT NULL,

    CONSTRAINT "SubEtapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiarioObra" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "clima" TEXT,
    "maoDeObra" TEXT,
    "atividades" TEXT,
    "ocorrencias" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projetoId" TEXT NOT NULL,
    "criadoPorId" TEXT,

    CONSTRAINT "DiarioObra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemChecklistRDO" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "status" "StatusItemRDO" NOT NULL DEFAULT 'OK',
    "observacao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "diarioId" TEXT NOT NULL,

    CONSTRAINT "ItemChecklistRDO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotoRDO" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "legenda" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diarioId" TEXT NOT NULL,

    CONSTRAINT "FotoRDO_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Projeto_clienteId_idx" ON "Projeto"("clienteId");

-- CreateIndex
CREATE INDEX "DiarioObra_projetoId_data_idx" ON "DiarioObra"("projetoId", "data");

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaProjeto" ADD CONSTRAINT "EtapaProjeto_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubEtapa" ADD CONSTRAINT "SubEtapa_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "EtapaProjeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiarioObra" ADD CONSTRAINT "DiarioObra_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiarioObra" ADD CONSTRAINT "DiarioObra_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemChecklistRDO" ADD CONSTRAINT "ItemChecklistRDO_diarioId_fkey" FOREIGN KEY ("diarioId") REFERENCES "DiarioObra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoRDO" ADD CONSTRAINT "FotoRDO_diarioId_fkey" FOREIGN KEY ("diarioId") REFERENCES "DiarioObra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
