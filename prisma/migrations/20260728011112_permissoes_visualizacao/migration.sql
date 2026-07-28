-- AlterTable
ALTER TABLE "Documento" ADD COLUMN     "restrito" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verCustosEquipe" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "verDocsRestritos" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "verFinanceiro" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "verOrcamentos" BOOLEAN NOT NULL DEFAULT true;
