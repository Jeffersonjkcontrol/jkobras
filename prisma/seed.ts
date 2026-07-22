import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

async function main() {
  // Super-admin (dono da plataforma, sem organização)
  await prisma.user.upsert({
    where: { email: "super@obras.com" },
    update: {},
    create: {
      nome: "Super Admin",
      email: "super@obras.com",
      senhaHash: await bcrypt.hash("super123", 10),
      papel: "SUPER_ADMIN",
      ativo: true,
    },
  });

  // Escritório demo (tenant)
  const org = await prisma.organizacao.upsert({
    where: { slug: "escritorio-demo" },
    update: {},
    create: { nome: "Escritório Demo", slug: "escritorio-demo" },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@obras.com" },
    update: {},
    create: {
      organizacaoId: org.id,
      nome: "Administrador",
      email: "admin@obras.com",
      senhaHash: await bcrypt.hash("admin123", 10),
      papel: "ADMIN",
      ativo: true,
      recebeNotificacoes: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "gestor@obras.com" },
    update: {},
    create: {
      organizacaoId: org.id,
      nome: "Gestor de Obra",
      email: "gestor@obras.com",
      senhaHash: await bcrypt.hash("gestor123", 10),
      papel: "GESTOR",
      ativo: true,
    },
  });

  if ((await prisma.cliente.count({ where: { organizacaoId: org.id } })) === 0) {
    const hoje = new Date();
    const cliente = await prisma.cliente.create({
      data: {
        organizacaoId: org.id,
        nome: "Família Silva",
        tipo: "PF",
        telefone: "(19) 99999-0000",
        endereco: "Rua das Acácias, 100 — Campinas/SP",
      },
    });
    const proj = await prisma.projeto.create({
      data: {
        organizacaoId: org.id,
        titulo: "Residência Silva",
        tipo: "Residencial",
        clienteId: cliente.id,
        endereco: "Rua das Acácias, 100 — Campinas/SP",
        areaM2: 180,
        status: "EM_ANDAMENTO",
        dataInicioPrev: new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1),
        dataFimPrev: new Date(hoje.getFullYear(), hoje.getMonth() + 3, 1),
        valorContrato: 450000,
        responsavelId: admin.id,
        descricao: "Construção de residência unifamiliar de 180 m².",
      },
    });
    const etapas = [
      { nome: "Fundação", di: -30, df: -5, prog: 100 },
      { nome: "Estrutura", di: -5, df: 20, prog: 40 },
      { nome: "Alvenaria", di: 20, df: 55, prog: 0 },
      { nome: "Acabamento", di: 55, df: 90, prog: 0 },
    ];
    let ordem = 1;
    for (const e of etapas) {
      await prisma.etapaProjeto.create({
        data: {
          organizacaoId: org.id,
          projetoId: proj.id,
          nome: e.nome,
          ordem: ordem++,
          inicioPrev: addDays(hoje, e.di),
          fimPrev: addDays(hoje, e.df),
          progresso: e.prog,
          inicioReal: e.prog > 0 ? addDays(hoje, e.di) : null,
          fimReal: e.prog >= 100 ? addDays(hoje, e.df) : null,
        },
      });
    }
  }

  console.log(
    "Seed multi-tenant concluído. super@obras.com/super123 (painel) · admin@obras.com/admin123 · gestor@obras.com/gestor123 (Escritório Demo)"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
