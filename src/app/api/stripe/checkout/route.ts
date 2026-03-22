import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

export async function POST() {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
      return NextResponse.json(
        { error: "Payments are being set up. Please try again soon or contact support@careladder.app." },
        { status: 503 }
      );
    }
    const stripe = getStripe();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user already has a Stripe customer ID
    const { data: center } = await supabase
      .from("centers")
      .select("id, stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = center?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id, center_id: center?.id || "" },
      });
      customerId = customer.id;

      if (center?.id) {
        await supabase
          .from("centers")
          .update({ stripe_customer_id: customerId })
          .eq("id", center.id);
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://grantready.vercel.app"}/dashboard?subscribed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://grantready.vercel.app"}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
