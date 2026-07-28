-- AlterTable
ALTER TABLE "Documento" ADD COLUMN     "visivelCliente" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PortalCliente" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "expiraEm" TIMESTAMP(3),
    "visitas" INTEGER NOT NULL DEFAULT 0,
    "ultimoAcessoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mostrarCronograma" BOOLEAN NOT NULL DEFAULT true,
    "mostrarDiario" BOOLEAN NOT NULL DEFAULT true,
    "mostrarDocumentos" BOOLEAN NOT NULL DEFAULT true,
    "mostrarAprovacoes" BOOLEAN NOT NULL DEFAULT true,
    "organizacaoId" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,

    CONSTRAINT "PortalCliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortalCliente_token_key" ON "PortalCliente"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PortalCliente_projetoId_key" ON "PortalCliente"("projetoId");

-- CreateIndex
CREATE INDEX "PortalCliente_organizacaoId_idx" ON "PortalCliente"("organizacaoId");

-- AddForeignKey
ALTER TABLE "PortalCliente" ADD CONSTRAINT "PortalCliente_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
