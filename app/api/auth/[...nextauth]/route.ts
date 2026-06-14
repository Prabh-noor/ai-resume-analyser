import { supabaseAdmin } from "@/app/lib/supabase-admin";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

if (!process.env.GOOGLE_ID || !process.env.GOOGLE_SECRET) {
  throw new Error("Missing Google OAuth environment variables");
}
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      console.log("User Signed In", user);
      // Fires every time user logs in
      const response = await supabaseAdmin.from("users").upsert({
        email: user.email,
        fullname: user.name,
        image: user.image,
        auth_type: 'google'
      }, {
        onConflict: "email" // if email exists, update instead of duplicate
      });
      console.log("Supabase response", response);
      return true; // returning true allows the sign in to proceed otherwise access denied page gets shown
    },
  }
});

export { handler as GET, handler as POST };