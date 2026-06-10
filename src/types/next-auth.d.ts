import { DefaultSession, DefaultUser } from "next-auth";
import { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: Role;
    permissions: string[];
    isActive: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    permissions: string[];
  }
}
