import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Papel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { estaBloqueado, registrarFalha, limparTentativas } from "@/lib/rate-limit";

const credenciaisSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
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

        const fwd = request?.headers?.get("x-forwarded-for") ?? "";
        const ip = fwd.split(",")[0].trim() || "desconhecido";
        const chaveEmail = `email:${parsed.data.email.toLowerCase()}`;
        const chaveIp = `ip:${ip}`;
        if (estaBloqueado(chaveEmail) || estaBloqueado(chaveIp)) return null;

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user || !user.ativo) {
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

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          papel: user.papel,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.papel = user.papel;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.papel = token.papel as Papel;
      }
      return session;
    },
  },
});
