import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

function adminEmails() {
  const fromEnv = process.env.ADMIN_EMAILS ?? "";
  const emails = fromEnv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length) return emails;
  return ["test@cityquest.app"];
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password ?? "";

        // Test user for local/dev browsing.
        // Swap this with your JSON API call later.
        const TEST_EMAIL = "test@cityquest.app";
        const TEST_PASSWORD = "CityQuest@123";

        if (!email || !password) return null;
        if (email.toLowerCase() !== TEST_EMAIL || password !== TEST_PASSWORD) {
          return null;
        }

        const isAdmin = adminEmails().includes(TEST_EMAIL);
        return {
          id: TEST_EMAIL,
          name: "Test Explorer",
          email: TEST_EMAIL,
          role: isAdmin ? "admin" : "user",
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me",
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      (session as unknown as { role?: string }).role =
        (token as unknown as { role?: string }).role ?? "user";
      return session;
    },
  },
};

