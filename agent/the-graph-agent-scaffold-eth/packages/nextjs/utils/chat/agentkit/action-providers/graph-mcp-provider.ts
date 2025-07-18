import { ActionProvider, WalletProvider } from "@coinbase/agentkit";
import { experimental_createMCPClient } from "ai";
import { memoize } from "lodash";
import { z } from "zod";

// A memoized function to create and connect the MCP client.
// This ensures we only establish the connection once.
const getMcpClient = memoize(async () => {
  if (!process.env.GRAPH_API_KEY) {
    throw new Error("GRAPH_API_KEY environment variable not set.");
  }

  const client = await experimental_createMCPClient({
    transport: {
      type: "sse",
      url: "https://subgraphs.mcp.thegraph.com/sse",
      headers: {
        Authorization: `Bearer ${process.env.GRAPH_API_KEY}`,
      },
    },
  });

  return client;
});

// Helper function to get available tools from the MCP client
const getMcpTools = memoize(async () => {
  const client = await getMcpClient();
  const tools = await client.tools();
  return { client, tools };
});

// Helper function to invoke a specific tool by name
async function invokeMcpTool(toolName: string, args: any) {
  const { tools } = await getMcpTools();

  // Debug: Log all available tools
  console.log("Available MCP tools:", Object.keys(tools));
  console.log("Looking for tool:", toolName);
  console.log(
    "Tools object structure:",
    Object.entries(tools).map(([key, tool]) => ({ key, tool: typeof tool, name: (tool as any)?.name })),
  );

  // The tools object might be keyed by tool name directly
  let tool: any = (tools as any)[toolName];

  // If not found by key, try finding by tool.name property
  if (!tool) {
    tool = Object.values(tools).find((t: any) => t?.name === toolName);
  }

  if (!tool) {
    throw new Error(`Tool ${toolName} not found. Available tools: ${Object.keys(tools).join(", ")}`);
  }

  // Invoke the tool directly - try different possible methods
  if (typeof tool === "function") {
    return await tool(args);
  } else if (tool && typeof tool.execute === "function") {
    return await tool.execute(args);
  } else if (tool && typeof tool.invoke === "function") {
    return await tool.invoke(args);
  } else {
    throw new Error(
      `Tool ${toolName} found but no execute/invoke method available. Tool type: ${typeof tool}, keys: ${Object.keys(tool || {}).join(", ")}`,
    );
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
  subgraphId: z.string().optional().describe("The subgraph ID (e.g., 5zvR82...)"),
  deploymentId: z.string().optional().describe("The deployment ID (e.g., 0x...)"),
  ipfsHash: z.string().optional().describe("The IPFS hash (e.g., Qm...)"),
});

const executeMCPQuerySchema = z.object({
  subgraphId: z.string().optional().describe("The subgraph ID to query (e.g., 5zvR82...)"),
  deploymentId: z.string().optional().describe("The deployment ID to query (e.g., 0x...)"),
  ipfsHash: z.string().optional().describe("The IPFS hash to query (e.g., Qm...)"),
  query: z.string().describe("The GraphQL query string"),
  variables: z.record(z.any()).optional().describe("Optional variables for the GraphQL query"),
});

export class GraphMCPProvider implements ActionProvider<WalletProvider> {
  name = "graph-mcp";
  actionProviders = [];
  supportsNetwork = () => true;

  constructor() {
    // The client is now created and managed by the memoized getMcpClient function.
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
            const result = await invokeMcpTool("search_subgraphs_by_keyword", { keyword });
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
            const result = await invokeMcpTool("get_top_subgraph_deployments", {
              contract_address: contractAddress,
              chain,
            });
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
        description:
          "Get the GraphQL schema for a specific subgraph, showing available entities and fields. Provide one of: subgraphId, deploymentId, or ipfsHash.",
        schema: getSchemaSchema,
        severity: "info" as const,
        invoke: async ({ subgraphId, deploymentId, ipfsHash }: z.infer<typeof getSchemaSchema>) => {
          try {
            let toolName = "";
            let toolArgs: { subgraph_id?: string; deployment_id?: string; ipfs_hash?: string } = {};

            if (subgraphId) {
              toolName = "get_schema_by_subgraph_id";
              toolArgs = { subgraph_id: subgraphId };
            } else if (deploymentId) {
              toolName = "get_schema_by_deployment_id";
              toolArgs = { deployment_id: deploymentId };
            } else if (ipfsHash) {
              toolName = "get_schema_by_ipfs_hash";
              toolArgs = { ipfs_hash: ipfsHash };
            } else {
              throw new Error("You must provide one of subgraphId, deploymentId, or ipfsHash.");
            }

            const result = await invokeMcpTool(toolName, toolArgs);
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
        description:
          "Execute a GraphQL query against a subgraph using The Graph's MCP. Provide one of: subgraphId, deploymentId, or ipfsHash.",
        schema: executeMCPQuerySchema,
        severity: "info" as const,
        invoke: async ({
          subgraphId,
          deploymentId,
          ipfsHash,
          query,
          variables = {},
        }: z.infer<typeof executeMCPQuerySchema>) => {
          try {
            let toolName = "";
            let toolArgs: {
              subgraph_id?: string;
              deployment_id?: string;
              ipfs_hash?: string;
              query: string;
              variables?: Record<string, any>;
            } = { query, variables };

            if (subgraphId) {
              toolName = "execute_query_by_subgraph_id";
              toolArgs.subgraph_id = subgraphId;
            } else if (deploymentId) {
              toolName = "execute_query_by_deployment_id";
              toolArgs.deployment_id = deploymentId;
            } else if (ipfsHash) {
              toolName = "execute_query_by_ipfs_hash";
              toolArgs.ipfs_hash = ipfsHash;
            } else {
              throw new Error("You must provide one of subgraphId, deploymentId, or ipfsHash.");
            }
            const result = await invokeMcpTool(toolName, toolArgs);
            return JSON.stringify(result, null, 2);
          } catch (error) {
            return JSON.stringify({
              error: error instanceof Error ? error.message : "Failed to execute MCP query",
            });
          }
        },
      },
      {
        name: "listMCPTools",
        description: "List all available tools from the MCP server for debugging purposes.",
        schema: z.object({}),
        severity: "info" as const,
        invoke: async () => {
          try {
            const { tools } = await getMcpTools();
            const toolList = Object.entries(tools).map(([key, tool]: [string, any]) => ({
              key,
              name: tool.name || "unknown",
              description: tool.description || "no description",
            }));
            return JSON.stringify({ availableTools: toolList }, null, 2);
          } catch (error) {
            return JSON.stringify({
              error: error instanceof Error ? error.message : "Failed to list MCP tools",
            });
          }
        },
      },
    ];
  }
}

export const graphMCPProvider = () => new GraphMCPProvider();
