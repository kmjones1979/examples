import { NextRequest, NextResponse } from "next/server";
import { graphMCPProvider } from "../../../utils/chat/agentkit/action-providers/graph-mcp-provider";
import { createX402Middleware, getDefaultX402Config } from "../../../utils/chat/agentkit/x402";

// Initialize x402 configuration
const x402Config = getDefaultX402Config();

// Create x402 middleware
const x402Middleware = createX402Middleware(x402Config);

/**
 * API Route for MCP operations with x402 payment support
 */
export async function POST(request: NextRequest) {
  try {
    // Apply x402 middleware if enabled
    if (x402Config.enabled) {
      // Check payment requirements
      const paymentHeaders = extractPaymentHeaders(request);

      if (!paymentHeaders && shouldRequirePayment(request)) {
        return NextResponse.json(
          {
            error: "Payment Required",
            instructions: {
              method: "exact",
              token: x402Config.usdcContract,
              amount: x402Config.queryPrice,
              recipient: x402Config.walletAddress,
              nonce: Math.floor(Date.now() / 1000).toString(),
              deadline: (Math.floor(Date.now() / 1000) + 3600).toString(), // 1 hour
            },
          },
          {
            status: 402,
            headers: {
              "X-Payment-Method": "exact",
              "X-Payment-Token": x402Config.usdcContract,
              "X-Payment-Amount": x402Config.queryPrice,
              "X-Payment-Recipient": x402Config.walletAddress,
              "X-Payment-Nonce": Math.floor(Date.now() / 1000).toString(),
              "X-Payment-Deadline": (Math.floor(Date.now() / 1000) + 3600).toString(),
            },
          },
        );
      }
    }

    // Parse request body
    const body = await request.json();
    const { action, params } = body;

    // Create Graph MCP provider instance
    const provider = graphMCPProvider(x402Config);

    // Mock wallet provider for demonstration
    const mockWalletProvider = {
      getAddress: async () => x402Config.walletAddress,
      signMessage: async (message: string) => `0x${"mock_signature".repeat(8)}`,
      // Add other required methods as needed
    };

    // Get available actions
    const actions = provider.getActions(mockWalletProvider as any);

    // Find the requested action
    const actionHandler = actions.find(a => a.name === action);
    if (!actionHandler) {
      return NextResponse.json({ error: `Action '${action}' not found` }, { status: 400 });
    }

    // Execute the action
    const result = await actionHandler.invoke(params);

    return NextResponse.json({
      success: true,
      action,
      result: JSON.parse(result),
      paymentEnabled: x402Config.enabled,
    });
  } catch (error) {
    console.error("❌ MCP API Error:", error);

    // Check if it's a payment required error
    if (error instanceof Error && error.message.includes("Payment Required")) {
      return NextResponse.json(
        {
          error: "Payment Required",
          details: error.message,
          instructions: {
            method: "exact",
            token: x402Config.usdcContract,
            amount: x402Config.queryPrice,
            recipient: x402Config.walletAddress,
            nonce: Math.floor(Date.now() / 1000).toString(),
            deadline: (Math.floor(Date.now() / 1000) + 3600).toString(),
          },
        },
        { status: 402 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint for listing available actions
 */
export async function GET() {
  try {
    const provider = graphMCPProvider(x402Config);

    // Mock wallet provider for demonstration
    const mockWalletProvider = {
      getAddress: async () => x402Config.walletAddress,
      signMessage: async (message: string) => `0x${"mock_signature".repeat(8)}`,
    };

    const actions = provider.getActions(mockWalletProvider as any);

    return NextResponse.json({
      availableActions: actions.map(action => ({
        name: action.name,
        description: action.description,
        schema: action.schema,
      })),
      x402Config: {
        enabled: x402Config.enabled,
        facilitatorUrl: x402Config.facilitatorUrl,
        network: x402Config.network,
      },
    });
  } catch (error) {
    console.error("❌ MCP API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Helper functions
function extractPaymentHeaders(request: NextRequest): any | null {
  const headers = request.headers;

  if (headers.get("x-payment-method") && headers.get("x-payment-from") && headers.get("x-payment-authorization")) {
    return {
      method: headers.get("x-payment-method"),
      from: headers.get("x-payment-from"),
      authorization: headers.get("x-payment-authorization"),
      signature: headers.get("x-payment-signature"),
    };
  }

  return null;
}

function shouldRequirePayment(request: NextRequest): boolean {
  // Define payment requirements based on your business logic
  // For demo purposes, require payment for all MCP operations
  return true;
}
