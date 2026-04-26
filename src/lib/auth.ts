import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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

        return {
          id: TEST_EMAIL,
          name: "Test Explorer",
          email: TEST_EMAIL,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me",
  pages: {
    signIn: "/login",
  },
};

