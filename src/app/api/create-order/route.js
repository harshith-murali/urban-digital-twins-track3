import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    const { amount, planName } = await req.json();

    const order = await razorpay.orders.create({
      amount:   amount * 100, // Razorpay expects paise (1 INR = 100 paise)
      currency: "INR",
      receipt:  `receipt_${planName}_${Date.now()}`,
      notes:    { plan: planName },
    });

    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error("Razorpay order error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
