import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-12-18.acacia" as any,
  });
}

async function syncSubscription(data: Record<string, unknown>) {
  await fetch(`${API_URL}/api/subscription/webhook/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      if (userId && session.subscription) {
        const sub = (await stripe.subscriptions.retrieve(
          session.subscription as string
        )) as any;
        await syncSubscription({
          user_id: parseInt(userId),
          stripe_subscription_id: sub.id,
          stripe_customer_id: session.customer as string,
          status: "active",
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as any;
      await syncSubscription({
        stripe_subscription_id: sub.id,
        status: sub.status === "active" ? "active" : sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscription({
        stripe_subscription_id: sub.id,
        status: "canceled",
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        await syncSubscription({
          stripe_subscription_id: invoice.subscription as string,
          status: "past_due",
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
