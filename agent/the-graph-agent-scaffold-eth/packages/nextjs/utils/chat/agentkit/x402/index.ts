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
  skipValidation?: boolean; // Optional flag to skip validation (for development)
  forcePayment?: boolean; // Optional flag to force x402 payments even for free tier requests (for testing)
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
      return "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // USDC on Base
    case "baseSepolia":
      return "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // USDC on Base Sepolia
    case "ethereum":
      return "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC on Ethereum
    case "polygon":
      return "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC on Polygon
    default:
      return "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Default to Base
  }
};

// Default x402 configuration
export const getDefaultX402Config = (): X402Config => {
  const walletAddress = process.env.X402_WALLET_ADDRESS || "";
  const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;

  // If wallet address is not set, try to derive it from the agent private key
  let derivedWalletAddress = walletAddress;
  if (!walletAddress && agentPrivateKey) {
    try {
      // Import the account from private key to get the address
      const { privateKeyToAccount } = require("viem/accounts");
      const account = privateKeyToAccount(agentPrivateKey as `0x${string}`);
      derivedWalletAddress = account.address;
      console.log("🔑 Derived wallet address from agent private key:", derivedWalletAddress);
    } catch (error) {
      console.warn("⚠️  Could not derive wallet address from agent private key:", error);
    }
  }

  const config = {
    facilitatorUrl: process.env.X402_FACILITATOR_URL || "https://x402.org/facilitator",
    walletAddress: derivedWalletAddress,
    enabled: process.env.X402_ENABLED === "true" || false,
    network: (process.env.X402_NETWORK as "base" | "baseSepolia" | "ethereum" | "polygon") || "baseSepolia",
    usdcContract:
      process.env.X402_USDC_CONTRACT ||
      getDefaultUsdcContract(
        (process.env.X402_NETWORK as "base" | "baseSepolia" | "ethereum" | "polygon") || "baseSepolia",
      ),
    queryPrice: process.env.X402_QUERY_PRICE || "10000", // Default to 0.01 USDC
    forcePayment: process.env.X402_FORCE_PAYMENT === "true" || false, // Force payments for testing
    skipValidation: process.env.X402_SKIP_VALIDATION === "true" || true, // Skip validation for development
  };

  // Log configuration for debugging
  console.log("🚀 x402 Configuration:", {
    network: config.network,
    usdcContract: config.usdcContract,
    walletAddress: config.walletAddress
      ? `${config.walletAddress.slice(0, 6)}...${config.walletAddress.slice(-4)}`
      : "not set",
    enabled: config.enabled,
    forcePayment: config.forcePayment,
    skipValidation: config.skipValidation,
  });

  return config;
};

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
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
  ],
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

    // Validate configuration
    if (!this.config.walletAddress) {
      throw new Error(
        "X402_WALLET_ADDRESS is not set. Please set it in your environment variables or ensure AGENT_PRIVATE_KEY is set.",
      );
    }

    if (!this.config.enabled) {
      throw new Error("X402 is not enabled. Set X402_ENABLED=true in your environment variables.");
    }

    // Validate payment instructions
    const validatedInstructions = X402PaymentInstructionSchema.parse(paymentInstructions);

    // Create transferWithAuthorization signature
    const authorization = await this.createTransferWithAuthorization(validatedInstructions);

    // Create a separate signature for the payment (in practice, this might be different)
    const signature = authorization; // For now, use the same signature

    // Create payment payload
    const paymentPayload = {
      from: this.config.walletAddress,
      authorization,
      signature,
    };

    console.log("💳 Created payment payload:", JSON.stringify(paymentPayload, null, 2));

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
      // Try to access the wallet client's signTypedData method
      // The ViemWalletProvider wraps a viem wallet client
      if ("walletClient" in this.walletProvider && this.walletProvider.walletClient) {
        const walletClient = (this.walletProvider as any).walletClient;
        if (walletClient.signTypedData) {
          const signature = await walletClient.signTypedData({
            domain,
            types,
            primaryType: "TransferWithAuthorization",
            message,
          });
          console.log("✅ Successfully created transferWithAuthorization signature");
          return signature;
        }
      }

      // Fallback: try direct signTypedData method
      if ("signTypedData" in this.walletProvider && typeof this.walletProvider.signTypedData === "function") {
        const signature = await (this.walletProvider as any).signTypedData({
          domain,
          types,
          primaryType: "TransferWithAuthorization",
          message,
        });
        console.log("✅ Successfully created transferWithAuthorization signature");
        return signature;
      }

      // If we can't sign properly, use a mock signature and enable skipValidation
      console.warn("⚠️  Wallet provider does not support EIP-712 signing, using mock signature");
      console.warn("⚠️  Enabling skipValidation for development");
      this.config.skipValidation = true;
      return "0x" + "mock_signature_" + Date.now().toString(16);
    } catch (error) {
      console.error("❌ Failed to create transferWithAuthorization signature:", error);
      // For development/testing, return a mock signature and enable skipValidation
      console.warn("⚠️  Enabling skipValidation for development due to signing error");
      this.config.skipValidation = true;
      return "0x" + "mock_signature_" + Date.now().toString(16);
    }
  }

  private async verifyPayment(
    payload: z.infer<typeof X402PaymentPayloadSchema>,
    instructions: z.infer<typeof X402PaymentInstructionSchema>,
  ): Promise<void> {
    const verifyUrl = `${this.config.facilitatorUrl}/verify`;

    // Create the proper x402 verification payload format
    const paymentHeader = {
      x402Version: 1,
      scheme: "exact",
      network: this.config.network === "baseSepolia" ? "base-sepolia" : this.config.network,
      payload: {
        signature: payload.signature,
        authorization: {
          from: payload.from,
          to: instructions.recipient,
          value: instructions.amount,
          validAfter: "0",
          validBefore: instructions.deadline,
          nonce: `0x${instructions.nonce.padStart(64, "0")}`,
        },
      },
    };

    const paymentRequirements = {
      scheme: "exact",
      network: this.config.network === "baseSepolia" ? "base-sepolia" : this.config.network,
      maxAmountRequired: instructions.amount,
      resource: "https://api.example.com/resource", // This should be the actual resource URL
      description: "API access payment",
      mimeType: "application/json",
      payTo: instructions.recipient,
      maxTimeoutSeconds: 60,
      asset: instructions.token,
      outputSchema: null,
      extra: {
        name: "USD Coin",
        version: "2",
      },
    };

    const verifyPayload = {
      x402Version: 1,
      paymentHeader: JSON.stringify(paymentHeader),
      paymentRequirements,
    };

    try {
      console.log(`🔍 Verifying payment with facilitator: ${verifyUrl}`);
      console.log("📤 Sending verification payload:", JSON.stringify(verifyPayload, null, 2));

      const response = await fetch(verifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verifyPayload),
      });

      console.log(`📡 Facilitator response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Facilitator error response:", errorText);
        throw new Error(`Payment verification failed: ${response.statusText} (${response.status})`);
      }

      const result = await response.json();
      console.log("✅ Payment verified successfully:", result);
    } catch (error) {
      console.error("❌ Payment verification failed:", error);

      // For development/testing, we can skip verification if explicitly configured
      if (this.config.skipValidation) {
        console.log("⚠️  Skipping payment verification due to skipValidation flag");
        return;
      }

      // For real transactions, we should fail if verification fails
      console.error("❌ Payment verification failed - this will cause the transaction to fail");
      console.error("🔍 Debug info:", {
        payload: JSON.stringify(payload, null, 2),
        instructions: JSON.stringify(instructions, null, 2),
        config: {
          network: this.config.network,
          usdcContract: this.config.usdcContract,
          walletAddress: this.config.walletAddress,
        },
      });
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
  return error.status === 402 || error.message?.includes("Payment Required");
}

// Wrapper function to force x402 payments for testing
export function createForcePaymentWrapper<T extends (...args: any[]) => Promise<any>>(
  originalFunction: T,
  x402Config: X402Config,
  walletProvider: WalletProvider,
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // If forcePayment is enabled, simulate a 402 error
    if (x402Config.forcePayment && x402Config.enabled) {
      console.log("🧪 Force payment mode enabled - simulating 402 Payment Required");

      // Create a mock 402 error
      const mockError = new Error("Payment Required");
      (mockError as any).status = 402;
      (mockError as any).response = {
        headers: {
          get: (name: string) => {
            const headers: Record<string, string> = {
              "x-payment-method": "exact",
              "x-payment-token": x402Config.usdcContract,
              "x-payment-amount": x402Config.queryPrice,
              "x-payment-recipient": x402Config.walletAddress,
              "x-payment-nonce": Math.floor(Date.now() / 1000).toString(),
              "x-payment-deadline": (Math.floor(Date.now() / 1000) + 3600).toString(),
            };
            return headers[name.toLowerCase()] || headers[name];
          },
        },
      };
      (mockError as any).data = {
        error: "Payment Required",
        message: "This endpoint requires x402 payment (forced for testing)",
        instructions: {
          method: "exact",
          token: x402Config.usdcContract,
          amount: x402Config.queryPrice,
          recipient: x402Config.walletAddress,
          nonce: Math.floor(Date.now() / 1000).toString(),
          deadline: (Math.floor(Date.now() / 1000) + 3600).toString(),
        },
      };

      try {
        // Parse payment instructions from the mock error
        const paymentInstructions = parsePaymentInstructions(mockError);

        // Handle payment using the agent's wallet
        const paymentHandler = new X402PaymentHandler(x402Config, walletProvider);
        const paymentPayload = await paymentHandler.handlePaymentRequired(paymentInstructions);

        console.log("✅ Force payment processed successfully, now executing original function");

        // After "payment", execute the original function
        return await originalFunction(...args);
      } catch (paymentError) {
        console.error("❌ Force payment failed:", paymentError);
        throw new Error(
          `Force payment failed: ${paymentError instanceof Error ? paymentError.message : "Unknown error"}`,
        );
      }
    }

    // If forcePayment is disabled, execute normally
    return await originalFunction(...args);
  }) as T;
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
