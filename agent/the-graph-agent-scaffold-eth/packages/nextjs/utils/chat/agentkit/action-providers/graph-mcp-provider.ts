import { ActionProvider, WalletProvider } from "@coinbase/agentkit";
import { z } from "zod";

// MCP Client for The Graph
class GraphMCPClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(graphApiKey: string) {
    this.baseUrl = "https://subgraphs.mcp.thegraph.com";
    this.headers = {
      Authorization: `Bearer ${graphApiKey}`,
      "Content-Type": "application/json",
    };
  }

  async searchSubgraphs(keyword: string) {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        method: "search_subgraphs_by_keyword",
        params: { keyword },
      }),
    });

    if (!response.ok) {
      throw new Error(`MCP search failed: ${response.status}`);
    }

    return response.json();
  }

  async getTopSubgraphsForContract(contractAddress: string, chain: string) {
    const response = await fetch(`${this.baseUrl}/contract-subgraphs`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        method: "get_top_subgraph_deployments",
        params: { contract_address: contractAddress, chain },
      }),
    });

    if (!response.ok) {
      throw new Error(`MCP contract subgraph lookup failed: ${response.status}`);
    }

    return response.json();
  }

  async getSubgraphSchema(subgraphId: string) {
    const response = await fetch(`${this.baseUrl}/schema`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        method: "get_schema_by_subgraph_id",
        params: { subgraph_id: subgraphId },
      }),
    });

    if (!response.ok) {
      throw new Error(`MCP schema fetch failed: ${response.status}`);
    }

    return response.json();
  }

  async executeQuery(subgraphId: string, query: string, variables?: Record<string, any>) {
    const response = await fetch(`${this.baseUrl}/query`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        method: "execute_query_by_subgraph_id",
        params: { subgraph_id: subgraphId, query, variables },
      }),
    });

    if (!response.ok) {
      throw new Error(`MCP query execution failed: ${response.status}`);
    }

    return response.json();
  }
}

// Schema definitions
const searchSubgraphsSchema = z.object({
  keyword: z.string().describe("Keyword to search for in subgraph names and descriptions"),
});

const getContractSubgraphsSchema = z.object({
  contractAddress: z.string().describe("The contract address to find subgraphs for"),
  chain: z.string().describe("The blockchain network (e.g., 'mainnet', 'polygon', 'arbitrum-one')"),
});

const getSchemaSchema = z.object({
  subgraphId: z.string().describe("The subgraph ID to get the schema for"),
});

const executeMCPQuerySchema = z.object({
  subgraphId: z.string().describe("The subgraph ID to query"),
  query: z.string().describe("The GraphQL query string"),
  variables: z.record(z.any()).optional().describe("Optional variables for the GraphQL query"),
});

export class GraphMCPProvider implements ActionProvider<WalletProvider> {
  name = "graph-mcp";
  actionProviders = [];
  supportsNetwork = () => true;

  private mcpClient: GraphMCPClient;

  constructor() {
    const graphApiKey = process.env.GRAPH_API_KEY;
    if (!graphApiKey) {
      throw new Error("GRAPH_API_KEY not found in environment variables");
    }
    this.mcpClient = new GraphMCPClient(graphApiKey);
  }

  getActions(walletProvider: WalletProvider) {
    return [
      {
        name: "searchSubgraphs",
        description: "Search for subgraphs by keyword using The Graph's MCP. Returns relevant subgraphs with metadata.",
        schema: searchSubgraphsSchema,
        severity: "info" as const,
        invoke: async ({ keyword }: z.infer<typeof searchSubgraphsSchema>) => {
          try {
            const result = await this.mcpClient.searchSubgraphs(keyword);
            return JSON.stringify(result, null, 2);
          } catch (error) {
            return JSON.stringify({
              error: error instanceof Error ? error.message : "Failed to search subgraphs",
            });
          }
        },
      },
      {
        name: "getContractSubgraphs",
        description: "Find the top subgraphs that index a specific contract address on a given blockchain.",
        schema: getContractSubgraphsSchema,
        severity: "info" as const,
        invoke: async ({ contractAddress, chain }: z.infer<typeof getContractSubgraphsSchema>) => {
          try {
            const result = await this.mcpClient.getTopSubgraphsForContract(contractAddress, chain);
            return JSON.stringify(result, null, 2);
          } catch (error) {
            return JSON.stringify({
              error: error instanceof Error ? error.message : "Failed to get contract subgraphs",
            });
          }
        },
      },
      {
        name: "getSubgraphSchema",
        description: "Get the GraphQL schema for a specific subgraph, showing available entities and fields.",
        schema: getSchemaSchema,
        severity: "info" as const,
        invoke: async ({ subgraphId }: z.infer<typeof getSchemaSchema>) => {
          try {
            const result = await this.mcpClient.getSubgraphSchema(subgraphId);
            return JSON.stringify(result, null, 2);
          } catch (error) {
            return JSON.stringify({
              error: error instanceof Error ? error.message : "Failed to get subgraph schema",
            });
          }
        },
      },
      {
        name: "executeMCPQuery",
        description: "Execute a GraphQL query against a subgraph using The Graph's MCP protocol.",
        schema: executeMCPQuerySchema,
        severity: "info" as const,
        invoke: async ({ subgraphId, query, variables = {} }: z.infer<typeof executeMCPQuerySchema>) => {
          try {
            const result = await this.mcpClient.executeQuery(subgraphId, query, variables);
            return JSON.stringify(result, null, 2);
          } catch (error) {
            return JSON.stringify({
              error: error instanceof Error ? error.message : "Failed to execute MCP query",
            });
          }
        },
      },
    ];
  }
}

export const graphMCPProvider = () => new GraphMCPProvider();
