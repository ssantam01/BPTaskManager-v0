// Actualizar la configuración de NextAuth para manejar mejor las variables de entorno y añadir seguridad adicional

import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

// Verificar que las variables de entorno estén definidas
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("Advertencia: Variables de entorno para Google OAuth no están configuradas correctamente")
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Añadir el ID del usuario a la sesión para que podamos usarlo en nuestra aplicación
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, account }) {
      // Persistir la información del proveedor en el token
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
      }
      return token
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirigir a login en caso de error
  },
  secret: process.env.NEXTAUTH_SECRET || "un-secreto-seguro-para-desarrollo",
})

export { handler as GET, handler as POST }
