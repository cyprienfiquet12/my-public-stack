import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY!;

export const POST = async (req: NextRequest) => {
    const body = await req.text();
    const signature = headers().get("stripe-signature") as string
    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
      } catch (err) {
        return new Response(`Webhook Error: ${err}`, {
          status: 400,
        });
      }
    switch(event.type) {
        case "checkout.session.completed": { 
            const session = event.data.object as Stripe.Checkout.Session
            const stripeCustomerId = session.customer
            const user = await finUserFromCustomerId(stripeCustomerId)
            console.log(user)
            if (!user.id){
                break;
            }
            console.log("ADD SESSION ")
            await prisma.user.update({
                where:{
                    id: user.id
                },
                data: {
                    plan: "PREMIUM"
                }
            })
            break;
        }
        case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice
            const stripeCustomerId = invoice.customer
            const user = await finUserFromCustomerId(stripeCustomerId)
            if (!user.id){
                break;
            }
            await prisma.user.update({
                where:{
                    id: user.id
                },
                data: {
                    plan: "PREMIUM"
                }
            })
            break;
        }
        case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice
            const stripeCustomerId = invoice.customer
            const user = await finUserFromCustomerId(stripeCustomerId)
            if (!user.id){
                break;
            }
            await prisma.user.update({
                where:{
                    id: user.id
                },
                data: {
                    plan: "FREE"
                }
            })
            break;
        }
        case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription
            const stripeCustomerId = subscription.customer
            const user = await finUserFromCustomerId(stripeCustomerId)
            if (!user.id){
                break;
            }
            await prisma.user.update({
                where:{
                    id: user.id
                },
                data: {
                    plan: "FREE"
                }
            })
            break;
        }
        }
        return NextResponse.json({
            ok: true
        })
    }

export const finUserFromCustomerId = async (stripeCustomerId: unknown) => {
    console.log(stripeCustomerId)
    if(typeof stripeCustomerId !== "string") {
        return null;
    }
    return prisma.user.findFirst({
        where: {
            stripeCustomerId
        }
    })
}