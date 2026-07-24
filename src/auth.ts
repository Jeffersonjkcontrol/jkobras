import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Papel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { estaBloqueado, registrarFalha, limparTentativas } from "@/lib/rate-limit";
import { orgBloqueada } from "@/lib/tenant";

const credenciaisSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      authorize: async (credenciais, request) => {
        const parsed = credenciaisSchema.safeParse(credenciais);
        if (!parsed.success) return null;

        // IP do cliente vindo do proxy CONFIÁVEL (Caddy define X-Real-IP com o
        // peer real). Não usamos o 1º item do X-Forwarded-For porque o cliente
        // pode forjá-lo e furar o limite por IP. Fallback: último salto do XFF.
        const realIp = request?.headers?.get("x-real-ip")?.trim();
        const fwd = request?.headers?.get("x-forwarded-for") ?? "";
        const xffUltimo = fwd ? fwd.split(",").pop()!.trim() : "";
        const ip = realIp || xffUltimo || "desconhecido";
        const chaveEmail = `email:${parsed.data.email.toLowerCase()}`;
        const chaveIp = `ip:${ip}`;
        if (estaBloqueado(chaveEmail) || estaBloqueado(chaveIp)) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { organizacao: { select: { ativa: true, trialAte: true } } },
        });
        if (!user || !user.ativo) {
          registrarFalha(chaveEmail);
          registrarFalha(chaveIp);
          return null;
        }
        // Bloqueia login se o escritório estiver desativado ou com o teste vencido.
        if (user.organizacao && orgBloqueada(user.organizacao)) {
          registrarFalha(chaveEmail);
          registrarFalha(chaveIp);
          return null;
        }

        const senhaOk = await bcrypt.compare(parsed.data.senha, user.senhaHash);
        if (!senhaOk) {
          registrarFalha(chaveEmail);
          registrarFalha(chaveIp);
          return null;
        }

        limparTentativas(chaveEmail);
        limparTentativas(chaveIp);

        // Registra o último acesso (para o painel do super-admin ver atividade).
        await prisma.user.update({ where: { id: user.id }, data: { ultimoAcessoEm: new Date() } }).catch(() => {});

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          papel: user.papel,
          organizacaoId: user.organizacaoId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.papel = user.papel;
        token.organizacaoId = user.organizacaoId ?? null;
      }
      // Super-admin entrando/saindo da simulação de um escritório (impersonação).
      if (trigger === "update" && session && typeof session === "object") {
        token.impersonandoOrgId = (session as { impersonandoOrgId?: string | null }).impersonandoOrgId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.papel = token.papel as Papel;
        session.user.organizacaoId = (token.organizacaoId as string | null) ?? null;
        session.user.impersonandoOrgId = (token.impersonandoOrgId as string | null) ?? null;
      }
      return session;
    },
  },
});
