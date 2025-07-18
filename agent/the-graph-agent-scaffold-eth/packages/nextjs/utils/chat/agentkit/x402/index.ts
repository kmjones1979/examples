import { WalletProvider } from "@coinbase/agentkit";
import { z } from "zod";

// x402 payment configuration
export interface X402Config {
  facilitatorUrl: string;
  walletAddress: string;
  enabled: boolean;
  network: "base" | "baseSepolia" | "ethereum" | "polygon";
  usdcContract: string;
  queryPrice: string; // Amount in smallest unit (e.g., "10000" for 0.01 USDC with 6 decimals)
  skipValidation?: boolean; // Optional flag to skip validation (for chat context)
}

// x402 payment instruction schema
export const X402PaymentInstructionSchema = z.object({
  method: z.literal("exact"),
  token: z.string(),
  amount: z.string(),
  recipient: z.string(),
  nonce: z.string(),
  deadline: z.string(),
});

// x402 payment payload schema
export const X402PaymentPayloadSchema = z.object({
  from: z.string(),
  authorization: z.string(), // transferWithAuthorization signature
  signature: z.string(),
});

// x402 error response schema
export const X402ErrorSchema = z.object({
  status: z.literal(402),
  message: z.string(),
  paymentInstructions: X402PaymentInstructionSchema,
});

// Helper function to get default USDC contract based on network
const getDefaultUsdcContract = (network: "base" | "baseSepolia" | "ethereum" | "polygon"): string => {
  switch (network) {
    case "base":
      return "0xA0b86a33E6441c0a8C6f8A0b8e1d7BcF2eD3c0e2"; // USDC on Base
    case "baseSepolia":
      return "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // USDC on Base Sepolia
    case "ethereum":
      return "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC on Ethereum
    case "polygon":
      return "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"; // USDC on Polygon
    default:
      return "0xA0b86a33E6441c0a8C6f8A0b8e1d7BcF2eD3c0e2"; // Default to Base
  }
};

// Default x402 configuration
export const getDefaultX402Config = (): X402Config => ({
  facilitatorUrl: process.env.X402_FACILITATOR_URL || "https://facilitator.x402.org",
  walletAddress: process.env.X402_WALLET_ADDRESS || "",
  enabled: process.env.X402_ENABLED === "true" || false,
  network: (process.env.X402_NETWORK as "base" | "baseSepolia" | "ethereum" | "polygon") || "base",
  usdcContract:
    process.env.X402_USDC_CONTRACT ||
    getDefaultUsdcContract((process.env.X402_NETWORK as "base" | "baseSepolia" | "ethereum" | "polygon") || "base"),
  queryPrice: process.env.X402_QUERY_PRICE || "10000", // Default to 0.01 USDC
});

// EIP-712 domain for transferWithAuthorization
export const getEIP712Domain = (config: X402Config) => ({
  name: "USD Coin",
  version: "2",
  chainId:
    config.network === "base"
      ? 8453
      : config.network === "baseSepolia"
        ? 84532
        : config.network === "ethereum"
          ? 1
          : 137,
  verifyingContract: config.usdcContract,
});

// EIP-712 types for transferWithAuthorization
export const EIP712_TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};

// x402 payment handler class
export class X402PaymentHandler {
  private config: X402Config;
  private walletProvider: WalletProvider;

  constructor(config: X402Config, walletProvider: WalletProvider) {
    this.config = config;
    this.walletProvider = walletProvider;
  }

  async handlePaymentRequired(
    paymentInstructions: z.infer<typeof X402PaymentInstructionSchema>,
  ): Promise<z.infer<typeof X402PaymentPayloadSchema>> {
    console.log("💳 Processing x402 payment:", paymentInstructions);

    // Validate payment instructions
    const validatedInstructions = X402PaymentInstructionSchema.parse(paymentInstructions);

    // Create transferWithAuthorization signature
    const authorization = await this.createTransferWithAuthorization(validatedInstructions);

    // Create payment payload
    const paymentPayload = {
      from: this.config.walletAddress,
      authorization,
      signature: authorization, // In practice, this would be a separate signature
    };

    // Verify payment with facilitator
    await this.verifyPayment(paymentPayload, validatedInstructions);

    return paymentPayload;
  }

  private async createTransferWithAuthorization(
    instructions: z.infer<typeof X402PaymentInstructionSchema>,
  ): Promise<string> {
    console.log("📝 Creating transferWithAuthorization signature");

    const domain = getEIP712Domain(this.config);
    const types = EIP712_TRANSFER_WITH_AUTHORIZATION_TYPES;

    const message = {
      from: this.config.walletAddress,
      to: instructions.recipient,
      value: instructions.amount,
      validAfter: "0",
      validBefore: instructions.deadline,
      nonce: `0x${instructions.nonce.padStart(64, "0")}`,
    };

    try {
      // Use the wallet provider to sign the EIP-712 message
      // Note: Check if the wallet provider supports EIP-712 signing
      if ("signTypedData" in this.walletProvider && typeof this.walletProvider.signTypedData === "function") {
        const signature = await (this.walletProvider as any).signTypedData(domain, types, message);
        console.log("✅ Successfully created transferWithAuthorization signature");
        return signature;
      } else {
        console.warn("⚠️  Wallet provider does not support EIP-712 signing, using mock signature");
        return "0x" + "mock_signature_" + Date.now().toString(16);
      }
    } catch (error) {
      console.error("❌ Failed to create transferWithAuthorization signature:", error);
      // For development/testing, return a mock signature
      return "0x" + "mock_signature_" + Date.now().toString(16);
    }
  }

