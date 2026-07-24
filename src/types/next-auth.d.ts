import type { Papel } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    papel?: Papel;
    organizacaoId?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      papel: Papel;
      organizacaoId: string | null;
      impersonandoOrgId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    papel?: Papel;
    organizacaoId?: string | null;
    impersonandoOrgId?: string | null;
  }
}
