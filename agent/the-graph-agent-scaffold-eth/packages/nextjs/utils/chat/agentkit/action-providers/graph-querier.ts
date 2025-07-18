import type { X402Config } from "../x402";
import { ActionProvider, WalletProvider } from "@coinbase/agentkit";
import { z } from "zod";

const UNISWAP_V3_SUBGRAPH_ID = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";
const AAVE_V3_SUBGRAPH_ID = "JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk";

type EndpointGetter = () => string;

export const SUBGRAPH_ENDPOINTS: Record<string, string | EndpointGetter> = {
  UNISWAP_V3: () => {
    const apiKey = process.env.GRAPH_API_KEY;
    if (!apiKey) throw new Error("GRAPH_API_KEY not found in environment variables");
    return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${UNISWAP_V3_SUBGRAPH_ID}`;
  },
  AAVE_V3: () => {
    const apiKey = process.env.GRAPH_API_KEY;
    if (!apiKey) throw new Error("GRAPH_API_KEY not found in environment variables");
    return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${AAVE_V3_SUBGRAPH_ID}`;
  },
};

const graphQuerySchema = z.object({
  endpoint: z
    .string()
    .or(z.function().returns(z.string()))
    .describe("The subgraph endpoint URL or function that returns it"),
  query: z.string().describe("The GraphQL query string"),
  variables: z.record(z.any()).optional().describe("Optional variables for the GraphQL query"),
});

// Helper function to validate payment for X402
const validatePayment = (config: X402Config, actionName: string): void => {
  if (config.enabled) {
    // Check if we're in a chat context (payment handled at route level)
    if (process.env.NODE_ENV === "development" && config.skipValidation) {
      return; // Skip validation in chat context
    }

    // In a real implementation, you would validate payment headers here
    // For now, we'll throw an error to trigger the 402 response
    throw new Error(`Payment Required for ${actionName}. Please provide valid payment authorization.`);
  }
};

export class GraphQuerierProvider implements ActionProvider<WalletProvider> {
  name = "graph-querier";
  actionProviders = [];
  supportsNetwork = () => true;
  private x402Config: X402Config;

  constructor(x402Config: X402Config) {
    this.x402Config = x402Config;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getActions(walletProvider: WalletProvider) {
    return [
      {
        name: "querySubgraph",
        description: "Query a subgraph using GraphQL",
        schema: graphQuerySchema,
        severity: "info",
        invoke: async ({ endpoint, query, variables = {} }: z.TypeOf<typeof graphQuerySchema>) => {
          try {
            // Validate payment if X402 is enabled
            validatePayment(this.x402Config, "querySubgraph");

            const resolvedEndpoint = typeof endpoint === "function" ? endpoint() : endpoint;

            const response = await fetch(resolvedEndpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query, variables }),
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            return JSON.stringify(data);
          } catch (error) {
            return JSON.stringify({
              error: error instanceof Error ? error.message : "An unknown error occurred",
            });
          }
        },
      },
    ];
  }
}

export const graphQuerierProvider = (x402Config: X402Config) => new GraphQuerierProvider(x402Config);
