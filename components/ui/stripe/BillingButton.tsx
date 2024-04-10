import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

export const BillingButton = () => {
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
          const stripeSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId ?? "",
            return_url: "http://localhost:3000/account/settings",
          });
          if (!stripeSession.url) {
            throw new Error("Session url missing");
          }
          redirect(stripeSession.url);
        }}
      >
        Account settings
      </button>
    </form>
  );
};
