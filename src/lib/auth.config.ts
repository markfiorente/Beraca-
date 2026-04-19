import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no Prisma, no bcrypt — used by middleware
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const session = auth;

      if (pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/api/setup")) {
        if (session && pathname === "/login") {
          return Response.redirect(new URL("/dashboard", request.url));
        }
        return true;
      }

      if (pathname.startsWith("/api/")) return true;

      if (!session) {
        return Response.redirect(new URL("/login", request.url));
      }

      if (pathname.startsWith("/admin") && session.user.role !== "ADMIN") {
        return Response.redirect(new URL("/dashboard", request.url));
      }

      return true;
    },
  },
  providers: [],
};
