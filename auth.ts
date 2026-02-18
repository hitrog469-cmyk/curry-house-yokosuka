import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const supabase = getSupabaseAdmin()
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, phone, role, password_hash, is_active, user_id, created_at')
          .eq('email', credentials.email as string)
          .single()

        if (error || !profile) return null
        if (!profile.is_active) return null
        if (!profile.password_hash) return null

        const valid = await bcrypt.compare(credentials.password as string, profile.password_hash)
        if (!valid) return null

        return {
          id: profile.id,
          email: profile.email,
          name: profile.full_name,
          role: profile.role,
          phone: profile.phone,
          user_id: profile.user_id,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth (Google), auto-create profile if it doesn't exist
      if (account?.provider === 'google' && user.email) {
        const supabase = getSupabaseAdmin()

        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', user.email)
          .single()

        if (!existing) {
          // Create new profile for Google user
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              email: user.email,
              full_name: user.name || '',
              role: 'customer',
              is_active: true,
            })
            .select('id, role, phone, user_id')
            .single()

          if (newProfile) {
            user.id = newProfile.id
            ;(user as any).role = newProfile.role
            ;(user as any).phone = newProfile.phone || ''
            ;(user as any).user_id = newProfile.user_id
          }
        } else {
          // Fetch existing profile data
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, phone, full_name, user_id')
            .eq('email', user.email)
            .single()

          if (profile) {
            user.id = profile.id
            user.name = profile.full_name || user.name
            ;(user as any).role = profile.role
            ;(user as any).phone = profile.phone || ''
            ;(user as any).user_id = profile.user_id
          }
        }
      }

      return true
    },

    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, attach profile data to token
      if (user) {
        token.role = (user as any).role || 'customer'
        token.phone = (user as any).phone || ''
        token.user_id = (user as any).user_id || null
        token.full_name = user.name || ''
        token.profile_id = user.id
      }

      // On session update (e.g., after profile edit), refresh from DB
      if (trigger === 'update' && session) {
        token.full_name = session.full_name ?? token.full_name
        token.phone = session.phone ?? token.phone
        token.role = session.role ?? token.role
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.profile_id as string
        ;(session.user as any).role = token.role as string
        ;(session.user as any).phone = token.phone as string
        ;(session.user as any).user_id = token.user_id as number | null
        ;(session.user as any).full_name = token.full_name as string
      }
      return session
    },
  },
})
