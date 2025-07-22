import { NextRequest, NextResponse } from "next/server";
import { getDefaultX402Config } from "../../../utils/chat/agentkit/x402";

export async function GET(request: NextRequest) {
  const config = getDefaultX402Config();

  return NextResponse.json({
    message: "This endpoint always requires payment",
    x402Config: {
      enabled: config.enabled,
      network: config.network,
      walletAddress: config.walletAddress,
      usdcContract: config.usdcContract,
    },
  });
}

export async function POST(request: NextRequest) {
  const config = getDefaultX402Config();

  // Always return 402 Payment Required
  return NextResponse.json(
    {
      error: "Payment Required",
      message: "This endpoint requires x402 payment",
      instructions: {
        method: "exact",
        token: config.usdcContract,
        amount: config.queryPrice,
        recipient: config.walletAddress,
        nonce: Math.floor(Date.now() / 1000).toString(),
        deadline: (Math.floor(Date.now() / 1000) + 3600).toString(),
      },
    },
    {
      status: 402,
      headers: {
        "x-payment-method": "exact",
        "x-payment-token": config.usdcContract,
        "x-payment-amount": config.queryPrice,
        "x-payment-recipient": config.walletAddress,
        "x-payment-nonce": Math.floor(Date.now() / 1000).toString(),
        "x-payment-deadline": (Math.floor(Date.now() / 1000) + 3600).toString(),
      },
    },
  );
}
