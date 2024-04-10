import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

export const BuyButton = () => {
  return (
    <form>
      <button
        formAction={async () => {
          "use server";
          const session = await getAuthSession();
          const user = await prisma.user.findUnique({
            where: {
              id: session?.user.id ?? "",
            },
            select: {
              stripeCustomerId: true,
              plan: true,
            },
          });
          const stripeCustomerId = user.stripeCustomerId ?? undefined;
          const stripeSession = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: "subscription",
            payment_method_types: ["card", "link"],
            line_items: [
              {
                price: process.env.PREMIUM_PRICE,
                quantity: 1,
              },
            ],
            success_url: `http://localhost:3000/success`,
            cancel_url: `http://localhost:3000/cancel`,
          });

          if (!stripeSession.url) {
            throw new Error("Session url missing");
          }
          redirect(stripeSession.url);
        }}
      >
        Upgrade to premium
      </button>
    </form>
  );
};
