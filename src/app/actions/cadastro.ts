"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

export type CadastroState = { erro?: string } | undefined;

const schema = z.object({
  escritorio: z.string().min(1),
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6),
});

const DIACRITICOS = /[̀-ͯ]/g;

function slugify(s: string): string {
  const base = s
    .normalize("NFD")
    .replace(DIACRITICOS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "escritorio";
}

export async function cadastrar(_prev: CadastroState, formData: FormData): Promise<CadastroState> {
  const parsed = schema.safeParse({
    escritorio: formData.get("escritorio"),
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) return { erro: "Preencha todos os campos (senha com ao menos 6 caracteres)." };
  const d = parsed.data;
  const email = d.email.toLowerCase();

  if (await prisma.user.findUnique({ where: { email } })) {
    return { erro: "Este e-mail já está em uso." };
  }

  // slug único a partir do nome do escritório
  const base = slugify(d.escritorio);
  let slug = base;
  let i = 1;
  while (await prisma.organizacao.findUnique({ where: { slug } })) slug = `${base}-${++i}`;

  const org = await prisma.organizacao.create({ data: { nome: d.escritorio, slug } });
  await prisma.user.create({
    data: {
      organizacaoId: org.id,
      nome: d.nome,
      email,
      senhaHash: await bcrypt.hash(d.senha, 10),
      papel: "ADMIN",
      ativo: true,
      recebeNotificacoes: true,
    },
  });

  try {
    await signIn("credentials", { email, senha: d.senha, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { erro: "Conta criada! Não foi possível entrar automaticamente — faça login." };
    }
    throw error; // redirect de sucesso é tratado pelo framework
  }
  return undefined;
}
