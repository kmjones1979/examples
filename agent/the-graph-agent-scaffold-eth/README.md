# 🏗 Scaffold-ETH with AI Agent and The Graph Integration

<h4 align="center">
  <a href="https://docs.scaffoldeth.io">Documentation</a> |
  <a href="https://scaffoldeth.io">Website</a>
</h4>

🧪 An open-source toolkit for building decentralized applications (dapps) on the Ethereum blockchain, enhanced with AI-powered chat capabilities. Built using NextJS, RainbowKit, Foundry/Hardhat, Wagmi, Viem, TypeScript, and OpenAI.

## Table of Contents

-   [Features](#features)
-   [Requirements](#requirements)
-   [Quickstart](#quickstart)
-   [Architecture](#architecture)
    -   [Core Components](#core-components)
    -   [Key Files](#key-files)
    -   [Component Interaction](#component-interaction)
    -   [Data Flow](#data-flow)
-   [Key System Features](#key-system-features)
-   [Available Subgraphs](#available-subgraphs)
-   [Adding New Subgraph Endpoints](#adding-new-subgraph-endpoints)
-   [Detailed Setup Guide](#detailed-setup-guide)
    -   [Environment Variables](#environment-variables)
-   [Security Best Practices](#security-best-practices)
-   [Usage Examples](#usage-examples)
    -   [Chat Interface](#chat-interface)
    -   [GraphQL Queries](#graphql-queries)
    -   [Token API Interaction (via Chat)](#token-api-interaction-via-chat)
-   [API Interaction Best Practices](#api-interaction-best-practices)
    -   [Query Optimization](#query-optimization)
    -   [Error Handling](#error-handling)
    -   [Performance](#performance)
-   [Development Guidelines](#development-guidelines)
    -   [Adding New Actions](#adding-new-actions)
    -   [Customizing Responses](#customizing-responses)
    -   [Testing](#testing)
-   [Troubleshooting](#troubleshooting)
    -   [Common Issues](#common-issues)
-   [Contributing](#contributing)
-   [Documentation](#documentation)

## Features

-   ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it
-   🤖 **AI-Powered Chat Interface**: Natural language interaction with blockchain data and smart contracts
-   📊 **GraphQL Integration**: Query blockchain data through The Graph protocol
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

## Quickstart

1. Clone the repository:

```bash
git clone https://github.com/graphprotocol/examples.git
cd agent/the-graph-agent-scaffold-eth
```

2. Install dependencies:

```bash
yarn install
```

3. Set up environment variables in `.env.local`:

```bash
# The Graph Protocol API Key
GRAPH_API_KEY=your-graph-api-key-here

# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key-here

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-nextauth-secret-here

# Agent Private Key
AGENT_PRIVATE_KEY=your-agent-private-key-here
```

4. Start a local network:

```bash
yarn chain
```

5. Deploy test contracts:

```bash
yarn deploy
```

6. Start the NextJS app:

```bash
yarn start
```

Visit `http://localhost:3000` to interact with your application.

## Architecture

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

3.  **GraphQL Integration** (`utils/chat/agentkit/action-providers/graph-querier.ts`)

    -   **Functionality**: Enables the AI agent to fetch data from The Graph Protocol by constructing and executing GraphQL queries.
    -   **Key Aspects**:
        -   **Subgraph Endpoints**: Manages a list of pre-configured (and dynamically accessible via API key) subgraph URLs (e.g., Uniswap, Aave).
        -   **Dynamic Queries**: The AI can request queries against any of the configured subgraphs.
        -   **Type Safety**: Uses Zod schemas to validate the structure of GraphQL queries formulated by the agent.

4.  **Token API Integration** (Proxy: `app/api/token-proxy/route.ts`, Utilities: `utils/chat/agentkit/token-api/utils.ts`, Schemas: `utils/chat/agentkit/token-api/schemas.ts`)
    -   **Functionality**: Provides access to comprehensive token data (balances, transfers, metadata, market prices, etc.) from an external token API service (e.g., The Graph's Token API).
    -   **Key Aspects**:
        -   **Proxy Server**: A Next.js API route (`/api/token-proxy`) that securely forwards requests to the external token API. This is crucial for hiding API keys from the client-side.
        -   **Utility Functions**: A set of functions in `utils.ts` that simplify fetching specific token data by abstracting the direct API calls through the proxy. These are intended to be used by AgentKit actions.
        -   **Data Schemas**: Zod schemas in `schemas.ts` ensure type safety and validation for both the parameters sent to the API and the data received.

### Key Files

This section highlights critical files and their roles within the application architecture.

1.  **GraphQL Query Handler** (`utils/chat/agentkit/action-providers/graph-querier.ts`)

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

2.  **Chat API Route** (`app/api/chat/route.ts`)

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

3.  **Chat Interface** (`app/chat/page.tsx`)

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

4.  **Token API Proxy Route** (`app/api/token-proxy/route.ts`)

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

5.  **Token API Utilities** (`utils/chat/agentkit/token-api/utils.ts`)

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

6.  **Token API Schemas** (`utils/chat/agentkit/token-api/schemas.ts`)

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
    GraphQL Handler (graph-querier.ts)  OR  Token API Utilities (token-api/utils.ts)
    ↓                                       ↓ Calls Token API Proxy
    ↓ Executes queries (The Graph)          Token API Proxy (token-proxy/route.ts)
    ↓                                       ↓ Queries External Token API
    ↓ Returns results                       ↓ Returns results
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

1.  **`GRAPH_API_KEY`** (For The Graph Protocol - `graph-querier.ts`)

    -   ⚠️ Use a development key with limited permissions for querying subgraphs.
    -   _Note: This key is used by `graph-querier.ts` for accessing The Graph subgraphs._

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

-   Never commit `.env.local` to version control
-   Keep private keys secure
-   Use dedicated development keys only
-   Rotate keys regularly
-   Store minimal funds in development keys
-   Use air-gapped devices for key generation in production
-   Implement rate limiting for API endpoints
-   Monitor API usage and set up alerts
-   Regular security audits recommended

⚠️ **IMPORTANT SECURITY NOTICE**:
This code is not audited and is intended for development and learning purposes only.

-   Do not use in production without a security audit
-   Do not store significant funds in development keys
-   Do not expose API keys or private keys
-   Use at your own risk!

## Usage Examples

### Chat Interface

1. **Querying Uniswap Pools**

```
User: "Show me the top 5 Uniswap pools by volume"
AI: [Executes GraphQL query and formats response]
```

2. **Contract Interactions**

```
User: "What was the last amount borrowed on Aave?"
AI: [Queries for the borrows and responds]
```

### GraphQL Queries

Example query for Uniswap V3 pools:

```graphql
query {
    pools(first: 100, orderBy: createdAtTimestamp, orderDirection: desc) {
        id
        token0 {
            symbol
        }
        token1 {
            symbol
        }
        volumeUSD
        createdAtTimestamp
    }
}
```

Example query for Aave V3 borrows:

```graphql
query {
    borrows(first: 100, orderBy: timestamp, orderDirection: desc) {
        amount
        amountUSD
        asset {
            name
            symbol
        }
    }
}
```

Example error response:

```json
{
    "errors": [
        {
            "message": "Invalid API key",
            "locations": [],
            "path": [],
            "extensions": {
                "code": "UNAUTHORIZED"
            }
        }
    ]
}
```

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

These examples illustrate how the natural language queries are translated by the AI into structured calls to the Token API utility functions, which then fetch the data via the `/api/token-proxy`.

## API Interaction Best Practices

This section was previously "Rate Limiting and Best Practices" and has been broadened. These apply to interactions with both The Graph subgraphs and the external Token API.

### Query Optimization

-   Use pagination for large result sets
-   Limit the number of fields requested
-   Cache responses when appropriate
-   Use variables for dynamic values

### Error Handling

-   Always check for error responses
-   Implement retry logic with backoff
-   Log errors for debugging
-   Provide user-friendly error messages

### Performance

-   Monitor query execution time
-   Use appropriate indexes
-   Implement request batching
-   Cache frequently accessed data

## Development Guidelines

Guidelines for extending and maintaining the application.

### Adding New Actions (AgentKit)

1.  **Define the Need**: What new capability do you want the AI to have? (e.g., fetch NFT floor prices, execute a swap quote).
2.  **Implement ActionProvider Interface**:
    -   Create a new class that implements `ActionProvider` (similar to `GraphQuerierProvider`).
    -   If interacting with an external API, consider if a new proxy route (like `/api/token-proxy`) is needed for security or if existing ones can be used.
    -   Develop utility functions (like those in `token-api/utils.ts`) that your provider's actions will call. These utilities should handle the actual API calls, parameter construction, and response normalization.
    -   Define Zod schemas for the action's input parameters and expected output structure (in a relevant `schemas.ts` file).
3.  **Register Provider in AgentKit**:
    -   In `app/api/chat/route.ts` (or a dedicated AgentKit setup file), add your new provider to the list of providers when `createAgentKit` is called.
    -   Ensure `getTools(agentKit)` correctly picks up actions from your new provider.
4.  **Update System Prompts**:
    -   Modify the system prompt in `app/api/chat/route.ts` to inform the AI about the new tool:
        -   Its name.
        -   A clear description of what it does.
        -   The schema of its expected input (especially key parameters).
        -   An example of how to use it.
5.  **Implement Error Handling**:
    -   Your action's `invoke` method should have robust error handling.
    -   Catch errors from API calls or internal logic.
    -   Return errors in a structured way that the AI or chat interface can understand and display gracefully (e.g., using the `error` field of `ApiResponseSchema`).
6.  **Testing**:
    -   Unit test your utility functions and the `invoke` method of your action.
    -   Perform integration testing by sending chat messages that should trigger your new action. Verify the AI calls it correctly and processes the result.

### Customizing Responses

How the AI presents information back to the user.

1.  **Data Formatting in Agent**:
    -   While the AI handles natural language generation, your tools should return data in a clean, structured, and predictable format (often JSON).
    -   The system prompt can guide the AI on how to summarize or present this data (e.g., "When presenting token balances, include the token symbol, amount, and USD value if available.").
2.  **Markdown Rendering**: The chat interface uses `ReactMarkdown`. Your AI can be prompted to use markdown for better readability (e.g., tables, lists, bolding).
3.  **Handling Edge Cases**:
    -   Prompt the AI on how to respond if data is not found, or if an error occurs (e.g., "If token details are not found, clearly state that.").
    -   Your tools should return distinct error messages or codes for different failure scenarios.
4.  **Providing Helpful Context**:
    -   Encourage the AI (via system prompt) to not just dump data, but to provide context or brief explanations, especially for complex information.
    -   For example, after showing token transfers, it might add, "These are the most recent transfers within the last X days."

### Testing

A multi-layered approach to ensure reliability.

1.  **Unit Test Actions & Utilities**:
    -   Write unit tests (e.g., using Jest or Vitest) for your `ActionProvider` methods (especially `invoke`) and any utility functions (like those in `token-api/utils.ts`).
    -   Mock external API calls to test logic in isolation.
    -   Test various input scenarios, including valid, invalid, and edge cases.
    -   Verify correct parameter construction for API calls and proper response parsing/normalization.
2.  **Integration Test Flows**:
    -   Test the interaction between components: Chat UI -> Chat API -> AgentKit -> Action Provider -> External API (mocked or live dev instance).
    -   Ensure that a user query correctly triggers the intended action and that the data flows through the system as expected.
3.  **End-to-End Chat Testing**:
    -   Manually interact with the chat interface using a wide range of queries.
    -   Verify the AI's understanding, tool selection, and response quality.
    -   Test conversational flows (e.g., follow-up questions).
4.  **Error Scenario Testing**:
    -   Deliberately introduce conditions that cause errors (e.g., invalid API keys, incorrect query parameters, external API downtime (mocked)).
    -   Verify that errors are handled gracefully at each level (action, proxy, API route, UI) and that informative messages are shown to the user.
    -   Check the system prompt for instructions on how the AI should behave when tools return errors.

## Troubleshooting

### Common Issues

1. **API Key Errors**

    - Verify environment variables are set
    - Check API key validity
    - Ensure sufficient credits

2. **Authentication Errors**

    - Verify SIWE sign-in
    - Check session validity
    - Review NextAuth configuration

3. **Query Errors** (GraphQL & Token API)

    - Validate GraphQL syntax
    - Check subgraph schema
    - Verify variable formatting
    - For Token API, ensure the `path` parameter in `app/api/token-proxy/route.ts` is correctly formed and that all required parameters for the specific external API endpoint are being passed. Check the proxy's server-side logs for details on the outgoing request.

4. **Token API Proxy Issues**
    - **Misconfigured URL/Auth**: Double-check `NEXT_PUBLIC_GRAPH_API_URL`, `NEXT_PUBLIC_GRAPH_API_KEY`, and `NEXT_PUBLIC_GRAPH_TOKEN` (and their non-public equivalents if used) in your `.env.local` file.
    - **Path resolution**: Ensure the `path` parameter sent to `/api/token-proxy` correctly maps to the intended external API endpoint.
    - **External API Downtime/Errors**: The external Token API itself might be having issues. Check its status page if available. The proxy should forward error messages from the external API.
    - **Server-side logs**: Check the terminal output where your Next.js app is running for logs from `app/api/token-proxy/route.ts`. These logs often contain the exact URL being called and any errors received.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for guidelines.

## Documentation

For more detailed information, visit our [documentation](https://docs.scaffoldeth.io).
