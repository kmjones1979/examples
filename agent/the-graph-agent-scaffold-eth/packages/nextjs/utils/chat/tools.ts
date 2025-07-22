import { contractInteractor } from "./agentkit/action-providers/contract-interactor";
import { graphMCPProvider } from "./agentkit/action-providers/graph-mcp-provider";
import { SUBGRAPH_ENDPOINTS, graphQuerierProvider } from "./agentkit/action-providers/graph-querier";
import { smartWalletAnalyzerProvider } from "./agentkit/action-providers/smart-wallet-analyzer";
import { testX402Provider } from "./agentkit/action-providers/test-x402-provider";
import { tokenApiProvider } from "./agentkit/action-providers/token-api-provider";
import { agentKitToTools } from "./agentkit/framework-extensions/ai-sdk";
import { getDefaultX402Config } from "./agentkit/x402";
import { AgentKit, ViemWalletProvider, walletActionProvider } from "@coinbase/agentkit";
import { tool } from "ai";
import fetch from "node-fetch";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { z } from "zod";

export { SUBGRAPH_ENDPOINTS };

export async function createAgentKit() {
  const walletClient = createWalletClient({
    account: privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`),
    chain: foundry,
    transport: http(),
  });
  const viemWalletProvider = new ViemWalletProvider(walletClient as any);

  // Get X402 configuration for agent to handle payments internally
  const x402Config = {
    ...getDefaultX402Config(),
    enabled: true, // Enable x402 for agent to handle payments
    forcePayment: true, // Force x402 payments to test real transactions
    skipValidation: true, // Skip validation for development to avoid facilitator issues
  };

  console.log("🚀 x402 Configuration:", {
    network: x402Config.network,
    usdcContract: x402Config.usdcContract,
    walletAddress: x402Config.walletAddress
      ? `${x402Config.walletAddress.slice(0, 6)}...${x402Config.walletAddress.slice(-4)}`
      : "not set",
    enabled: x402Config.enabled,
    forcePayment: x402Config.forcePayment,
    skipValidation: x402Config.skipValidation,
  });

  // Use the base wallet provider - x402 payments will be handled in action providers
  const agentKit = await AgentKit.from({
    walletProvider: viemWalletProvider,
    actionProviders: [
      walletActionProvider(),
      contractInteractor(foundry.id),
      graphQuerierProvider(x402Config),
      graphMCPProvider(x402Config),
      smartWalletAnalyzerProvider(x402Config),
      tokenApiProvider(x402Config),
      testX402Provider(x402Config),
    ],
  });

  return { agentKit, address: walletClient.account.address };
}

export function getTools(agentKit: AgentKit) {
  const tools = agentKitToTools(agentKit);

  return {
    ...tools,
    showTransaction: tool({
      description: "Show the transaction hash",
      parameters: z.object({
        transactionHash: z.string().describe("The transaction hash to show"),
      }),
      execute: async ({ transactionHash }) => {
        return {
          transactionHash,
        };
      },
    }),
  };
}

export const querySubgraph = {
  name: "querySubgraph",
  description: "Query a subgraph using GraphQL",
  parameters: {
    type: "object",
    properties: {
      endpoint: {
        type: "string",
        description: "The subgraph endpoint URL",
      },
      query: {
        type: "string",
        description: "The GraphQL query string",
      },
      variables: {
        type: "object",
        description: "Optional variables for the GraphQL query",
      },
    },
    required: ["endpoint", "query"],
  },
  async handler({
    endpoint,
    query,
    variables = {},
  }: {
    endpoint: string;
    query: string;
    variables?: Record<string, any>;
  }) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "An unknown error occurred" };
    }
  },
};
