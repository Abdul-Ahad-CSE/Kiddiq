import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log("[AuthDebug] authorize called with email:", credentials?.email);
          if (!credentials?.email || !credentials?.password) {
            console.log("[AuthDebug] Missing email or password");
            return null;
          }

          // Case insensitive query and trim whitespace
          const emailInput = credentials.email.toLowerCase().trim();
          const user = await prisma.user.findUnique({
            where: { email: emailInput }
          });
          
          console.log("[AuthDebug] User query result:", user ? { id: user.id, email: user.email, role: user.role, isActive: user.isActive } : "NULL");

          if (!user) {
            console.log("[AuthDebug] User not found in database");
            return null;
          }

          if (!user.isActive) {
            console.log("[AuthDebug] User account is suspended");
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          console.log("[AuthDebug] Password comparison valid?", isPasswordValid);

          if (!isPasswordValid) {
            console.log("[AuthDebug] Password validation failed");
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            isActive: user.isActive,
          };
        } catch (error) {
          console.error("[AuthDebug] Exception occurred in authorize method:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
