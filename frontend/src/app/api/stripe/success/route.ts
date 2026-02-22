import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(new URL("/subscription", request.url));
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const userId = session.client_reference_id || session.metadata?.userId;

    if (userId && session.subscription && session.payment_status === "paid") {
      const sub = await stripe.subscriptions.retrieve(
        session.subscription as string
      ) as any;

      await fetch(`${API_URL}/api/subscription/webhook/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: parseInt(userId),
          stripe_subscription_id: sub.id,
          stripe_customer_id: session.customer as string,
          status: "active",
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
        }),
      });
    }
  } catch (err) {
    console.error("Failed to sync subscription:", err);
  }

  return NextResponse.redirect(new URL("/chat?subscribed=true", request.url));
}
