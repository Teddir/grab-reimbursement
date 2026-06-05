import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"

import Credentials from "next-auth/providers/credentials"
import { createHash } from "crypto"

// Helper to hash passwords so plain text is NEVER stored in source code
const hashPassword = (password: string) => {
  return createHash('sha256').update(password).digest('hex')
}

// Daftar user hardcoded (Tanpa Database)
// Password diubah menjadi HASH (SHA-256) demi keamanan. 
// Untuk menambah user baru: hitung SHA256 dari password mereka, lalu tambahkan ke array ini.
const STATIC_USERS = [
  { id: "1", email: "divakhaliza@gmail.com", hash: "502cd08518689e0d02416102d3f173c706c560495ab401a785f67d9126e76612", name: "Diva Khaliza" },
  { id: "2", email: "fenti.sukainvestamaprima@gmail.com", hash: "85f4109a1d75f949530651d4f182757ee4dc4f88fbb1431ad0d0c8b226dd28e4", name: "Fenti" },
  { id: "3", email: "kelvinfauzian.asiasistem@outlook.com", hash: "0d20a17945803855fba29c5c33b90be1ae05c1af0b17121c1ad70b5eb875aa22", name: "Kelvin Fauzian" },
  { id: "4", email: "jonathan_lim.asiasistem@outlook.com", hash: "bdef69926db0937ec93ee3a66c6926156933948b236f959cc3d01a880c483ddf", name: "Jonathan Lim" },
]

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
      checks: ["state"], // Bypasses PKCE proxy cookie bugs
    }),
    Credentials({
      name: "Email Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        // Cek email dan bandingkan Hash dari password yang diinput
        const user = STATIC_USERS.find(
          (u) => u.email === credentials.email && u.hash === hashPassword(credentials.password as string)
        )
        
        if (user) {
          return { id: user.id, email: user.email, name: user.name }
        }
        return null // Login gagal
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
})