  private async verifyPayment(
    payload: z.infer<typeof X402PaymentPayloadSchema>,
    instructions: z.infer<typeof X402PaymentInstructionSchema>,
  ): Promise<void> {
    const verifyUrl = `${this.config.facilitatorUrl}/verify`;

    const verifyPayload = {
      payment: payload,
      instructions,
    };

    try {
      const response = await fetch(verifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verifyPayload),
      });

      if (!response.ok) {
        throw new Error(`Payment verification failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Payment verified successfully:", result);
    } catch (error) {
      console.error("❌ Payment verification failed:", error);
      throw error;
    }
  }
}

// Helper function to parse payment instructions from 402 error
export function parsePaymentInstructions(error: any): z.infer<typeof X402PaymentInstructionSchema> {
  // Try to parse x402 headers from the error response
  if (error.response?.headers) {
    const headers = error.response.headers;

    // Look for x402 payment headers
    const paymentMethod = headers["x-payment-method"];
    const paymentToken = headers["x-payment-token"];
    const paymentAmount = headers["x-payment-amount"];
    const paymentRecipient = headers["x-payment-recipient"];
    const paymentNonce = headers["x-payment-nonce"];
    const paymentDeadline = headers["x-payment-deadline"];

    if (paymentMethod && paymentToken && paymentAmount && paymentRecipient) {
      return {
        method: "exact",
        token: paymentToken,
        amount: paymentAmount,
        recipient: paymentRecipient,
        nonce: paymentNonce || Math.floor(Date.now() / 1000).toString(),
        deadline: paymentDeadline || (Math.floor(Date.now() / 1000) + 3600).toString(),
      };
    }
  }

  // Fallback to default payment instructions
  console.log("🔄 Using default payment instructions");
  const defaultConfig = getDefaultX402Config();
  return {
    method: "exact",
    token: defaultConfig.usdcContract,
    amount: defaultConfig.queryPrice,
    recipient: defaultConfig.walletAddress,
    nonce: Math.floor(Date.now() / 1000).toString(),
    deadline: (Math.floor(Date.now() / 1000) + 3600).toString(), // 1 hour
  };
}

// Helper function to retry tool invocation with payment
export async function retryWithPayment(
  tool: any,
  args: any,
  paymentPayload: z.infer<typeof X402PaymentPayloadSchema>,
): Promise<any> {
  // Add payment headers to the request
  const argsWithPayment = {
    ...args,
    headers: {
      ...args.headers,
      "X-Payment-Method": "exact",
      "X-Payment-From": paymentPayload.from,
      "X-Payment-Authorization": paymentPayload.authorization,
      "X-Payment-Signature": paymentPayload.signature,
    },
  };

  console.log("🔄 Retrying request with payment headers");

  // Retry the tool invocation
  if (typeof tool === "function") {
    return await tool(argsWithPayment);
  } else if (tool && typeof tool.execute === "function") {
    return await tool.execute(argsWithPayment);
  } else if (tool && typeof tool.invoke === "function") {
    return await tool.invoke(argsWithPayment);
  } else {
    throw new Error("Unable to retry tool invocation - no compatible method found");
  }
}

// Helper function to check if an error is a 402 Payment Required error
export function isPaymentRequiredError(error: any): boolean {
  return (
    error.status === 402 ||
    error.statusCode === 402 ||
    error.message?.includes("Payment Required") ||
    error.message?.includes("402")
  );
}

// Helper function to create x402 payment middleware for API routes
export function createX402Middleware(config: X402Config) {
  return async (req: any, res: any, next: any) => {
    if (!config.enabled) {
      return next();
    }

    // Check if payment is required for this endpoint
    const paymentRequired = shouldRequirePayment(req);

    if (paymentRequired) {
      // Check for payment headers
      const paymentHeaders = extractPaymentHeaders(req);

      if (!paymentHeaders) {
        // Send 402 Payment Required response
        return res.status(402).json({
          error: "Payment Required",
          instructions: {
            method: "exact",
            token: config.usdcContract,
            amount: config.queryPrice,
            recipient: config.walletAddress,
            nonce: Math.floor(Date.now() / 1000).toString(),
            deadline: (Math.floor(Date.now() / 1000) + 3600).toString(),
          },
        });
      }

      // Verify payment
      try {
        await verifyPaymentHeaders(paymentHeaders, config);
      } catch (error) {
        return res.status(402).json({
          error: "Payment verification failed",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    next();
  };
}

// Helper functions for middleware
function shouldRequirePayment(req: any): boolean {
  // Define your payment requirements here
  // For example, require payment for certain endpoints or based on usage
  return req.path.includes("/api/mcp/") || req.path.includes("/api/subgraph/");
}

function extractPaymentHeaders(req: any): any | null {
  const headers = req.headers;

  if (headers["x-payment-method"] && headers["x-payment-from"] && headers["x-payment-authorization"]) {
    return {
      method: headers["x-payment-method"],
      from: headers["x-payment-from"],
      authorization: headers["x-payment-authorization"],
      signature: headers["x-payment-signature"],
    };
  }

  return null;
}

async function verifyPaymentHeaders(paymentHeaders: any, config: X402Config): Promise<void> {
  const verifyUrl = `${config.facilitatorUrl}/verify`;

  const response = await fetch(verifyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payment: paymentHeaders,
      network: config.network,
    }),
  });

  if (!response.ok) {
    throw new Error(`Payment verification failed: ${response.statusText}`);
  }
}
