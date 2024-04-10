import NextAuth, { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { stripe } from "@/lib/stripe"

const githubId = process.env.GITHUB_ID
const githubSecret = process.env.GITHUB_SECRET
const googleId = process.env.GOOGLE_ID
const googleSecret = process.env.GOOGLE_SECRET

if (!githubId || !githubSecret){
    throw new Error('Missing GITHUB_ID or GITHUB_SECRET environnement variable')
}
if (!googleId || !googleSecret){
    throw new Error('Missing GOOGLE_ID or GOOGLE_SECRET environnement variable')
}

export const authConfig = {
    providers: [
        GithubProvider({
            clientId: githubId,
            clientSecret: githubSecret,
        }),
        GoogleProvider({
            clientId: googleId,
            clientSecret: googleSecret,
        }),
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST,
                port: Number(process.env.EMAIL_SERVER_PORT),
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD
                }
            },
            from: process.env.EMAIL_FROM
        })
    ],
    callbacks: {
        session: async ({session, user}) => {
            if(session.user) {
                session.user.id = user.id
            }
            return session;
        }
    },
    adapter: PrismaAdapter(prisma),
    events: {
        createUser: async (message) => {
            const userId = message.user.id
            const email = message.user.email
            const name = message.user.name

            if (!userId || !email) {
                return
            }

            const stripeCustomer = await stripe.customers.create({
                email,
                name: name ?? undefined
            })

            await prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    stripeCustomerId: stripeCustomer.id
                }
            })
        }
    }
} satisfies NextAuthOptions

export default NextAuth(authConfig)