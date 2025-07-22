# 🏗 Scaffold-ETH with AI Agent and The Graph Integration

<h4 align="center">
  <a href="https://docs.scaffoldeth.io">Documentation</a> |
  <a href="https://scaffoldeth.io">Website</a>
</h4>

🧪 An open-source toolkit for building decentralized applications (dapps) on the Ethereum blockchain, enhanced with AI-powered chat capabilities. Built using NextJS, RainbowKit, Foundry/Hardhat, Wagmi, Viem, TypeScript, and OpenAI.

## Table of Contents

### Getting Started

-   [Features](#features)
-   [Requirements](#requirements)
-   [Quick Setup](#quick-setup)
-   [Environment Configuration](#environment-configuration)

### Core Integrations

-   [MCP Integration](#mcp-integration) - Dynamic subgraph discovery and querying
-   [Token API Integration](#token-api-integration) - Comprehensive token data access
-   [NFT API Integration](#nft-api-integration) - NFT analytics and tracking
-   [x402 Payment Integration](#x402-payment-integration) - Micropayments for AI agents

### Usage & Examples

-   [Chat Interaction Examples](#chat-interaction-examples)
    -   [Subgraph MCP Queries](#subgraph-mcp-interaction-via-chat)
    -   [Token API Queries](#token-api-interaction-via-chat)
    -   [NFT API Queries](#nft-api-interaction-via-chat)
-   [Direct API Usage](#direct-api-usage)

### Architecture & Development

-   [System Architecture](#system-architecture)
    -   [Core Components](#core-components)
    -   [Key Files](#key-files)
    -   [Data Flow](#data-flow)
-   [Development Guide](#development-guide)
    -   [Adding New Integrations](#adding-new-integrations)
    -   [Customizing Responses](#customizing-responses)
    -   [Testing Strategies](#testing-strategies)
-   [Available Subgraphs](#available-subgraphs)
-   [Adding New Subgraph Endpoints](#adding-new-subgraph-endpoints)

### Deployment & Operations

-   [Security Best Practices](#security-best-practices)
-   [Performance Optimization](#performance-optimization)
-   [Troubleshooting](#troubleshooting)

### Reference

-   [API Reference](#api-reference)
-   [Contributing](#contributing)
-   [Documentation](#documentation)

## Features

-   ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it
-   🤖 **AI-Powered Chat Interface**: Natural language interaction with blockchain data and smart contracts
-   📊 **GraphQL Integration**: Query blockchain data through The Graph protocol
-   🔌 **MCP Integration**: Direct connection to The Graph's official Model Context Protocol server
-   🎨 **NFT Analytics**: Comprehensive NFT data analysis including collections, ownership, sales, and activity tracking
-   🪙 **Token API**: Full token data access for balances, transfers, metadata, and market information
-   💳 **x402 Payment Integration**: Autonomous micropayments for AI agents using Coinbase's open payment protocol
-   🪝 **[Custom hooks](https://docs.scaffoldeth.io/hooks/)**: Collection of React hooks wrapper around [wagmi](https://wagmi.sh/)
-   🧱 [**Components**](https://docs.scaffoldeth.io/components/): Collection of common web3 components
-   🔥 **Burner Wallet & Local Faucet**: Quickly test your application
-   🔐 **Integration with Wallet Providers**: Connect to different wallet providers

This is a fork of a build [Scaffold-ETH 2 Chat Agent Extension](https://github.com/azf20/chat-agent-extension) by [Adam Fuller](https://github.com/azf20) that showcases a basic static implementation of The Graph using AgentKit Action providers.

## Requirements

Before you begin, you need to install the following tools:

-   [Node (>= v20.18.3)](https://nodejs.org/en/download/)
-   Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
-   [Git](https://git-scm.com/downloads)

## Quick Setup

Get up and running in under 5 minutes:

1. **Clone and Install**:

```bash
git clone https://github.com/graphprotocol/examples.git
cd agent/the-graph-agent-scaffold-eth
yarn install
```

2. **Configure Environment** (create `.env.local`):

```bash
# Required: The Graph Protocol API Key (for MCP and subgraphs)
GRAPH_API_KEY=your-graph-api-key-here

# Required: OpenAI API Key (for AI chat functionality)
OPENAI_API_KEY=your-openai-api-key-here

# Required: NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-nextauth-secret-here

# Optional: Agent Private Key (for on-chain transactions)
AGENT_PRIVATE_KEY=your-agent-private-key-here
```

3. **Start the Application**:

```bash
# Start local blockchain (optional - for smart contract features)
yarn chain

# Deploy test contracts (optional)
yarn deploy

# Start the app
yarn start
```

4. **Access the Interface**:
   Visit `http://localhost:3000` and start chatting with your AI agent!

**Quick Test**: Try asking "_Find Uniswap V3 subgraphs_" or "_What's the USDC balance for vitalik.eth?_"

## Environment Configuration

### Required Environment Variables

Store these in a `.env.local` file at the root of your `packages/nextjs` directory. **Never commit your `.env.local` file to version control.**

1.  **`GRAPH_API_KEY`** - The Graph Protocol API Key

    -   Required for both MCP integration and legacy subgraph queries
    -   Used as Bearer token for The Graph's MCP server authentication
    -   Get your key from [The Graph Studio](https://thegraph.com/studio/)

2.  **`OPENAI_API_KEY`** - OpenAI API Key

    -   Required for AI chat functionality
    -   Set up usage limits to prevent unexpected charges
    -   Get your key from [OpenAI Platform](https://platform.openai.com/)

3.  **`NEXTAUTH_SECRET`** - NextAuth Secret
    -   Required for session management
    -   Generate with: `openssl rand -base64 32`
    -   Keep this secret secure and unique per environment

### Optional Environment Variables

4.  **`AGENT_PRIVATE_KEY`** - Agent's Private Key

    -   Only needed for on-chain transactions
    -   ⚠️ **Development only** - Never use mainnet keys!
    -   Generate with: `openssl rand -hex 32` (prefix with "0x")

5.  **Token API Configuration** (if using external Token API):

    -   `NEXT_PUBLIC_GRAPH_API_URL` - Base URL (defaults to Token API)
    -   `NEXT_PUBLIC_GRAPH_API_KEY` - API key for Token API
    -   `NEXT_PUBLIC_GRAPH_TOKEN` - Alternative Bearer token

6.  **x402 Payment Configuration** (for autonomous micropayments):
    -   `X402_ENABLED` - Enable x402 payments (true/false)
    -   `X402_FACILITATOR_URL` - Facilitator service URL (defaults to https://facilitator.x402.org)
    -   `X402_WALLET_ADDRESS` - Wallet address for payments
    -   `X402_NETWORK` - Network for payments (base/ethereum/polygon)
    -   `X402_USDC_CONTRACT` - USDC contract address for the network

### Environment Setup Example

```bash
# Create .env.local file
cat > .env.local << EOF
# Core Configuration
GRAPH_API_KEY=your-graph-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Optional: For on-chain features
AGENT_PRIVATE_KEY=0x$(openssl rand -hex 32)

# Optional: Token API (if using external service)
NEXT_PUBLIC_GRAPH_API_KEY=your-token-api-key

# Optional: x402 Payment Configuration
X402_ENABLED=false
X402_FACILITATOR_URL=https://facilitator.x402.org
X402_WALLET_ADDRESS=0x...
X402_NETWORK=base
X402_USDC_CONTRACT=0xA0b86a33E6441c0a8C6f8A0b8e1d7BcF2eD3c0e2
EOF
```

### Security Notes

-   Use development keys with limited permissions
-   Store minimal funds in development keys
-   Rotate keys regularly
-   Never commit `.env.local` to version control
-   Use platform-specific secure storage for production deployments

### Core Components

Detailed explanations of the foundational pieces of this application.

1.  **Chat Interface** (`app/chat/page.tsx`)

    -   **Functionality**: Provides the user-facing UI for interacting with the AI agent. Users can type natural language queries related to blockchain data, smart contracts, or token information.
    -   **Technologies**: Built with Next.js (React), utilizing hooks like `useChat` for managing conversation state, input handling, and message streaming.
    -   **Key Aspects**: Supports real-time streaming of AI responses, renders markdown for formatted text, and displays structured information from tool calls (e.g., GraphQL query results).

2.  **AgentKit Integration** (Primarily in `app/api/chat/route.ts` and `utils/chat/agentkit/`)

    -   **Functionality**: The backbone of the AI's ability to perform actions. AgentKit allows the definition of "tools" or "actions" that the AI (e.g., OpenAI GPT model) can invoke to interact with external systems.
    -   **Key Aspects**:
        -   **Action Providers**: Developers can implement `ActionProvider` interfaces (like `GraphQuerierProvider` or the upcoming `TokenApiProvider`) to define specific capabilities (e.g., querying a GraphQL endpoint, fetching token data).
        -   **Tool Definition**: Actions are described with a name, description, and a Zod schema for input validation, making them understandable and usable by the AI.
        -   **Invocation**: The AI decides which tool to use based on the user's query and the provided descriptions. The `app/api/chat/route.ts` orchestrates this.

3.  **MCP Integration** (`utils/chat/agentkit/action-providers/graph-mcp-provider.ts`)

    -   **Functionality**: Connects directly to The Graph's official Model Context Protocol (MCP) server, providing advanced subgraph discovery and querying capabilities.
    -   **Key Aspects**:
        -   **Official MCP Server**: Connects to `https://subgraphs.mcp.thegraph.com/sse` using Server-Sent Events (SSE) transport.
        -   **Dynamic Subgraph Discovery**: Search and discover subgraphs by keyword or contract address.
        -   **Schema Introspection**: Retrieve GraphQL schemas for any subgraph to understand available entities and fields.
        -   **Flexible Querying**: Execute GraphQL queries against subgraphs using subgraph ID, deployment ID, or IPFS hash.

4.  **Legacy GraphQL Integration** (`utils/chat/agentkit/action-providers/graph-querier.ts`)

    -   **Functionality**: Static GraphQL integration with pre-configured subgraph endpoints (maintained for backward compatibility).
    -   **Key Aspects**:
        -   **Subgraph Endpoints**: Manages a list of pre-configured (and dynamically accessible via API key) subgraph URLs (e.g., Uniswap, Aave).
        -   **Dynamic Queries**: The AI can request queries against any of the configured subgraphs.
        -   **Type Safety**: Uses Zod schemas to validate the structure of GraphQL queries formulated by the agent.

5.  **Token API Integration** (Proxy: `app/api/token-proxy/route.ts`, Utilities: `utils/chat/agentkit/token-api/utils.ts`, Schemas: `utils/chat/agentkit/token-api/schemas.ts`)

    -   **Functionality**: Provides access to comprehensive token data (balances, transfers, metadata, market prices, etc.) from an external token API service (e.g., The Graph's Token API).
    -   **Key Aspects**:
        -   **Proxy Server**: A Next.js API route (`/api/token-proxy`) that securely forwards requests to the external token API. This is crucial for hiding API keys from the client-side.
        -   **Utility Functions**: A set of functions in `utils.ts` that simplify fetching specific token data by abstracting the direct API calls through the proxy. These are intended to be used by AgentKit actions.
        -   **Data Schemas**: Zod schemas in `schemas.ts` ensure type safety and validation for both the parameters sent to the API and the data received.

6.  **NFT API Integration** (Proxy: `app/api/token-proxy/route.ts`, Utilities: `utils/chat/agentkit/token-api/utils.ts`, Schemas: `utils/chat/agentkit/token-api/schemas.ts`)
    -   **Functionality**: Provides comprehensive NFT data access including collections, individual items, ownership tracking, sales data, holder analysis, and activity monitoring across multiple blockchain networks.
    -   **Key Aspects**:
        -   **Multi-Network Support**: Supports mainnet, BSC, Base, Arbitrum, Optimism, Polygon, and Unichain networks for comprehensive NFT data coverage.
        -   **Collection Analytics**: Query NFT collections with filtering by network, pagination, and metadata retrieval.
        -   **Ownership Tracking**: Track NFT ownership patterns, holder distribution, and ownership history.
        -   **Sales Analytics**: Access comprehensive sales data including transaction details, pricing trends, and market analysis.
        -   **Activity Monitoring**: Monitor all NFT activities including transfers, sales, mints, and burns with detailed event tracking.
        -   **Utility Functions**: Six specialized functions (`fetchNFTCollections`, `fetchNFTItems`, `fetchNFTSales`, `fetchNFTHolders`, `fetchNFTOwnerships`, `fetchNFTActivities`) for different NFT data types.
        -   **Type Safety**: Comprehensive Zod schemas for all NFT data structures, parameters, and API responses ensuring robust validation.

### Key Files

This section highlights critical files and their roles within the application architecture.

1.  **MCP Provider** (`utils/chat/agentkit/action-providers/graph-mcp-provider.ts`)

    -   **Purpose**: Implements an AgentKit `ActionProvider` that connects to The Graph's official MCP server for dynamic subgraph discovery and querying.
    -   **Core Logic**:
        -   Uses `experimental_createMCPClient` from Vercel AI SDK to establish SSE connection to `https://subgraphs.mcp.thegraph.com/sse`.
        -   Provides memoized connection management to ensure single client instance.
        -   Exposes five main actions: `searchSubgraphs`, `getContractSubgraphs`, `getSubgraphSchema`, `executeMCPQuery`, and `listMCPTools`.
        -   Handles authentication using `GRAPH_API_KEY` as Bearer token.

    ```typescript
    // Core MCP client setup with memoization
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

    // Example action: Search for subgraphs by keyword
    {
      name: "searchSubgraphs",
      description: "Search for subgraphs by keyword using The Graph's MCP",
      schema: searchSubgraphsSchema,
      invoke: async ({ keyword }) => {
        const result = await invokeMcpTool("search_subgraphs_by_keyword", { keyword });
        return JSON.stringify(result, null, 2);
      }
    }
    ```

    **Key Features & Best Practices**:

    -   **Connection Management**: Uses memoization to ensure efficient connection reuse.
    -   **Error Handling**: Comprehensive error handling with structured error responses.
    -   **Type Safety**: Full Zod schema validation for all inputs and outputs.
    -   **Debug Support**: Includes `listMCPTools` action for troubleshooting available MCP tools.

2.  **Legacy GraphQL Query Handler** (`utils/chat/agentkit/action-providers/graph-querier.ts`)

    -   **Purpose**: Implements an AgentKit `ActionProvider` that allows the AI to query various subgraphs available through The Graph Protocol.
    -   **Core Logic**:
        -   Defines `SUBGRAPH_ENDPOINTS` (e.g., Uniswap, Aave) where the AI can send queries. These endpoints are typically functions that inject the necessary `GRAPH_API_KEY`.
        -   Provides a `querySubgraph` action with a Zod schema defining expected inputs: `endpoint` (which subgraph to query), `query` (the GraphQL query string), and optional `variables`.
        -   The `invoke` method executes the query against the specified subgraph endpoint and returns the results.

    ```typescript
    // Core functionality for querying The Graph protocol
    export class GraphQuerierProvider
        implements ActionProvider<WalletProvider>
    {
        // Pre-configured subgraph endpoints with API key management
        SUBGRAPH_ENDPOINTS = {
            UNISWAP_V3: () =>
                `https://gateway.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/${UNISWAP_V3_SUBGRAPH_ID}`, // Example
            AAVE_V3: () =>
                `https://gateway.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/${AAVE_V3_SUBGRAPH_ID}`, // Example
        };

        // Type-safe schema for GraphQL queries
        graphQuerySchema = z.object({
            endpoint: z
                .string()
                .describe(
                    "The key of the subgraph to query (e.g., UNISWAP_V3) or a direct URL."
                ),
            query: z.string().describe("The GraphQL query string."),
            variables: z
                .record(z.any())
                .optional()
                .describe("Optional variables for the GraphQL query."),
        });

        // Main action for executing GraphQL queries
        getActions(walletProvider: WalletProvider) {
            return [
                {
                    name: "querySubgraph",
                    description:
                        "Query a configured subgraph (e.g., UNISWAP_V3, AAVE_V3) using GraphQL. Use the subgraph key as the endpoint.",
                    schema: graphQuerySchema,
                    invoke: async ({ endpoint, query, variables }) => {
                        let targetEndpoint = "";
                        if (this.SUBGRAPH_ENDPOINTS[endpoint]) {
                            targetEndpoint =
                                this.SUBGRAPH_ENDPOINTS[endpoint]();
                        } else if (endpoint.startsWith("http")) {
                            targetEndpoint = endpoint; // Allow direct URL if not a key
                        } else {
                            throw new Error(
                                `Unknown subgraph endpoint key: ${endpoint}`
                            );
                        }

                        const response = await fetch(targetEndpoint, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ query, variables }),
                        });
                        if (!response.ok) {
                            const errorBody = await response.text();
                            throw new Error(
                                `GraphQL query failed for ${endpoint}: ${response.status} ${errorBody}`
                            );
                        }
                        return response.json(); // Or JSON.stringify(data) depending on agent expectation
                    },
                },
            ];
        }
    }
    ```

    **Key Features & Best Practices**:

    -   Supports query variables for dynamic data fetching.
    -   **Best Practice**: Ensure `GRAPH_API_KEY` is set in `.env.local`. When adding new subgraphs, define them clearly in `SUBGRAPH_ENDPOINTS`. Keep query descriptions for the AI clear and specific.

3.  **Chat API Route** (`app/api/chat/route.ts`)

    -   **Purpose**: The main backend endpoint that receives user messages from the chat interface, orchestrates the AI's response generation using AgentKit and OpenAI, and streams the response back.
    -   **Core Logic**:
        -   Authenticates the user session (e.g., using SIWE).
        -   Initializes `AgentKit` with all available action providers (like `GraphQuerierProvider`, and potentially a new `TokenApiProvider`).
        -   Constructs a system prompt for the OpenAI model, informing it about available tools (actions), their schemas, and how to use them. This includes the names and descriptions of subgraph endpoints and token API capabilities.
        -   Uses `streamText` from `ai/core` to send the user's message history and the system prompt to the OpenAI model (e.g., `gpt-4`) and streams the AI's textual response and any tool invocation calls.

    ```typescript
    export async function POST(req: Request) {
        // Authentication check using SIWE (Sign-In with Ethereum)
        const session = await getServerSession(
            siweAuthOptions({ chain: foundry }) // Example chain
        );
        // if (!session || !session.address) {
        //   return new Response("Unauthorized", { status: 401 });
        // }

        const { messages } = await req.json(); // Assuming messages are sent in the request body

        // Initialize AgentKit with all required providers
        // This would include GraphQuerierProvider, and potentially TokenApiProvider etc.
        const { agentKit, address } =
            await createAgentKit(/* pass wallet/session details if needed */);

        // Configure system prompt with available tools, endpoints, and example usage patterns
        const availableGraphEndpoints = Object.keys(
            new GraphQuerierProvider().SUBGRAPH_ENDPOINTS
        ).join(", ");
        const prompt = `
          You are a highly intelligent blockchain assistant. You can query The Graph subgraphs and fetch detailed token information.
          When querying subgraphs, use the 'querySubgraph' tool with one of the following endpoint keys: ${availableGraphEndpoints}.
          Example GraphQL query: { "endpoint": "UNISWAP_V3", "query": "query { pools(first:1){id} }" }
          For token information (balances, transfers, metadata), use the appropriate token API tools (e.g., 'getTokenBalance', 'getTokenTransfers').
          Example token balance query: { "address": "0x...", "networkId": "mainnet" }
          Think step-by-step. If a user asks for something that requires multiple steps or tools, explain your plan.
        `;

        // Stream responses using OpenAI with AgentKit tools
        const result = streamText({
            model: openai("gpt-4"), // Ensure your OPENAI_API_KEY is set
            messages,
            system: prompt,
            tools: getTools(agentKit), // getTools would consolidate actions from all providers
        });

        return result.toAIStreamResponse();
    }
    ```

    **Key Features & Best Practices**:

    -   Manages chat context and conversation history.
    -   Provides real-time response streaming.
    -   **Best Practice**: Craft clear and comprehensive system prompts. This is crucial for guiding the AI's behavior and ensuring it uses the available tools correctly. Regularly update the prompt as new tools or capabilities are added. Secure this endpoint appropriately.

4.  **Chat Interface** (`app/chat/page.tsx`)

    -   **Purpose**: The frontend React component that renders the chat UI, handles user input, displays messages (both user's and AI's), and visualizes tool calls and results.
    -   **Core Logic**:
        -   Uses the `useChat` hook (from `ai/react`) to manage the conversation state, including messages, input field value, and submission handling.
        -   When a user submits a message, `useChat` sends it to the `/api/chat` backend endpoint.
        -   Renders incoming messages, including streaming text from the AI.
        -   Special rendering for `tool-invocation` parts of messages, potentially showing "AI is using tool X..." and then the tool's output.

    ```typescript
    export default function Chat() {
        // Chat state management with max steps limit for tool usage
        const {
            messages,
            input,
            handleInputChange,
            handleSubmit,
            status,
            toolInvocations,
        } = useChat({
            api: "/api/chat", // Points to your backend chat route
            maxSteps: 10, // Max iterations of AI thinking -> tool call -> AI thinking
            // onError: (error) => { /* Handle errors from the backend or AI */ }
        });

        // Message rendering with markdown and tool call support
        const renderMessage = (m: any) => {
            /* ... existing or enhanced rendering logic ... */
        };

        // Example of how tool invocations might be displayed (simplified)
        const renderToolInvocations = () => {
            return toolInvocations.map((toolInvocation) => (
                <div
                    key={toolInvocation.toolCallId}
                    className="tool-call-visual"
                >
                    <p>
                        AI is using tool:{" "}
                        <strong>{toolInvocation.toolName}</strong>
                    </p>
                    {/* Optionally display arguments: <pre>{JSON.stringify(toolInvocation.args, null, 2)}</pre> */}
                    {/* Results will typically come in a subsequent assistant message */}
                </div>
            ));
        };

        return (
            <div className="flex flex-col w-full max-w-md mx-auto h-[600px]">
                <div className="messages-container overflow-y-auto mb-4">
                    {messages.map((m, index) => (
                        <div
                            key={index}
                            className={`message ${
                                m.role === "user"
                                    ? "user-message"
                                    : "ai-message"
                            }`}
                        >
                            {renderMessage(m)}
                        </div>
                    ))}
                    {renderToolInvocations()} {/* Display active tool calls */}
                </div>
                <form onSubmit={handleSubmit}>
                    <input
                        className="w-full border border-gray-300 rounded shadow-xl p-2"
                        value={input}
                        placeholder="Ask about blockchain data..."
                        onChange={handleInputChange}
                    />
                </form>
                {status === "in_progress" && <p>AI is thinking...</p>}
            </div>
        );
    }
    ```

    **Key Features & Best Practices**:

    -   Input handling with submission controls.
    -   Error state management and display.
    -   **Best Practice**: Provide clear visual feedback to the user about the AI's status (e.g., "AI is thinking...", "AI is using tool X..."). Ensure the UI gracefully handles and displays errors returned from the backend or from tool executions.

5.  **Token API Proxy Route** (`app/api/token-proxy/route.ts`)

    -   **Purpose**: A backend API route that acts as a secure intermediary between your application (specifically, the AgentKit actions running on the server) and an external Token API. This is essential for protecting your Token API credentials.
    -   **Core Logic**:
        -   Receives GET requests at `/api/token-proxy`.
        -   Expects a `path` query parameter, which specifies the actual endpoint of the external Token API to call (e.g., `balances/evm/0xYourAddress`).
        -   Constructs the full URL to the external Token API using `process.env.NEXT_PUBLIC_GRAPH_API_URL` as the base.
        -   Forwards all other query parameters from the incoming request to the external API request.
        -   Securely attaches authentication headers (either `X-Api-Key` from `process.env.NEXT_PUBLIC_GRAPH_API_KEY` or an `Authorization: Bearer` token from `process.env.NEXT_PUBLIC_GRAPH_TOKEN`) to the outgoing request to the external API.
        -   Fetches data from the external API and returns its JSON response and status code.

    ```typescript
    import { NextRequest, NextResponse } from "next/server";

    // Base URL for the external Token API
    const EXTERNAL_API_URL =
        process.env.NEXT_PUBLIC_GRAPH_API_URL || // Recommended to use a non-public var if only server-side
        "https://token-api.thegraph.com"; // Default fallback

    export async function GET(request: NextRequest) {
        const searchParams = request.nextUrl.searchParams;
        const apiPath = searchParams.get("path"); // e.g., "balances/evm/0x123" or "tokens/0xabc/transfers"

        if (!apiPath) {
            return NextResponse.json(
                { error: "Missing 'path' parameter for Token API" },
                { status: 400 }
            );
        }

        // Construct the target URL for the external API
        const targetUrl = new URL(apiPath, EXTERNAL_API_URL);

        // Forward relevant query parameters from the original request to the external API call
        searchParams.forEach((value, key) => {
            if (key !== "path") {
                // Avoid forwarding the 'path' param itself
                targetUrl.searchParams.append(key, value);
            }
        });

        const headers: HeadersInit = {
            Accept: "application/json",
            "Content-Type": "application/json",
        };

        // Securely add authentication headers
        // IMPORTANT: For server-side only proxy, prefer process.env.GRAPH_TOKEN_API_KEY (not NEXT_PUBLIC prefixed)
        const apiKey =
            process.env.GRAPH_TOKEN_API_KEY ||
            process.env.NEXT_PUBLIC_GRAPH_API_KEY;
        const bearerToken =
            process.env.GRAPH_TOKEN_API_BEARER_TOKEN ||
            process.env.NEXT_PUBLIC_GRAPH_TOKEN;

        if (apiKey) {
            headers["X-Api-Key"] = apiKey;
        } else if (bearerToken) {
            headers["Authorization"] = `Bearer ${bearerToken}`;
        } else {
            console.warn(
                "Token API proxy: No API key or bearer token configured. Calls might fail."
            );
            // Depending on the API, you might want to return an error here if auth is always required.
        }

        try {
            const apiResponse = await fetch(targetUrl.toString(), {
                method: "GET",
                headers,
                cache: "no-store", // Typically, you don't want to cache proxy responses here
            });

            const data = await apiResponse.json();

            if (!apiResponse.ok) {
                console.error(
                    `Token API Proxy: Error from external API (${apiResponse.status}):`,
                    data
                );
                // Return the error structure from the external API
                return NextResponse.json(data, { status: apiResponse.status });
            }
            return NextResponse.json(data, { status: apiResponse.status });
        } catch (error) {
            console.error("Token API Proxy: Internal error", error);
            return NextResponse.json(
                { error: "Proxy internal error" },
                { status: 500 }
            );
        }
    }
    ```

    **Key Features & Best Practices**:

    -   Forwards other query parameters to the target API.
    -   Returns the JSON response from the external API.
    -   **Security**: Crucially, API keys (`NEXT_PUBLIC_GRAPH_API_KEY` or `NEXT_PUBLIC_GRAPH_TOKEN`) are handled server-side, preventing exposure to the client. **Consider using environment variables NOT prefixed with `NEXT_PUBLIC_` if the proxy is guaranteed to only be called server-side by AgentKit actions, for better security.**
    -   **Error Handling**: Propagates errors from the external API back to the caller.
    -   **Clarity**: The `path` parameter should clearly map to the external API's own path structure. For example, if the external API endpoint is `https://token-api.thegraph.com/v1/tokens/mainnet/0xContract/transfers?limit=10`, then `path` would be `v1/tokens/mainnet/0xContract/transfers` and `limit=10` would be a forwarded query parameter.

6.  **Token API Utilities** (`utils/chat/agentkit/token-api/utils.ts`)

    -   **Purpose**: A collection of server-side TypeScript functions designed to be used by AgentKit actions. These functions abstract the details of making requests to the `/api/token-proxy` to fetch various types of token information.
    -   **Core Logic**:
        -   Each function (e.g., `fetchTokenBalances`, `fetchTokenDetails`, `fetchTokenTransfers`) corresponds to a specific type of data you can get from the Token API.
        -   They construct the correct `path` and query parameters needed by the `/api/token-proxy`.
        -   They call the proxy, handle the response (including potential errors), and often normalize the data into a consistent format defined by Zod schemas.

    ```typescript
    import { z } from "zod";
    import {
        TokenBalanceSchema,
        TokenBalancesParamsSchema,
        TokenBalancesApiResponseSchema,
        NetworkIdSchema,
        TokenDetailsSchema,
        TokenDetailsParamsSchema,
        TokenDetailsApiResponseSchema,
        // ... other schemas
    } from "./schemas";

    // This should be an internal constant, not necessarily from process.env if always fixed relative to app
    const NEXT_PUBLIC_BASE_URL =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const API_PROXY_URL = `${NEXT_PUBLIC_BASE_URL}/api/token-proxy`;

    /**
     * Fetches token balances for a given address via the server-side proxy.
     * Intended for use by AgentKit actions.
     */
    export async function fetchTokenBalances(
        address: string,
        params?: z.infer<typeof TokenBalancesParamsSchema>
    ): Promise<z.infer<typeof TokenBalancesApiResponseSchema>> {
        const validatedParams = TokenBalancesParamsSchema.parse(params || {}); // Validate/default params

        const apiPath = `balances/evm/${address}`; // Example path structure
        const queryParams = new URLSearchParams();
        queryParams.append("path", apiPath);

        if (validatedParams.network_id) {
            queryParams.append("network_id", validatedParams.network_id);
        }
        if (validatedParams.page) {
            queryParams.append("page", validatedParams.page.toString());
        }
        // ... append other validated params ...

        const url = `${API_PROXY_URL}?${queryParams.toString()}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                return {
                    error: {
                        message: data.error || "Failed to fetch token balances",
                        status: response.status,
                    },
                };
            }
            // Assuming the proxy returns data in the expected structure or needs normalization here
            // The Zod schema for response will validate this.
            return TokenBalancesApiResponseSchema.parse({
                data: data.data || data,
            }); // data might be directly the array or nested
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Unknown error in fetchTokenBalances";
            return { error: { message, status: 500 } };
        }
    }

    /**
     * Fetches details for a specific token contract.
     */
    export async function fetchTokenDetails(
        contractAddress: string,
        params?: z.infer<typeof TokenDetailsParamsSchema>
    ): Promise<z.infer<typeof TokenDetailsApiResponseSchema>> {
        const validatedParams = TokenDetailsParamsSchema.parse(params || {});
        const apiPath = `tokens/evm/${contractAddress}`; // Example path for token details

        const queryParams = new URLSearchParams();
        queryParams.append("path", apiPath);
        if (validatedParams.network_id) {
            queryParams.append("network_id", validatedParams.network_id);
        }

        const url = `${API_PROXY_URL}?${queryParams.toString()}`;
        // ... similar fetch, error handling, and response validation logic as fetchTokenBalances ...
        // return TokenDetailsApiResponseSchema.parse({ data: data.data || data });
        try {
            const response = await fetch(url);
            const rawData = await response.json();
            if (!response.ok) {
                return {
                    error: {
                        message:
                            rawData.error?.message ||
                            "Failed to fetch token details",
                        status: response.status,
                    },
                };
            }
            // Assuming 'rawData' is the direct token details object or { data: tokenDetailsObject }
            const tokenData = rawData.data || rawData;
            return TokenDetailsApiResponseSchema.parse({ data: tokenData });
        } catch (e) {
            // ...
            return {
                error: {
                    message: "Error fetching or parsing token details",
                    status: 500,
                },
            };
        }
    }

    // Other functions (fetchTokenTransfers, fetchTokenMetadata, etc.) would follow a similar pattern:
    // 1. Accept parameters (validated by their Zod schema).
    // 2. Construct the specific `apiPath` for the external Token API.
    // 3. Build the query string for the `/api/token-proxy`.
    // 4. Call the proxy.
    // 5. Handle errors and validate/normalize the response using the appropriate Zod schema.
    ```

    **Key Features & Best Practices**:

    -   Handles response normalization and error reporting: Before returning data, these utilities can transform it into a more usable or consistent structure if the raw API response is complex or varies.
    -   Uses Zod schemas defined in `schemas.ts` for request parameters and API responses. This ensures that AgentKit actions provide valid data and can reliably consume the results.
    -   **Best Practice**: Each utility function should have a clear, single responsibility. Input parameters and output structures should be robustly typed and validated using Zod. Implement comprehensive error handling and logging.

7.  **Token API Schemas** (`utils/chat/agentkit/token-api/schemas.ts`)

    -   **Purpose**: This file centralizes the Zod schema definitions for all data structures related to the Token API. This includes schemas for parameters taken by the utility functions (and thus by AgentKit actions) and for the expected shapes of API responses.
    -   **Core Logic**:
        -   Defines schemas like `TokenBalanceSchema`, `TokenDetailsParamsSchema`, `NetworkIdSchema`, `TokenTransfersSchema`, etc.
        -   Uses Zod's capabilities for defining required/optional fields, data types (string, number, enum, object, array), and even more complex validation rules if needed.
        -   Provides a generic `ApiResponseSchema` to standardize how responses (which can contain either data or an error) are typed and validated across different Token API utility functions.

    ```typescript
    import { z } from "zod";

    // Schema for NetworkId, used across various parameter and data schemas
    export const NetworkIdSchema = z
        .enum([
            "mainnet",
            "bsc",
            "base",
            "arbitrum-one",
            "optimism",
            "matic",
            "unichain",
        ])
        .describe("The blockchain network identifier.");

    // Example: Schema for a single TokenBalance item
    export const TokenBalanceSchema = z
        .object({
            contract_address: z
                .string()
                .describe("The token's contract address."),
            amount: z
                .string()
                .describe(
                    "The raw balance amount (string to handle large numbers)."
                ),
            name: z.string().optional().describe("Token name."),
            symbol: z.string().optional().describe("Token symbol."),
            decimals: z.number().optional().describe("Token decimals."),
            amount_usd: z
                .number()
                .optional()
                .describe("USD value of the balance."),
            // ... other relevant fields like price_usd, logo_url
        })
        .describe("Represents the balance of a single token for an address.");

    // Schema for parameters to fetch token balances
    export const TokenBalancesParamsSchema = z
        .object({
            network_id: NetworkIdSchema.optional().describe(
                "Filter by network ID. If not provided, API might use a default or query across multiple."
            ),
            page: z
                .number()
                .int()
                .positive()
                .optional()
                .describe("Page number for pagination."),
            page_size: z
                .number()
                .int()
                .positive()
                .optional()
                .describe("Number of items per page."),
            // ... other potential filters like min_amount, contract_address
        })
        .describe("Parameters for requesting token balances.");

    // Schema for the API error response part
    export const ApiErrorSchema = z.object({
        message: z.string(),
        status: z.number(),
    });

    // Generic API Response schema that wraps data or an error
    export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataType: T) =>
        z.object({
            data: dataType.optional(), // Data is present on success
            error: ApiErrorSchema.optional(), // Error is present on failure
        });

    // Specific schema for the overall response when fetching token balances
    export const TokenBalancesApiResponseSchema = ApiResponseSchema(
        z.array(TokenBalanceSchema)
    );

    // Example: Schema for fetching Token Details
    export const TokenDetailsSchema = z.object({
        address: z.string().describe("Token contract address."),
        name: z.string().optional(),
        symbol: z.string().optional(),
        decimals: z.number().optional(),
        // ... other details like total_supply, website, etc.
    });
    export const TokenDetailsParamsSchema = z.object({
        network_id: NetworkIdSchema.optional().describe(
            "Network ID where the token exists."
        ),
    });
    export const TokenDetailsApiResponseSchema = ApiResponseSchema(
        TokenDetailsSchema.nullable()
    ); // data can be TokenDetails or null if not found

    // ... many other schemas for transfers, metadata, holders, pools, swaps, OHLC, etc.
    ```

    **Key Features & Best Practices**:

    -   Defines a generic `ApiResponseSchema` to standardize response handling, making it easier to work with functions in `utils.ts` as they will consistently return an object with an optional `data` field and an optional `error` field.
    -   **Best Practice**: Keep schemas granular and well-described. Use Zod's `.describe()` method extensively, as these descriptions can be used to generate documentation or inform the AI about data fields. Ensure schemas accurately reflect the external API's responses to prevent runtime parsing errors.

### Component Interaction

1. **Data Flow Between Components**

    ```
    Chat Interface (page.tsx)
    ↓ Sends user message
    API Route (route.ts)
    ↓ Processes with OpenAI
    ↓ Initializes AgentKit
    MCP Provider (graph-mcp-provider.ts)  OR  Legacy GraphQL Handler  OR  Token API Utilities
    ↓                                         ↓                           ↓ Calls Token API Proxy
    ↓ Connects to MCP Server (SSE)            ↓ Direct subgraph queries   Token API Proxy (token-proxy/route.ts)
    ↓ Uses official MCP tools                 ↓ (Static endpoints)        ↓ Queries External Token API
    ↓ Returns structured data                 ↓ Returns results           ↓ Returns results
    API Route
    ↓ Streams response
    Chat Interface
    ↓ Renders result
    ```

2. **State Management**

    - Chat state managed by `useChat` hook
    - AgentKit state handled in API route
    - GraphQL query state managed by provider
    - Token API request state managed by utility functions and their callers.
    - Real-time updates through streaming

3. **Error Handling Chain**
    - UI errors caught in chat interface
    - API errors handled in route handler
    - GraphQL errors managed in query provider
    - Token API errors handled by utility functions and the proxy.
    - Comprehensive error propagation

### Data Flow

1. **User Interaction**

    - User types message in chat interface
    - Message is sent to API route
    - SIWE authentication is verified

2. **Query Processing**

    - OpenAI processes natural language
    - AgentKit determines required actions
    - GraphQL queries are constructed
    - Subgraph endpoints are called

3. **Response Generation**
    - Data is formatted and processed
    - Markdown is rendered
    - Tool calls are displayed
    - UI updates in real-time

### Key System Features

This section was previously named "Key Features" and has been renamed for clarity as it describes features of the overall system.

1. **Type Safety**

    - Zod schemas for query validation
    - TypeScript interfaces for responses
    - Runtime type checking

2. **Error Handling**

    - Graceful error recovery
    - User-friendly error messages
    - Request retry logic

3. **Performance**

    - Streaming responses
    - Efficient message rendering
    - Optimized re-renders

4. **Security**
    - SIWE authentication
    - API key management
    - Input sanitization

## MCP Integration

### Overview

The MCP (Model Context Protocol) integration provides a direct connection to The Graph's official MCP server, enabling dynamic subgraph discovery and advanced querying capabilities. This is the recommended approach for interacting with The Graph protocol, offering superior flexibility compared to static endpoint configurations.

**Key Advantages:**

-   **Dynamic Discovery**: Search and discover subgraphs by keywords or contract addresses
-   **Schema Introspection**: Automatically retrieve GraphQL schemas for any subgraph
-   **Official Support**: Direct connection to The Graph's maintained MCP server
-   **Real-time Updates**: Access to the latest subgraph information and metadata

### Available MCP Tools

The MCP provider exposes the following tools through The Graph's official MCP server:

| Tool Name              | Description                            | Parameters                                              |
| ---------------------- | -------------------------------------- | ------------------------------------------------------- |
| `searchSubgraphs`      | Search for subgraphs by keyword        | `keyword: string`                                       |
| `getContractSubgraphs` | Find top subgraphs indexing a contract | `contractAddress: string, chain: string`                |
| `getSubgraphSchema`    | Get GraphQL schema for a subgraph      | `subgraphId \| deploymentId \| ipfsHash`                |
| `executeMCPQuery`      | Execute GraphQL query against subgraph | `query: string, subgraphId \| deploymentId \| ipfsHash` |
| `listMCPTools`         | Debug: List all available MCP tools    | None                                                    |

### MCP Provider Implementation

The `GraphMCPProvider` class implements the AgentKit `ActionProvider` interface and manages the connection to The Graph's MCP server:

```typescript
// Connection establishment with authentication
const client = await experimental_createMCPClient({
    transport: {
        type: "sse",
        url: "https://subgraphs.mcp.thegraph.com/sse",
        headers: {
            Authorization: `Bearer ${process.env.GRAPH_API_KEY}`,
        },
    },
});
```

**Key Implementation Details:**

1. **Memoized Connection Management**

    ```typescript
    const getMcpClient = memoize(async () => {
        // Creates and caches a single MCP client instance
    });
    ```

2. **Tool Invocation Wrapper**

    ```typescript
    async function invokeMcpTool(toolName: string, args: any) {
        const { tools } = await getMcpTools();
        const tool = tools[toolName];
        return await tool.execute(args);
    }
    ```

3. **Comprehensive Error Handling**
    ```typescript
    try {
        const result = await invokeMcpTool("search_subgraphs_by_keyword", {
            keyword,
        });
        return JSON.stringify(result, null, 2);
    } catch (error) {
        return JSON.stringify({
            error: error instanceof Error ? error.message : "Operation failed",
        });
    }
    ```

### MCP Usage Examples

#### 1. Finding Subgraphs for a Contract

```
User: "Find subgraphs for the ENS Registry contract 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e on mainnet"

AI Process:
1. Uses getContractSubgraphs action
2. Calls get_top_subgraph_deployments MCP tool
3. Returns top 3 subgraphs indexing that contract

Response: Lists relevant ENS subgraphs with metadata like:
- Subgraph ID
- Deployment ID
- Query fees
- Network information
```

#### 2. Searching for Subgraphs by Keyword

```
User: "Find Uniswap V3 subgraphs"

AI Process:
1. Uses searchSubgraphs action
2. Calls search_subgraphs_by_keyword MCP tool
3. Returns matching subgraphs ordered by signal

Response: Shows Uniswap V3 related subgraphs with:
- Display names
- Descriptions
- Signal amounts
- Current versions
```

#### 3. Schema Introspection and Querying

```
User: "What entities are available in the Uniswap V3 subgraph?"

AI Process:
1. First searches for Uniswap V3 subgraphs (if needed)
2. Uses getSubgraphSchema action with subgraph ID
3. Calls get_schema_by_subgraph_id MCP tool
4. Parses and explains available entities

Response: Lists entities like Pool, Token, Position, etc. with their fields
```

#### 4. Advanced Query Execution

```
User: "Show me the top 5 Uniswap V3 pools by TVL"

AI Process:
1. Identifies relevant subgraph (via search if needed)
2. Constructs appropriate GraphQL query
3. Uses executeMCPQuery action
4. Calls execute_query_by_subgraph_id MCP tool

GraphQL Query:
query {
  pools(
    first: 5
    orderBy: totalValueLockedUSD
    orderDirection: desc
  ) {
    id
    token0 { symbol }
    token1 { symbol }
    totalValueLockedUSD
    volumeUSD
  }
}
```

**Error Handling Examples:**

-   **Invalid Contract Address**: "Contract address format is invalid"
-   **Chain Not Supported**: "Chain 'unsupported-chain' not found"
-   **Query Syntax Error**: "GraphQL syntax error: Expected Name, found }"
-   **Schema Not Found**: "Schema not available for deployment ID 0x..."

**Best Practices:**

1. **Always provide chain parameter** when using `getContractSubgraphs`
2. **Use specific subgraph identifiers** (ID, deployment ID, or IPFS hash) for querying
3. **Handle pagination** for large result sets in queries
4. **Validate GraphQL syntax** before execution
5. **Check schema** before constructing complex queries

## NFT API Integration

### Overview

The NFT API integration provides comprehensive access to NFT data across multiple blockchain networks. This system enables detailed analysis of NFT collections, individual items, ownership patterns, sales data, holder distribution, and activity monitoring through natural language queries.

**Key Capabilities:**

-   **Multi-Network Support**: Query NFT data across mainnet, BSC, Base, Arbitrum, Optimism, Polygon, and Unichain
-   **Collection Analytics**: Comprehensive collection data including metadata, statistics, and trends
-   **Ownership Tracking**: Detailed ownership information and transfer history
-   **Sales Analysis**: Market data including transaction details, pricing, and trends
-   **Activity Monitoring**: Real-time tracking of mints, transfers, sales, and burns
-   **Holder Analysis**: Distribution patterns and top holder identification

### Available NFT Tools

The NFT API integration exposes six main tools through the AgentKit system:

| Tool Name             | Description                       | Key Parameters                                                     |
| --------------------- | --------------------------------- | ------------------------------------------------------------------ |
| `get-nft-collections` | Analyze NFT collections           | `networkId`, `contractAddress`, `limit`, `page`                    |
| `get-nft-items`       | Get individual NFT details        | `contractAddress`, `tokenId`, `networkId`, `ownerAddress`          |
| `get-nft-sales`       | Retrieve NFT sales data           | `contractAddress`, `tokenId`, `networkId`, `limit`, `priceRange`   |
| `get-nft-holders`     | Analyze NFT holder distribution   | `contractAddress`, `networkId`, `limit`, `minBalance`              |
| `get-nft-ownerships`  | Track NFT ownership by address    | `ownerAddress`, `contractAddress`, `networkId`, `limit`            |
| `get-nft-activities`  | Monitor NFT activities and events | `contractAddress`, `tokenId`, `networkId`, `activityType`, `limit` |

### NFT Data Schemas

The integration uses comprehensive Zod schemas for type safety and validation:

**Core NFT Entities:**

```typescript
// NFT Collection Schema
const NFTCollectionSchema = z.object({
    address: z.string().describe("Collection contract address"),
    name: z.string().optional().describe("Collection name"),
    symbol: z.string().optional().describe("Collection symbol"),
    totalSupply: z.string().optional().describe("Total number of NFTs"),
    floorPrice: z.string().optional().describe("Current floor price"),
    networkId: NetworkIdSchema.describe("Blockchain network"),
});

// NFT Item Schema
const NFTItemSchema = z.object({
    tokenId: z.string().describe("Token ID within collection"),
    contractAddress: z.string().describe("Collection contract address"),
    name: z.string().optional().describe("NFT name"),
    description: z.string().optional().describe("NFT description"),
    imageUrl: z.string().optional().describe("NFT image URL"),
    attributes: z
        .array(NFTAttributeSchema)
        .optional()
        .describe("NFT traits/attributes"),
    owner: z.string().optional().describe("Current owner address"),
});

// NFT Sale Schema
const NFTSaleSchema = z.object({
    tokenId: z.string().describe("Token ID sold"),
    contractAddress: z.string().describe("Collection contract address"),
    price: z.string().describe("Sale price in wei"),
    priceUsd: z.number().optional().describe("Sale price in USD"),
    currency: z.string().describe("Payment currency"),
    seller: z.string().describe("Seller address"),
    buyer: z.string().describe("Buyer address"),
    timestamp: z.string().describe("Sale timestamp"),
    transactionHash: z.string().describe("Transaction hash"),
});
```

**Parameter Schemas:**

```typescript
// Collection Query Parameters
const NFTCollectionsParamsSchema = z.object({
    networkId: NetworkIdSchema.optional(),
    contractAddress: z.string().optional(),
    limit: z.number().int().positive().max(100).optional(),
    page: z.number().int().positive().optional(),
});

// Sales Query Parameters
const NFTSalesParamsSchema = z.object({
    contractAddress: z.string().optional(),
    tokenId: z.string().optional(),
    networkId: NetworkIdSchema.optional(),
    seller: z.string().optional(),
    buyer: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    limit: z.number().int().positive().max(100).optional(),
});
```

### NFT Utility Functions

The system includes six specialized utility functions for different NFT data types:

```typescript
// Fetch NFT collections with filtering and pagination
export async function fetchNFTCollections(
    params?: z.infer<typeof NFTCollectionsParamsSchema>
): Promise<z.infer<typeof NFTCollectionsApiResponseSchema>>;

// Get individual NFT details and metadata
export async function fetchNFTItems(
    params: z.infer<typeof NFTItemsParamsSchema>
): Promise<z.infer<typeof NFTItemsApiResponseSchema>>;

// Retrieve comprehensive sales data
export async function fetchNFTSales(
    params?: z.infer<typeof NFTSalesParamsSchema>
): Promise<z.infer<typeof NFTSalesApiResponseSchema>>;

// Analyze holder distribution and ownership patterns
export async function fetchNFTHolders(
    params: z.infer<typeof NFTHoldersParamsSchema>
): Promise<z.infer<typeof NFTHoldersApiResponseSchema>>;

// Track ownership by specific addresses
export async function fetchNFTOwnerships(
    params: z.infer<typeof NFTOwnershipsParamsSchema>
): Promise<z.infer<typeof NFTOwnershipsApiResponseSchema>>;

// Monitor all NFT activities and events
export async function fetchNFTActivities(
    params?: z.infer<typeof NFTActivitiesParamsSchema>
): Promise<z.infer<typeof NFTActivitiesApiResponseSchema>>;
```

### Network Support

All NFT tools support the following blockchain networks:

-   **Mainnet** (`mainnet`): Ethereum mainnet
-   **BSC** (`bsc`): Binance Smart Chain
-   **Base** (`base`): Coinbase Layer 2
-   **Arbitrum** (`arbitrum-one`): Arbitrum One
-   **Optimism** (`optimism`): Optimism mainnet
-   **Polygon** (`matic`): Polygon mainnet
-   **Unichain** (`unichain`): Unichain network

### Advanced Filtering Options

**Collection Filtering:**

-   Filter by specific contract addresses
-   Network-based filtering
-   Pagination support for large collections
-   Metadata and statistics inclusion

**Sales Analysis:**

-   Price range filtering (min/max)
-   Time-based filtering
-   Buyer/seller address filtering
-   Currency-specific analysis

**Activity Monitoring:**

-   Activity type filtering (mint, transfer, sale, burn)
-   Contract and token-specific tracking
-   Time range specifications
-   Event detail inclusion

**Ownership Analysis:**

-   Multi-collection ownership tracking
-   Balance thresholds
-   Historical ownership data
-   Transfer pattern analysis

### Error Handling

The NFT API integration includes comprehensive error handling:

```typescript
// Standardized error response format
{
  error: {
    message: "Descriptive error message",
    status: 400 | 404 | 500,
    code?: "INVALID_CONTRACT_ADDRESS" | "NETWORK_NOT_SUPPORTED" | "TOKEN_NOT_FOUND"
  }
}
```

**Common Error Scenarios:**

-   Invalid contract addresses
-   Unsupported networks
-   Token not found
-   API rate limits
-   Network connectivity issues

### NFT Integration Best Practices

1. **Use specific contract addresses** when possible for faster queries
2. **Implement pagination** for large result sets (max 100 items per request)
3. **Specify network ID** to avoid cross-network confusion
4. **Handle rate limits** gracefully with retry logic
5. **Cache frequently accessed data** (collection metadata, floor prices)
6. **Validate addresses** before making API calls
7. **Use appropriate filtering** to reduce response size
8. **Monitor API usage** to stay within limits

## x402 Payment Integration

### Overview

The x402 payment integration enables AI agents to autonomously pay for API access using Coinbase's open payment protocol. Built around the HTTP 402 Payment Required status code, x402 allows services to monetize APIs and digital content onchain, enabling clients to programmatically pay for access without accounts, sessions, or complex authentication flows.

**Key Advantages:**

-   **Autonomous Payments**: AI agents can pay for API access without human intervention
-   **Instant Settlement**: Payments settle onchain in seconds, not days
-   **No Fees**: x402 protocol has zero fees for both merchants and customers
-   **Frictionless**: Minimal setup required - as little as one line of configuration
-   **Blockchain Agnostic**: Works with multiple networks and tokens
-   **Web Native**: Uses HTTP status codes and headers for seamless integration

### x402 Protocol Flow

The x402 payment system follows a simple request-response pattern:

1. **Request**: Client (AI agent) requests a resource from the server
2. **Payment Required**: Server responds with HTTP 402 and payment instructions
3. **Payment**: Client constructs and submits payment using `transferWithAuthorization`
4. **Verification**: Server verifies payment with x402 facilitator
5. **Settlement**: Payment is settled onchain and resource is provided

### Key Features

-   **Automatic Payment Handling**: Graph MCP provider automatically detects 402 responses and processes payments
-   **EIP-712 Signatures**: Secure `transferWithAuthorization` signatures for USDC transfers
-   **Facilitator Integration**: Works with Coinbase's x402 facilitator service
-   **Flexible Configuration**: Supports multiple networks and payment tokens
-   **Retry Logic**: Automatically retries failed requests with payment credentials
-   **Error Handling**: Comprehensive error handling for payment failures

### Supported Networks & Tokens

-   **Base** (`base`) - Primary network for fee-free USDC payments
-   **Ethereum** (`ethereum`) - Mainnet support for USDC payments
-   **Polygon** (`polygon`) - Low-cost alternative network
-   **Primary Token**: USDC (USD Coin) via `transferWithAuthorization`

### x402 Configuration

The x402 integration requires several environment variables for proper operation:

```bash
# x402 Payment Configuration
X402_ENABLED=true                                              # Enable x402 payments
X402_FACILITATOR_URL=https://facilitator.x402.org             # Facilitator service URL
X402_WALLET_ADDRESS=0x...                                     # Wallet address for payments
X402_NETWORK=base                                              # Network for payments
X402_USDC_CONTRACT=0xA0b86a33E6441c0a8C6f8A0b8e1d7BcF2eD3c0e2 # USDC contract address
X402_QUERY_PRICE=10000                                        # Price per query in smallest units
X402_FORCE_PAYMENT=true                                       # Force payments even for free tier (testing)
X402_SKIP_VALIDATION=true                                     # Skip validation for development
```

### Troubleshooting x402 Issues

If you encounter x402 payment errors, here are common solutions:

#### 1. "Payment verification failed: Bad Request (400)"

This usually means the facilitator is rejecting the payment payload. For development, enable skip validation:

```bash
X402_SKIP_VALIDATION=true
```

#### 2. "X402_WALLET_ADDRESS is not set"

The wallet address is required for payments. You can either:

-   Set `X402_WALLET_ADDRESS` explicitly in your environment
-   Set `AGENT_PRIVATE_KEY` and the address will be derived automatically

#### 3. "Facilitator not available"

The x402 facilitator is still in development. For testing:

```bash
X402_SKIP_VALIDATION=true
X402_FORCE_PAYMENT=true
```

#### 4. Environment Setup

Copy the example environment file and configure it:

```bash
cp packages/nextjs/env.example packages/nextjs/.env.local
# Edit .env.local with your values
```

#### 5. Debug Mode

Enable debug logging to see detailed x402 information:

```bash
NODE_ENV=development
```

You should see logs like:

```
🚀 x402 Configuration: { network: 'baseSepolia', enabled: true, ... }
💳 Processing x402 payment: {...}
⚠️  Skipping payment verification due to skipValidation flag
```

### Force Payment Mode

For testing and demonstration purposes, you can enable **Force Payment Mode** which will simulate x402 payments even for requests that would normally be free. This is useful for:

-   **Testing Payment Flow**: Verify that x402 payments work correctly without hitting actual rate limits
-   **Demonstration**: Show how the payment system works in presentations or demos
-   **Development**: Test payment logic during development without consuming actual API quotas

#### Enabling Force Payment Mode

```bash
# Add to your .env.local file
X402_FORCE_PAYMENT=true
```

#### Testing Force Payment Mode

Use the built-in test action to verify force payment functionality:

```
Test force payment mode with a simple token balance query
```

This will:

1. Force a 402 Payment Required response
2. Process the payment using the agent's wallet
3. Execute the original request after payment
4. Return the results with payment confirmation

#### Force Payment in Action

When force payment mode is enabled, you'll see logs like:

```
🧪 Force payment mode enabled - simulating 402 Payment Required
🤖 Agent handling x402 payment for token balance query
💳 Processing x402 payment: [payment instructions]
🔍 Creating transferWithAuthorization signature...
✅ Force payment processed successfully, now executing original function
```

#### Disabling Force Payment Mode

To return to normal operation (only pay when actually required):

```bash
# Remove or set to false
X402_FORCE_PAYMENT=false
```

### API Route Integration

The system includes a demonstration API route (`/api/mcp/route.ts`) that shows x402 middleware integration:

```typescript
// Check for payment requirements
if (x402Config.enabled && shouldRequirePayment(request)) {
    const paymentHeaders = extractPaymentHeaders(request);

    if (!paymentHeaders) {
        return NextResponse.json(
            {
                error: "Payment Required",
                instructions: {
                    method: "exact",
                    token: x402Config.usdcContract,
                    amount: "10000", // 0.01 USDC
                    recipient: x402Config.walletAddress,
                    // ... other payment details
                },
            },
            {
                status: 402,
                headers: {
                    "X-Payment-Method": "exact",
                    "X-Payment-Token": x402Config.usdcContract,
                    "X-Payment-Amount": "10000",
                    // ... other payment headers
                },
            }
        );
    }
}
```

### Usage Examples

#### Basic x402 Integration

```typescript
// Initialize Graph MCP provider with x402 support
const provider = graphMCPProvider({
    enabled: true,
    walletAddress: process.env.X402_WALLET_ADDRESS,
    facilitatorUrl: process.env.X402_FACILITATOR_URL,
    network: "base",
});

// Use provider normally - payments handled automatically
const actions = provider.getActions(walletProvider);
const result = await actions
    .find((a) => a.name === "searchSubgraphs")
    .invoke({ keyword: "Uniswap" });
```

#### Manual Payment Processing

```typescript
import {
    X402PaymentHandler,
    parsePaymentInstructions,
} from "./utils/chat/agentkit/x402";

// Handle 402 response manually
try {
    const result = await apiCall();
} catch (error) {
    if (error.status === 402) {
        const instructions = parsePaymentInstructions(error);
        const handler = new X402PaymentHandler(x402Config, walletProvider);
        const payment = await handler.handlePaymentRequired(instructions);

        // Retry with payment
        const result = await apiCallWithPayment(payment);
    }
}
```

### Chat Interface Integration

The x402 integration works seamlessly with the chat interface:

```
User: "Find Uniswap subgraphs"
AI: Searching for Uniswap subgraphs...
[Payment Required - Processing 0.01 USDC payment]
AI: Payment successful! Here are the Uniswap subgraphs: ...
```

### Security Considerations

1. **Private Key Management**: Store private keys securely, never commit to version control
2. **Payment Limits**: Set reasonable payment limits to prevent excessive charges
3. **Network Selection**: Use Base network for fee-free USDC transactions
4. **Facilitator Trust**: Only use trusted facilitator services
5. **Signature Validation**: Ensure proper EIP-712 signature validation
6. **Error Handling**: Implement comprehensive error handling for payment failures

### Troubleshooting x402 Issues

1. **Payment Failures**

    - Verify wallet has sufficient USDC balance
    - Check network configuration (Base recommended)
    - Ensure facilitator URL is accessible
    - Validate EIP-712 signature creation

2. **Configuration Issues**

    - Verify all environment variables are set
    - Check wallet address format (checksummed)
    - Ensure USDC contract address is correct for network
    - Validate facilitator URL accessibility

3. **Integration Problems**
    - Check x402 middleware configuration
    - Verify payment header extraction
    - Ensure proper 402 response handling
    - Monitor facilitator service status

### Best Practices

1. **Use Base Network**: Leverage fee-free USDC transactions on Base
2. **Monitor Payments**: Track payment activity and costs
3. **Set Limits**: Implement reasonable payment limits for AI agents
4. **Cache Results**: Cache API responses to minimize payment frequency
5. **Error Recovery**: Implement robust error handling and retry logic
6. **Test Thoroughly**: Test payment flows in development environment
7. **Security First**: Follow security best practices for key management

### x402 Ecosystem

The x402 integration opens up possibilities for:

-   **AI Agent Monetization**: Agents can autonomously pay for premium data
-   **Micropayment APIs**: Services can charge per request or usage
-   **Content Paywalls**: Access to premium blockchain data and analytics
-   **Service Aggregation**: Combine multiple paid services seamlessly
-   **Usage-Based Billing**: Pay only for what you use

For more information about the x402 protocol, visit the [official documentation](https://x402.gitbook.io/x402).

## Chat Interaction Examples

This section demonstrates how users can interact with different data sources through natural language queries in the chat interface.

### Subgraph MCP Interaction (via Chat)

The MCP (Model Context Protocol) integration enables dynamic subgraph discovery and advanced querying through The Graph's official MCP server. Users can interact with subgraphs using natural language without needing to know specific subgraph IDs or GraphQL syntax.

1.  **Subgraph Discovery by Keyword:**

    ```
    User: "Find Uniswap V3 subgraphs"
    AI (Thinking): User wants to discover subgraphs related to Uniswap V3. I'll use the 'searchSubgraphs' action.
    AI (Tool Invocation): [Invokes 'searchSubgraphs' with keyword: 'Uniswap V3']
    AI (Response): "Found 5 Uniswap V3 subgraphs: [Lists subgraphs with names, descriptions, signal amounts, and current versions]"
    ```

2.  **Contract-Based Subgraph Discovery:**

    ```
    User: "Find the top subgraphs for contract 0x1f98431c8ad98523631ae4a59f267346ea31f984 on arbitrum-one"
    AI (Thinking): User wants subgraphs indexing a specific contract on Arbitrum. I'll use 'getContractSubgraphs'.
    AI (Tool Invocation): [Invokes 'getContractSubgraphs' with contractAddress: '0x1f98431c8ad98523631ae4a59f267346ea31f984', chain: 'arbitrum-one']
    AI (Response): "Top subgraphs indexing this contract on Arbitrum: [Lists relevant subgraphs with query fees, deployment IDs, and metadata]"
    ```

3.  **Schema Exploration:**

    ```
    User: "What entities and fields are available in the Uniswap V3 mainnet subgraph?"
    AI (Thinking): User wants to explore the schema. First I'll find the Uniswap V3 subgraph, then get its schema.
    AI (Tool Invocation): [First searches for Uniswap V3, then invokes 'getSubgraphSchema' with the subgraph ID]
    AI (Response): "The Uniswap V3 subgraph contains these entities: Pool, Token, Position, Swap, Mint, Burn. [Explains key fields and relationships]"
    ```

4.  **Advanced GraphQL Querying:**

    ```
    User: "What are the pairs with maximum volume on deployment 0xde0a7b5368f846f7d863d9f64949b688ad9818243151d488b4c6b206145b9ea3?"
    AI (Thinking): User wants high-volume pairs from a specific deployment. I'll construct a GraphQL query for pools ordered by volume.
    AI (Tool Invocation): [Invokes 'executeMCPQuery' with deployment ID and GraphQL query for pools ordered by volumeUSD]
    AI (Response): "Top volume pairs in this deployment: [Lists pairs with token symbols, volume amounts, and TVL data]"
    ```

5.  **Token Market Cap Analysis:**

    ```
    User: "Which tokens have the highest market cap in this Subgraph?"
    AI (Thinking): User wants token market cap data. I'll query for tokens ordered by market cap or total value locked.
    AI (Tool Invocation): [Invokes 'executeMCPQuery' with appropriate GraphQL query for tokens ordered by market metrics]
    AI (Response): "Highest market cap tokens: [Lists tokens with symbols, market cap values, and trading volumes]"
    ```

6.  **Recent Activity Queries:**

    ```
    User: "Show me the most recent 5 swaps for the USDC/ETH pair"
    AI (Thinking): User wants recent swap data for a specific pair. I'll query for swaps filtered by token pair and ordered by timestamp.
    AI (Tool Invocation): [Invokes 'executeMCPQuery' with GraphQL query for recent swaps on USDC/ETH pair]
    AI (Response): "Recent USDC/ETH swaps: [Lists swaps with amounts, prices, transaction hashes, and timestamps]"
    ```

7.  **Cross-Network Subgraph Comparison:**

    ```
    User: "Compare Aave V3 subgraphs across different networks"
    AI (Thinking): User wants to compare Aave across networks. I'll search for Aave V3 subgraphs and identify different network deployments.
    AI (Tool Invocation): [Invokes 'searchSubgraphs' with keyword: 'Aave V3']
    AI (Response): "Aave V3 deployments found on: Mainnet, Polygon, Arbitrum, Optimism. [Compares features and data availability across networks]"
    ```

8.  **Liquidity Pool Analysis:**

    ```
    User: "What are the deepest liquidity pools in the Uniswap V3 subgraph?"
    AI (Thinking): User wants pools with highest TVL. I'll query for pools ordered by total value locked.
    AI (Tool Invocation): [First finds Uniswap V3 subgraph, then executes query for pools ordered by totalValueLockedUSD]
    AI (Response): "Deepest liquidity pools: [Lists pools with token pairs, TVL amounts, fee tiers, and volume metrics]"
    ```

9.  **Historical Data Exploration:**

    ```
    User: "Show me the lending activity trends for the past week in Aave"
    AI (Thinking): User wants historical lending data. I'll find Aave subgraph and query for recent borrow/supply events.
    AI (Tool Invocation): [Finds Aave subgraph, then executes time-filtered query for lending activities]
    AI (Response): "Aave lending trends (past week): [Shows borrow/supply volumes, popular assets, and rate changes]"
    ```

10. **Debugging and Exploration:**

    ```
    User: "What MCP tools are available for subgraph analysis?"
    AI (Thinking): User wants to know available MCP capabilities. I'll use the 'listMCPTools' action.
    AI (Tool Invocation): [Invokes 'listMCPTools']
    AI (Response): "Available MCP tools: search_subgraphs_by_keyword, get_top_subgraph_deployments, get_schema_by_subgraph_id, execute_query_by_subgraph_id, [etc.]"
    ```

**Key MCP Capabilities Demonstrated:**

-   **Dynamic Discovery**: Find subgraphs without knowing IDs
-   **Schema Introspection**: Explore available data structures
-   **Flexible Querying**: Execute complex GraphQL queries
-   **Cross-Network Analysis**: Compare data across different blockchains
-   **Real-time Data**: Access the latest blockchain information
-   **Natural Language Interface**: No need to write GraphQL manually

### Token API Interaction (via Chat)

This demonstrates how the Token API integration can be used through the chat interface. The AI agent would use the tools provided by `TokenApiProvider` (which in turn use `utils/chat/agentkit/token-api/utils.ts`) to fulfill these requests.

1.  **Fetching Token Balances:**

    ```
    User: "What's the UNI balance for vitalik.eth on mainnet?"
    AI (Thinking): User wants token balance. I need the address for vitalik.eth, the token symbol (UNI), and network (mainnet). I'll use the 'getTokenBalances' tool.
    AI (Tool Invocation): [Invokes 'getTokenBalances' with address resolved from vitalik.eth, contract for UNI (if specified, else all balances), networkId: 'mainnet']
    AI (Response): "Vitalik.eth has X UNI tokens on Mainnet. (USD Value: $Y)"
    ```

2.  **Fetching Token Transfers:**

    ```
    User: "Show me the latest 5 outgoing USDC transfers from 0x123...abc on Polygon."
    AI (Thinking): User wants token transfers. I need the address, token (USDC), network (Polygon), direction (outgoing), and limit (5). I'll use 'getTokenTransfers' tool.
    AI (Tool Invocation): [Invokes 'getTokenTransfers' with address: '0x123...abc', contract for USDC, networkId: 'matic', fromAddress: '0x123...abc', limit: 5]
    AI (Response): "Here are the latest 5 outgoing USDC transfers from 0x123...abc on Polygon: [Lists transfers with details like recipient, amount, time]"
    ```

3.  **Fetching Token Metadata:**
    ```
    User: "What's the decimal count for the WETH token on Arbitrum?"
    AI (Thinking): User wants token metadata (decimals). I need the token symbol (WETH) and network (Arbitrum). I'll use 'getTokenMetadata' tool.
    AI (Tool Invocation): [Invokes 'getTokenMetadata' with contract for WETH, networkId: 'arbitrum-one']
    AI (Response): "The WETH token on Arbitrum has 18 decimals."
    ```

### NFT API Interaction (via Chat)

The NFT API integration enables comprehensive NFT data analysis through natural language queries. The AI agent uses specialized NFT tools to access collection data, ownership patterns, sales analytics, and activity monitoring.

1.  **NFT Collection Analysis:**

    ```
    User: "Show me the top 5 NFT collections on mainnet"
    AI (Thinking): User wants NFT collection data. I'll use 'get-nft-collections' with networkId: 'mainnet' and limit: 5.
    AI (Tool Invocation): [Invokes 'get-nft-collections' with networkId: 'mainnet', limit: 5]
    AI (Response): "Here are the top 5 NFT collections on mainnet: [Lists collections with names, addresses, total supply, and floor prices]"
    ```

2.  **NFT Ownership Tracking:**

    ```
    User: "What NFTs does 0x123...abc own on Polygon?"
    AI (Thinking): User wants ownership data. I'll use 'get-nft-ownerships' with ownerAddress and networkId: 'matic'.
    AI (Tool Invocation): [Invokes 'get-nft-ownerships' with ownerAddress: '0x123...abc', networkId: 'matic']
    AI (Response): "0x123...abc owns X NFTs on Polygon: [Lists owned NFTs with collection names, token IDs, and metadata]"
    ```

3.  **NFT Sales Analysis:**

    ```
    User: "Show me recent CryptoPunks sales above 50 ETH"
    AI (Thinking): User wants sales data for CryptoPunks with price filter. I'll use 'get-nft-sales' with collection filter and price minimum.
    AI (Tool Invocation): [Invokes 'get-nft-sales' with contractAddress: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb', minPrice: '50000000000000000000', networkId: 'mainnet']
    AI (Response): "Recent CryptoPunks sales above 50 ETH: [Lists sales with token IDs, prices, buyers, sellers, and timestamps]"
    ```

4.  **NFT Activity Monitoring:**

    ```
    User: "What's the latest activity for Bored Ape Yacht Club?"
    AI (Thinking): User wants recent activity for BAYC. I'll use 'get-nft-activities' with the BAYC contract address.
    AI (Tool Invocation): [Invokes 'get-nft-activities' with contractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', networkId: 'mainnet', limit: 10]
    AI (Response): "Latest BAYC activity: [Lists recent transfers, sales, and other activities with details]"
    ```

5.  **NFT Holder Analysis:**

    ```
    User: "Who are the top holders of Azuki NFTs?"
    AI (Thinking): User wants holder distribution data. I'll use 'get-nft-holders' for the Azuki collection.
    AI (Tool Invocation): [Invokes 'get-nft-holders' with contractAddress: '0xed5af388653567af2f388e6224dc7c4b3241c544', networkId: 'mainnet']
    AI (Response): "Top Azuki holders: [Lists addresses with their token counts and percentages of total supply]"
    ```

6.  **Individual NFT Analysis:**

    ```
    User: "Tell me about CryptoPunk #1234"
    AI (Thinking): User wants specific NFT data. I'll use 'get-nft-items' with the CryptoPunks contract and token ID.
    AI (Tool Invocation): [Invokes 'get-nft-items' with contractAddress: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb', tokenId: '1234', networkId: 'mainnet']
    AI (Response): "CryptoPunk #1234: [Shows metadata, attributes, current owner, last sale price, and rarity information]"
    ```

These examples illustrate how the natural language queries are translated by the AI into structured calls to the Token and NFT API utility functions, which then fetch the data via the `/api/token-proxy`.

### Available Subgraphs

The integration includes several pre-configured subgraph endpoints:

```typescript
{
  UNISWAP_V3: "https://gateway.thegraph.com/api/{api-key}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV",
  AAVE_V3: "https://gateway.thegraph.com/api/{api-key}/subgraphs/id/JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk"
}
```

### Adding New Subgraph Endpoints

Here's a step-by-step guide to add a new subgraph endpoint (e.g., Compound Finance):

1. **Add Subgraph ID Constant**

    ```typescript
    // In utils/chat/agentkit/action-providers/graph-querier.ts
    const COMPOUND_V3_SUBGRAPH_ID =
        "AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9";
    ```

2. **Add Endpoint to SUBGRAPH_ENDPOINTS**

    ```typescript
    export const SUBGRAPH_ENDPOINTS: Record<string, string | EndpointGetter> = {
        // ... existing endpoints ...
        COMPOUND_V3: () => {
            const apiKey = process.env.GRAPH_API_KEY;
            if (!apiKey)
                throw new Error(
                    "GRAPH_API_KEY not found in environment variables"
                );
            return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${COMPOUND_V3_SUBGRAPH_ID}`;
        },
    };
    ```

3. **Update System Prompt**

    ```typescript
    // In app/api/chat/route.ts
    const compoundEndpoint =
        typeof SUBGRAPH_ENDPOINTS.COMPOUND_V3 === "function"
            ? SUBGRAPH_ENDPOINTS.COMPOUND_V3()
            : SUBGRAPH_ENDPOINTS.COMPOUND_V3;

    const prompt = `
      // ... existing prompt content ...
    
      For Compound V3, use this exact endpoint:
      "${compoundEndpoint}"
    
      Example GraphQL query for Compound V3:
      {
        endpoint: "${compoundEndpoint}",
        query: \`query {
          tokens(first: 5, orderBy: lastPriceBlockNumber, orderDirection: desc) {
            id
            name
            symbol
            decimals
          }
          rewardTokens(
            first: 5
            orderBy: token__lastPriceBlockNumber
            orderDirection: desc
          ) {
            id
            token {
              id
            }
            type
          }
        }\`
      }
    `;
    ```

4. **Add Example Queries**

    ```typescript
    // In utils/chat/tools.ts
    export const querySubgraph = {
        // ... existing configuration ...
        examples: [
            // ... existing examples ...
            {
                name: "Compound V3 Tokens",
                description: "Query Compound V3 token information",
                query: `query {
            tokens(first: 5, orderBy: lastPriceBlockNumber, orderDirection: desc) {
              id
              name
              symbol
              decimals
            }
            rewardTokens(
              first: 5
              orderBy: token__lastPriceBlockNumber
              orderDirection: desc
            ) {
              id
              token {
                id
              }
              type
            }
          }`,
                endpoint: "COMPOUND_V3",
            },
        ],
    };
    ```

5. **Test the Integration**

    ```typescript
    // Test query in chat interface
    User: "Show me the top 5 Compound V3 tokens"
    AI: [Executes GraphQL query and formats response]
    ```

6. **Error Handling**

    ```typescript
    // In graph-querier.ts
    invoke: async ({ endpoint, query, variables = {} }) => {
        try {
            const resolvedEndpoint =
                typeof endpoint === "function" ? endpoint() : endpoint;

            // Add specific error handling for Compound V3
            if (resolvedEndpoint.includes(COMPOUND_V3_SUBGRAPH_ID)) {
                // Add any Compound-specific error handling
            }

            const response = await fetch(resolvedEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, variables }),
            });

            if (!response.ok)
                throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            return JSON.stringify(data);
        } catch (error) {
            return JSON.stringify({
                error:
                    error instanceof Error
                        ? error.message
                        : "An unknown error occurred",
            });
        }
    };
    ```

7. **Documentation**

    - Update README with new endpoint information
    - Add example queries
    - Document any specific error cases
    - Include rate limiting considerations

8. **Best Practices**

    - Use pagination for large result sets
    - Implement proper error handling
    - Cache responses when appropriate
    - Monitor API usage
    - Test with various query parameters
    - Validate response data

9. **Testing Checklist**
    - [ ] Verify API key access
    - [ ] Test basic queries
    - [ ] Check error handling
    - [ ] Validate response format
    - [ ] Test pagination
    - [ ] Verify rate limiting
    - [ ] Check caching behavior
    - [ ] Test with different parameters

## Detailed Setup Guide

### Environment Variables

Proper configuration of environment variables is crucial for the application to run correctly and securely. Store these in a `.env.local` file at the root of your `packages/nextjs` directory. **Never commit your `.env.local` file to version control.**

1.  **`GRAPH_API_KEY`** (For The Graph Protocol - Required for both legacy and MCP integrations)

    -   ⚠️ Use a development key with limited permissions for querying subgraphs.
    -   _Note: This key is used by both `graph-querier.ts` (legacy) and `graph-mcp-provider.ts` (MCP) for accessing The Graph services._
    -   _MCP Usage: Used as Bearer token for authentication with The Graph's MCP server at `https://subgraphs.mcp.thegraph.com/sse`_

2.  **`OPENAI_API_KEY`** (For OpenAI - `app/api/chat/route.ts`)

    -   ⚠️ Set up usage limits to prevent unexpected charges

3.  **`NEXTAUTH_SECRET`**

    -   Generate a random string:

    ```bash
    openssl rand -base64 32
    ```

    -   ⚠️ Keep this secret secure and unique per environment

4.  **`AGENT_PRIVATE_KEY`** (For Agent's on-chain transactions - if applicable)

    -   ⚠️ **IMPORTANT**: This is for development only. Never use mainnet keys!
    -   For testing, generate a new private key:

    ```bash
    openssl rand -hex 32
    ```

    -   Must be prefixed with "0x"
    -   ⚠️ Store minimal funds for testing
    -   ⚠️ Never commit this key to version control

5.  **`NEXT_PUBLIC_GRAPH_API_URL`** (Base URL for Token API - `app/api/token-proxy/route.ts`)

    -   Optional: The base URL for the external Token API.
    -   Defaults to `https://token-api.thegraph.com` if not set.
    -   Used by `app/api/token-proxy`.

6.  **`NEXT_PUBLIC_GRAPH_API_KEY`** or **`GRAPH_TOKEN_API_KEY`** (Authentication for Token API - `app/api/token-proxy/route.ts`)

    -   Your API key for the external Token API.
    -   This is sent as the `X-Api-Key` header by the `token-proxy`.
    -   If not provided, the proxy might attempt to use `NEXT_PUBLIC_GRAPH_TOKEN`.

7.  **`NEXT_PUBLIC_GRAPH_TOKEN`** or **`GRAPH_TOKEN_API_BEARER_TOKEN`** (Alternative Authentication for Token API - `app/api/token-proxy/route.ts`)
    -   Your JWT token for the external Token API.
    -   This is sent as the `Authorization: Bearer <token>` header by the `token-proxy`.
    -   Used if `NEXT_PUBLIC_GRAPH_API_KEY` is not set.
    -   _Ensure one of the authentication methods (API Key or Bearer Token) is correctly set up if the target Token API requires authentication._

**General Best Practice for Environment Variables:**

-   Use `.env.local` for local development secrets.
-   For deployment (Vercel, Docker, etc.), use the platform's provided mechanism for setting environment variables securely.
-   Differentiate between `NEXT_PUBLIC_` prefixed variables (accessible client-side) and non-prefixed variables (server-side only). Use server-side only variables for sensitive keys whenever possible.

### Security Best Practices

-   Never commit `.env.local`
