# The Graph Token API SDK

A comprehensive SDK for interacting with The Graph Token API built on Scaffold-ETH 2, featuring advanced data fetching hooks, reusable UI components, and complete TypeScript support.

## Table of Contents

-   [Overview](#overview)
-   [Installation](#installation)
-   [API Configuration](#api-configuration)
    -   [Environment Setup](#environment-setup)
    -   [Next.js API Route Implementation](#nextjs-api-route-implementation)
    -   [Authentication Flow](#authentication-flow)
-   [Core Architecture](#core-architecture)
    -   [Directory Structure](#directory-structure)
    -   [Data Flow](#data-flow)
-   [Hooks Library](#hooks-library)
    -   [Base Hook: useTokenApi](#base-hook-usetokenapi)
    -   [Specialized Hooks](#specialized-hooks)
        -   [useTokenMetadata](#usetokenmetadata)
        -   [useTokenBalances](#usetokenbalances)
        -   [useTokenHolders](#usetokenholders)
        -   [useTokenTransfers](#usetokentransfers)
        -   [useTokenOHLCByPool](#usetokenohlcbypool)
        -   [useTokenOHLCByContract](#usetokenohlcbycontract)
        -   [useTokenPools](#usetokenpools)
        -   [useTokenSwaps](#usetokenswaps)
-   [UI Components](#ui-components)
    -   [Common Patterns](#common-patterns)
    -   [Component Gallery](#component-gallery)
-   [Configuration System](#configuration-system)
    -   [Network Configuration](#network-configuration)
    -   [Protocol Configuration](#protocol-configuration)
    -   [Example Tokens](#example-tokens)
    -   [Time Configuration](#time-configuration)
    -   [Block Time Utilities](#block-time-utilities)
-   [Utility Functions](#utility-functions)
    -   [Address Utilities](#address-utilities)
-   [Type System](#type-system)
    -   [Common Types](#common-types)
-   [Example Usage](#example-usage)
-   [API Endpoint References](#api-endpoint-references)
-   [Troubleshooting](#troubleshooting)
-   [Contributing](#contributing)

## Overview

This SDK provides a complete toolkit for interacting with The Graph Token API, enabling developers to easily fetch and display token-related data across multiple EVM networks. It's built as part of a Scaffold-ETH 2 application but the hooks and components can be used in any React project.

Key features:

-   **React Hooks Library**: Specialized hooks for different token API endpoints
-   **UI Component Collection**: Ready-to-use components for displaying token data
-   **API Proxy Integration**: Secure API communication with authentication handling
-   **Multi-Network Support**: Works with Ethereum, Arbitrum, Base, BSC, Optimism, and Polygon
-   **TypeScript Support**: Full type safety with comprehensive interfaces

For a detailed guide on how the components and hooks were built, see the [Components Tutorial](TUTORIAL.MD).
To build the test page step-by-step yourself, follow the [Test Page Workshop](WORKSHOP.MD).

## Installation

```bash
# Clone the repository
git clone https://github.com/graphprotocol/examples.git
cd examples/token-api/token-api-scaffold-eth

# Install dependencies
yarn install

# Create an .env.local file with your Graph API token
echo "NEXT_PUBLIC_GRAPH_TOKEN=your_graph_api_token_here" > .env.local

# Start the development server
yarn start
```

Visit `http://localhost:3000/token-api` to see all components in action.

## API Configuration

### Environment Setup

The SDK requires a Graph API token for authentication. You can obtain one from [The Graph Market](https://thegraph.market/).

Create a `.env.local` file in the root directory:

```env
# Required: Graph API Token for authentication
NEXT_PUBLIC_GRAPH_TOKEN=your_graph_api_token_here

# Optional: API URL (defaults to the stage URL if not provided)
NEXT_PUBLIC_GRAPH_API_URL=https://token-api.thegraph.com
```

### Next.js API Route Implementation

The SDK uses Next.js App Router API routes to create a secure proxy for token API requests. This keeps API keys secure and handles authentication properly.

The proxy route is implemented in `packages/nextjs/app/api/token-proxy/route.ts`:

```typescript
// token-proxy/route.ts
export async function GET(request: NextRequest) {
    try {
        // Get query parameters from the request
        const searchParams = request.nextUrl.searchParams;

        // Get the path to the API endpoint (required)
        const path = searchParams.get("path");
        if (!path) {
            return NextResponse.json(
                { error: "Missing 'path' parameter" },
                { status: 400 }
            );
        }

        // Build the complete URL with the API base URL
        const url = new URL(path, API_URL);

        // Forward query parameters
        searchParams.forEach((value, key) => {
            if (key !== "path") {
                url.searchParams.append(key, value);
            }
        });

        // Set up authentication headers
        const headers: HeadersInit = {
            Accept: "application/json",
            "Content-Type": "application/json",
        };

        // Use API key if available, otherwise use JWT token
        if (process.env.NEXT_PUBLIC_GRAPH_API_KEY) {
            headers["X-Api-Key"] = process.env.NEXT_PUBLIC_GRAPH_API_KEY;
        } else if (process.env.NEXT_PUBLIC_GRAPH_TOKEN) {
            headers[
                "Authorization"
            ] = `Bearer ${process.env.NEXT_PUBLIC_GRAPH_TOKEN}`;
        }

        // Make the API request
        const response = await fetch(url.toString(), {
            method: "GET",
            headers,
            cache: "no-store", // Disable caching
        });

        // Parse and return the response
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            },
            { status: 500 }
        );
    }
}
```

### Authentication Flow

The authentication flow works as follows:

1. Client hooks call the local API route (`/api/token-proxy`) with the endpoint path and parameters
2. The API route adds authentication headers (API key or JWT token)
3. The API route forwards the request to the Graph Token API
4. The API route returns the response to the client

This approach keeps API keys secure (they never leave the server) and prevents CORS issues.

## Core Architecture

### Directory Structure

The SDK follows a structured organization:

```
app/
├── token-api/              # Main directory for the token API
│   ├── _components/        # UI components
│   ├── _config/            # Configuration files
│   ├── _hooks/             # Data fetching hooks
│   ├── _types/             # TypeScript type definitions
│   ├── _utils/             # Utility functions
│   └── page.tsx            # Main page showcasing all components
└── api/
    └── token-proxy/        # API proxy route
        └── route.ts        # API handler implementation
```

### Data Flow

The data flow follows this pattern:

1. **Component Initialization**: UI component initializes with state for inputs
2. **Hook Setup**: Component calls a specialized hook with parameters
3. **API Request**: Hook calls the API proxy route with endpoint and parameters
4. **Authentication**: API proxy adds authentication headers
5. **Data Fetching**: API proxy fetches data from the Graph Token API
6. **Response Handling**: Hook processes the response and returns it to the component
7. **Rendering**: Component renders the data with appropriate loading/error states

## Hooks Library

### Base Hook: useTokenApi

`useTokenApi` is the foundation for all specialized hooks. It provides generic API interaction with error handling, loading states, and data formatting.

**Location**: `packages/nextjs/app/token-api/_hooks/useTokenApi.ts`

```typescript
export const useTokenApi = <DataType, ParamsType = Record<string, any>>(
    endpoint: string,
    params?: ParamsType,
    options: TokenApiOptions = {}
) => {
    const { skip = false, refetchInterval } = options;
    const [data, setData] = useState<DataType | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const [lastUpdated, setLastUpdated] = useState<number | undefined>(
        undefined
    );

    // Fetch implementation, error handling, and refetch logic...

    return {
        data,
        isLoading,
        error,
        refetch: fetchData,
        lastUpdated,
    };
};
```

**Key Features**:

-   **Generic Type Parameters**: Allows for typed responses with `DataType` and `ParamsType`
-   **Conditional Fetching**: Supports skipping fetches with the `skip` option
-   **Auto-Refetching**: Supports auto-refreshing with `refetchInterval`
-   **Error Handling**: Comprehensive error handling and state management
-   **Manual Refetch**: Provides a function to manually trigger refetches

### Specialized Hooks

#### useTokenMetadata

Fetches detailed information about a token contract.

**Location**: `packages/nextjs/app/token-api/_hooks/useTokenMetadata.ts`

```typescript
export const useTokenMetadata = (
    contract: string | undefined,
    params?: TokenMetadataParams,
    options = { skip: contract ? false : true }
) => {
    // Format endpoint
    const normalizedContract = cleanContractAddress(contract);
    return useTokenApi<TokenMetadataResponse>(
        normalizedContract ? `tokens/evm/${normalizedContract}` : "",
        { ...params },
        options
    );
};
```

**Parameters**:

-   `contract`: Token contract address
-   `params`: Optional parameters
    -   `network_id`: Network identifier
    -   `include_market_data`: Whether to include price data (default: true)
-   `options`: Hook options (skip, refetchInterval)

**Response Type**:

```typescript
interface TokenMetadata {
    contract_address: string;
    name: string;
    symbol: string;
    decimals: number;
    total_supply: string;
    logo_url?: string;
    market_data?: {
        price_usd: number;
        price_change_percentage_24h: number;
        market_cap: number;
        total_volume_24h: number;
    };
}
```

#### useTokenBalances

Fetches token balances for a wallet address.

**Location**: `packages/nextjs/app/token-api/_hooks/useTokenBalances.ts`

```typescript
export const useTokenBalances = (
    address: string | undefined,
    params?: TokenBalancesParams,
    options = { skip: address ? false : true }
) => {
    // Normalize the address
    const normalizedAddress =
        address && !address.startsWith("0x") ? `0x${address}` : address;

    // Call the base hook with the appropriate endpoint
    const result = useTokenApi<TokenBalancesResponse>(
        normalizedAddress ? `balances/evm/${normalizedAddress}` : "",
        { ...params },
        options
    );

    // Format the result for easier consumption
    let formattedData: TokenBalance[] = [];
    if (result.data) {
        if (Array.isArray(result.data)) {
            formattedData = result.data;
        } else if ("data" in result.data && Array.isArray(result.data.data)) {
            formattedData = result.data.data;
        }
    }

    return {
        ...result,
        data: formattedData,
    };
};
```

**Parameters**:

-   `address`: Wallet address
-   `params`: Optional parameters
    -   `network_id`: Network identifier
    -   `page`: Page number
    -   `page_size`: Results per page
    -   `min_amount`: Minimum token amount
    -   `contract_address`: Filter for specific token
-   `options`: Hook options

**Response Type**:

```typescript
interface TokenBalance {
    contract_address: string;
    amount: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    amount_usd?: number;
}
```

#### useTokenHolders

Fetches holder information for a token contract.

**Location**: `packages/nextjs/app/token-api/_hooks/useTokenHolders.ts`

```typescript
export const useTokenHolders = (
    contract: string | undefined,
    params?: TokenHoldersParams,
    options = { skip: contract ? false : true }
) => {
    const normalizedContract = cleanContractAddress(contract);

    return useTokenApi<TokenHoldersResponse>(
        normalizedContract ? `holders/evm/${normalizedContract}` : "",
        { ...params },
        options
    );
};
```

**Parameters**:

-   `contract`: Token contract address
-   `params`: Optional parameters
    -   `network_id`: Network identifier
    -   `page`: Page number
    -   `page_size`: Results per page
    -   `order_by`: Sort order ("asc" or "desc")
-   `options`: Hook options

**Response Type**:

```typescript
interface TokenHolder {
    address: string;
    balance: string;
    last_updated_block: number;
    balance_usd?: number;
    token_share?: number;
}

interface TokenHoldersResponse {
    holders: TokenHolder[];
    pagination: {
        page: number;
        page_size: number;
        total_pages: number;
    };
    total: number;
}
```

#### useTokenTransfers

Fetches token transfer events.

**Location**: `packages/nextjs/app/token-api/_hooks/useTokenTransfers.ts`

```typescript
export const useTokenTransfers = (
    address: string | undefined, // Address used as the 'to' parameter by default
    params?: TokenTransfersParams,
    options = { skip: address ? false : true }
) => {
    // Endpoint for the base hook
    const endpoint = "transfers/evm";

    // Prepare query parameters, adding 'address' as 'to' param
    const queryParams: Record<string, any> = {
        ...params, // Spread other parameters like network_id, contract, limit, from
        to: address,
        network_id: params?.network_id, // Ensure network_id is passed
    };

    // Clean up undefined params
    Object.keys(queryParams).forEach((key) => {
        if (queryParams[key] === undefined) {
            delete queryParams[key];
        }
    });

    // Call the base API hook
    return useTokenApi<TokenTransfersResponse>(endpoint, queryParams, options);
};
```

**Parameters**:

-   `address`: Wallet address (used as the `to` parameter)
-   `params`: Optional parameters
    -   `network_id`: Network identifier (required by API)
    -   `from`: Filter by sender address
    -   `to`: Filter by recipient address (overridden by the main `address` argument)
    -   `contract`: Filter by token contract
    -   `startTime`, `endTime`: Filter by timestamp (Unix seconds)
    -   `orderBy`, `orderDirection`: Sorting options
    -   `limit`: Results per page
    -   `page`: Page number
-   `options`: Hook options (skip, refetchInterval)

**Response Type**:

```typescript
interface TokenTransferItem {
    block_num: number;
    datetime?: string;
    timestamp?: number;
    date?: string;
    contract: string;
    from: string;
    to: string;
    amount: string;
    transaction_id: string;
    decimals: number;
    symbol: string;
    network_id: string;
    price_usd?: number;
    value_usd?: number;
}

interface TokenTransfersResponse {
    data: TokenTransferItem[];
    pagination?: {
        page: number;
        page_size: number;
        total_pages: number;
    };
    total_results?: number;
}
```

#### useTokenOHLCByPool

Fetches price history for a liquidity pool.

**Location**: `packages/nextjs/app/token-api/_hooks/useTokenOHLCByPool.ts`

```typescript
export function useTokenOHLCByPool(
    pool: string | undefined,
    params?: PoolOHLCParams,
    options = { skip: false }
) {
    // Normalize and clean the pool address
    const normalizedPool = pool ? cleanContractAddress(pool) : undefined;

    // Default skip to true if no pool address is provided
    const skip = options.skip || !normalizedPool;

    // Create the endpoint path
    const endpoint = normalizedPool ? `ohlc/pools/evm/${normalizedPool}` : "";

    // Call the base API hook with the proper configuration
    return useTokenApi<PoolOHLCResponse>(
        endpoint,
        { ...params },
        { ...options, skip }
    );
}
```

**Parameters**:

-   `pool`: Pool contract address
-   `params`: Optional parameters
    -   `network_id`: Network identifier
    -   `from_timestamp`: Start timestamp
    -   `to_timestamp`: End timestamp
    -   `resolution`: Data resolution ("5m", "15m", "30m", "1h", "2h", "4h", "1d", "1w")
    -   `page`: Page number
    -   `page_size`: Results per page
-   `options`: Hook options

**Response Type**:

```typescript
interface OHLCDataPoint {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume_token0: number;
    volume_token1: number;
    volume_usd?: number;
}

interface PoolOHLCResponse {
    ohlc?: OHLCDataPoint[];
    pool_address?: string;
    token0_address?: string;
    token0_symbol?: string;
    token1_address?: string;
    token1_symbol?: string;
    protocol?: string;
    network_id?: string;
    resolution?: string;
    pagination?: {
        page: number;
        page_size: number;
        total_pages: number;
    };
}
```

#### useTokenOHLCByContract

Fetches price history for a token contract.

**Location**: `packages/nextjs/app/token-api/_hooks/useTokenOHLCByContract.ts`

```typescript
export function useTokenOHLCByContract(
    options: UseTokenOHLCByContractOptions = {}
) {
    const {
        contract,
        network,
        timeframe = 86400,
        limit = 100,
        enabled = true,
        startTime,
        endTime,
    } = options;

    const normalizedContract = contract?.toLowerCase();
    const endpoint = normalizedContract
        ? `ohlc/prices/evm/${normalizedContract}`
        : "";

    return useTokenApi<ContractOHLCResponse>(
        endpoint,
        {
            network_id: network,
            interval: timeframe === 86400 ? "1d" : "1h",
            limit,
            startTime,
            endTime,
        },
        {
            skip: !normalizedContract || !enabled,
        }
    );
}
```

**Parameters**:

-   `options`: Configuration options
    -   `contract`: Token contract address
    -   `network`: Network identifier
    -   `timeframe`: Time interval in seconds (default: 86400)
    -   `startTime`: Start timestamp (Unix seconds)
    -   `endTime`: End timestamp (Unix seconds)
    -   `limit`: Number of results (default: 100)
    -   `enabled`: Whether to enable the query (default: true)

**Response Type**:

```typescript
interface ContractOHLCResponse {
    contract_address?: string;
    token_name?: string;
    token_symbol?: string;
    token_decimals?: number;
    network_id?: NetworkId;
    resolution?: string;
    ohlc?: OHLCDataPoint[];
    data?: Array<{
        datetime: string;
        ticker: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>;
}
```

#### useTokenPools

Fetches information about liquidity pools.

**Location**: `packages/nextjs/app/token-api/_hooks/useTokenPools.ts`

```typescript
export const useTokenPools = (params?: PoolsParams, options = {}) => {
    return useTokenApi<PoolsResponse>("pools/evm", { ...params }, options);
};
```

**Parameters**:

-   `params`: Optional parameters
    -   `network_id`: Network identifier
    -   `token`: Filter by token address
    -   `pool`: Filter by pool address
    -   `symbol`: Filter by token symbol
    -   `factory`: Filter by factory address
    -   `protocol`: Filter by protocol
    -   `page`: Page number
    -   `page_size`: Results per page
    -   `sort_by`: Sort field ("tvl" or "creation_date")
    -   `sort_direction`: Sort direction ("asc" or "desc")
    -   `include_reserves`: Include reserve data
-   `options`: Hook options

**Response Type**:

```typescript
interface Pool {
    block_num: number;
    datetime: string;
    transaction_id: string;
    factory: string;
    pool: string;
    token0: TokenInfo;
    token1: TokenInfo;
    fee: number;
    protocol: string;
    network_id: string;
}

interface PoolsResponse {
    data: Pool[];
    pagination: {
        previous_page: number;
        current_page: number;
        next_page: number;
        total_pages: number;
    };
    total_results: number;
}
```

#### useTokenSwaps

Fetches DEX swap events.

**Location**: `packages/nextjs/app/token-api/_hooks/useTokenSwaps.ts`

```typescript
export const useTokenSwaps = (
    params: SwapsParams,
    options: { skip?: boolean } = {}
) => {
    return useTokenApi<Swap[]>("swaps/evm", params, options);
};
```

**Parameters**:

-   `params`: Query parameters
    -   `network_id`: Network identifier (required)
    -   `pool`: Filter by pool address
    -   `caller`: Filter by caller address
    -   `sender`: Filter by sender address
    -   `recipient`: Filter by recipient address
    -   `tx_hash`: Filter by transaction hash
    -   `protocol`: Filter by protocol
    -   `page`: Page number
    -   `page_size`: Results per page
-   `options`: Hook options

**Response Type**:

```typescript
interface Swap {
    block_num: number;
    datetime: string;
    transaction_id: string;
    caller: string;
    pool: string;
    factory?: string;
    sender: string;
    recipient: string;
    network_id: string;
    amount0: string;
    amount1: string;
    token0?: { address: string; symbol: string; decimals: number } | string;
    token1?: { address: string; symbol: string; decimals: number } | string;
    amount0_usd?: number;
    amount1_usd?: number;
    protocol?: string;
}
```

## UI Components

### Common Patterns

All components follow these common patterns:

1. **Collapsible UI**: Uses `<details>` and `<summary>` for better space management
2. **Form Inputs**: Uses Scaffold-ETH components for address inputs
3. **Loading States**: Clear loading indicators during API requests
4. **Error Handling**: User-friendly error messages
5. **Network Selection**: Dropdown for network selection
6. **Pagination**: For navigating large result sets
7. **Responsive Design**: Works on all screen sizes

### Component Gallery

The SDK includes UI components for each data type:

-   **GetMetadata**: Displays token metadata information
-   **GetBalances**: Shows token balances for an address
-   **GetHolders**: Lists token holders with pagination
-   **GetTransfers**: Displays token transfer history
-   **GetOHLCByContract**: Shows price charts for tokens
-   **GetOHLCByPool**: Shows price charts for liquidity pools
-   **GetSwaps**: Displays DEX swap events
-   **GetPools**: Lists liquidity pools

Example usage:

```tsx
import { GetMetadata } from "~~/app/token-api/_components/GetMetadata";
import { GetBalances } from "~~/app/token-api/_components/GetBalances";

export default function YourPage() {
    return (
        <div>
            <GetMetadata
                initialContractAddress="0xc944E90C64B2c07662A292be6244BDf05Cda44a7"
                initialNetwork="mainnet"
                isOpen={true}
            />
            <GetBalances
                initialAddress="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
                initialNetwork="mainnet"
                isOpen={true}
            />
        </div>
    );
}
```

## Configuration System

### Network Configuration

**Location**: `packages/nextjs/app/token-api/_config/networks.ts`

Defines supported networks and provides helper functions:

```typescript
export const EVM_NETWORKS: EVMNetwork[] = [
    { id: "mainnet", name: "Ethereum", blockExplorer: "https://etherscan.io" },
    { id: "base", name: "Base", blockExplorer: "https://basescan.org" },
    {
        id: "arbitrum-one",
        name: "Arbitrum",
        blockExplorer: "https://arbiscan.io",
    },
    { id: "bsc", name: "BSC", blockExplorer: "https://bscscan.com" },
    {
        id: "optimism",
        name: "Optimism",
        blockExplorer: "https://optimistic.etherscan.io",
    },
    { id: "matic", name: "Polygon", blockExplorer: "https://polygonscan.com" },
];

// Helper functions
export const getNetworkById = (id: NetworkId): EVMNetwork | undefined => {
    /*...*/
};
export const getNetworkName = (id: NetworkId): string => {
    /*...*/
};
export const getBlockExplorerTokenUrl = (
    networkId: NetworkId,
    tokenAddress: string
): string => {
    /*...*/
};
export const getBlockExplorerAddressUrl = (
    networkId: NetworkId,
    address: string
): string => {
    /*...*/
};
export const getBlockExplorerTxUrl = (
    networkId: NetworkId,
    txHash: string
): string => {
    /*...*/
};
```

### Protocol Configuration

**Location**: `packages/nextjs/app/token-api/_config/protocols.ts`

Defines supported protocols and provides helper functions:

```typescript
export const PROTOCOLS: Protocol[] = [
    { id: "uniswap_v2", name: "Uniswap V2" },
    { id: "uniswap_v3", name: "Uniswap V3" },
];

// Helper functions
export const getProtocolById = (id: ProtocolId): Protocol | undefined => {
    /*...*/
};
export const getProtocolName = (id: ProtocolId): string => {
    /*...*/
};
export const formatProtocolDisplay = (protocolId: ProtocolId): string => {
    /*...*/
};
```

### Example Tokens

**Location**: `packages/nextjs/app/token-api/_config/exampleTokens.ts`

Provides example tokens for each network for testing purposes:

```typescript
export const EXAMPLE_TOKENS: Record<NetworkId, TokenExample[]> = {
    mainnet: [
        {
            address: "0xc944E90C64B2c07662A292be6244BDf05Cda44a7",
            name: "The Graph",
            symbol: "GRT",
            decimals: 18,
            description: "Indexing protocol for querying networks",
        },
        // More tokens...
    ],
    // More networks...
};

// Helper functions
export const getExampleTokensForNetwork = (
    networkId: NetworkId
): TokenExample[] => {
    /*...*/
};
export const getFirstExampleTokenForNetwork = (
    networkId: NetworkId
): TokenExample | undefined => {
    /*...*/
};
export const getExampleTokenAddress = (networkId: NetworkId): string => {
    /*...*/
};
```

### Time Configuration

**Location**: `packages/nextjs/app/token-api/_config/timeConfig.ts`

Defines time intervals and spans for data querying:

```typescript
export const TIME_INTERVALS: TimeInterval[] = [
    { id: "1h", name: "1 Hour" },
    { id: "4h", name: "4 Hours" },
    { id: "1d", name: "1 Day" },
    { id: "1w", name: "1 Week" },
];

export const TIME_SPANS: TimeSpan[] = [
    { id: "1d", name: "Last 24 Hours", seconds: 86400 },
    { id: "7d", name: "Last 7 Days", seconds: 604800 },
    { id: "30d", name: "Last 30 Days", seconds: 2592000 },
    // More time spans...
];

// Helper functions
export const getTimeSpanById = (id: string): TimeSpan | undefined => {
    /*...*/
};
export const getTimeIntervalById = (id: string): TimeInterval | undefined => {
    /*...*/
};
export const getTimeRange = (timeSpanId: string) => {
    /*...*/
};
```

### Block Time Utilities

**Location**: `packages/nextjs/app/token-api/_config/blockTimeUtils.ts`

Provides utilities for converting between block numbers and timestamps:

```typescript
// Current block numbers (estimated for May 2024)
export const CURRENT_BLOCK_NUMBERS: Record<NetworkId, number> = {
    mainnet: 19200000, // Ethereum mainnet
    "arbitrum-one": 175000000, // Arbitrum
    // More networks...
};

// Average block time in seconds for different networks
export const BLOCK_TIMES: Record<NetworkId, number> = {
    mainnet: 12, // Ethereum mainnet
    "arbitrum-one": 0.25, // Arbitrum
    // More networks...
};

// Helper function to estimate date from block number and network
export const estimateDateFromBlock = (
    blockNum: number | undefined,
    networkId: NetworkId
): Date => {
    /*...*/
};
```

## Utility Functions

### Address Utilities

**Location**: `packages/nextjs/app/token-api/_utils/utils.ts`

Provides utilities for working with addresses:

```typescript
/**
 * Cleans a contract address by removing spaces, converting to lowercase, and ensuring 0x prefix
 * @param address The contract address to clean
 * @returns The cleaned address
 */
export function cleanContractAddress(address?: string): string {
    if (!address) return "";

    // Remove spaces, convert to lowercase
    let cleaned = address.trim().toLowerCase();

    // Ensure it has the 0x prefix
    if (!cleaned.startsWith("0x")) {
        cleaned = "0x" + cleaned;
    }

    return cleaned;
}
```
