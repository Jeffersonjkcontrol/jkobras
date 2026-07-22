import type { Papel } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    papel?: Papel;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      papel: Papel;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    papel?: Papel;
  }
}
