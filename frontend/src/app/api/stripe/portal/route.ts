import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-12-18.acacia" as any,
  });
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get customer ID from backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const subRes = await fetch(`${API_URL}/api/subscription/status`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const subData = await subRes.json();

    if (!subData.has_subscription) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 400 }
      );
    }

    // Find Stripe customer by metadata
    const meRes = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const meData = await meRes.json();

    // Search for customers with this email
    const customers = await stripe.customers.list({
      email: meData.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${process.env.NEXTAUTH_URL}/chat`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
