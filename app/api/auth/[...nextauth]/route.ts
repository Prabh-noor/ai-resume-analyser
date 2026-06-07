// import NextAuth from "next-auth"
// // import GithubProvider from "next-auth/providers/github"
// import GoogleProvider from "next-auth/providers/google";

// export const authOptions = {
//   // Configure one or more authentication providers
//   providers: [
//     // GithubProvider({
//     //   clientId: process.env.GITHUB_ID,
//     //   clientSecret: process.env.GITHUB_SECRET,
//     // }),
//     GoogleProvider({
//       clientId: process.env.GOOGLE_ID,
//       clientSecret: process.env.GOOGLE_SECRET,
//       authorization: {
//         params: {
//           prompt: "consent",
//           access_type: "offline",
//           response_type: "code"
//         }
//       }
//     })
//     // ...add more providers here
//   ],
//   callbacks: {
//     async signIn({ account, profile }) {
//       console.log("Next auth callback -->>>", account, profile);
//       if (account.provider === "google") {
//         // return profile.email_verified && profile.email.endsWith("@example.com")
//       }
//       return true // Do different verification for other providers that don't have `email_verified`
//     },
//   }
// }



// export default NextAuth(authOptions)

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
});

export { handler as GET, handler as POST };