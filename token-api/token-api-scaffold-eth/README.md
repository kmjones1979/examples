# The Graph Token API SDK

A comprehensive SDK for interacting with The Graph Token API built on Scaffold-ETH 2, featuring advanced data fetching hooks, reusable UI components, and complete TypeScript support.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [API Configuration](#api-configuration)
    - [Environment Setup](#environment-setup)
    - [Next.js API Route Implementation](#nextjs-api-route-implementation)
    - [Authentication Flow](#authentication-flow)
- [Core Architecture](#core-architecture)
    - [Directory Structure](#directory-structure)
    - [Data Flow](#data-flow)
- [Hooks Library](#hooks-library)
    - [Base Hook: useTokenApi](#base-hook-usetokenapi)
    - [Token API Hooks](#token-api-hooks)
        - [useTokenMetadata](#usetokenmetadata)
        - [useTokenBalances](#usetokenbalances)
        - [useTokenHolders](#usetokenholders)
        - [useTokenTransfers](#usetokentransfers)
        - [useTokenOHLCByPool](#usetokenohlcbypool)
        - [useTokenOHLCByContract](#usetokenohlcbycontract)
        - [useTokenPools](#usetokenpools)
        - [useTokenSwaps](#usetokenswaps)
    - [NFT API Hooks](#nft-api-hooks)
        - [useNFTCollections](#usenftcollections)
        - [useNFTItems](#usenftitems)
        - [useNFTOwnerships](#usenftownerships)
        - [useNFTActivities](#usenftactivities)
        - [useNFTSales](#usenftSales)
- [UI Components](#ui-components)
    - [Common Patterns](#common-patterns)
    - [Component Gallery](#component-gallery)
- [Configuration System](#configuration-system)
    - [Network Configuration](#network-configuration)
    - [Protocol Configuration](#protocol-configuration)
    - [Example Tokens](#example-tokens)
    - [Time Configuration](#time-configuration)
    - [Block Time Utilities](#block-time-utilities)
- [Utility Functions](#utility-functions)
    - [Address Utilities](#address-utilities)
- [Type System](#type-system)
    - [Common Types](#common-types)
- [Example Usage](#example-usage)
- [API Endpoint References](#api-endpoint-references)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

This SDK provides a complete toolkit for interacting with The Graph Token API, enabling developers to easily fetch and display both token and NFT data across multiple EVM networks. It's built as part of a Scaffold-ETH 2 application but the hooks and components can be used in any React project.

Key features:

- **React Hooks Library**: Specialized hooks for token and NFT API endpoints
- **UI Component Collection**: Ready-to-use components for displaying token and NFT data
- **API Proxy Integration**: Secure API communication with authentication handling
- **Multi-Network Support**: Works with Ethereum, Arbitrum, Base, BSC, Optimism, and Polygon
- **TypeScript Support**: Full type safety with comprehensive interfaces
- **NFT Support**: Complete NFT data fetching including collections, items, ownerships, activities, and sales
- **Advanced Filtering**: Time-based filters, contract filters, and pagination support
- **Authentication Error Handling**: Clear guidance for API setup and troubleshooting

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
            headers["Authorization"] =
                `Bearer ${process.env.NEXT_PUBLIC_GRAPH_TOKEN}`;
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

- **Generic Type Parameters**: Allows for typed responses with `DataType` and `ParamsType`
- **Conditional Fetching**: Supports skipping fetches with the `skip` option
- **Auto-Refetching**: Supports auto-refreshing with `refetchInterval`
- **Error Handling**: Comprehensive error handling and state management
- **Manual Refetch**: Provides a function to manually trigger refetches

### Token API Hooks

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

- `contract`: Token contract address
- `params`: Optional parameters
    - `network_id`: Network identifier
    - `include_market_data`: Whether to include price data (default: true)
- `options`: Hook options (skip, refetchInterval)

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

- `address`: Wallet address
- `params`: Optional parameters
    - `network_id`: Network identifier
    - `page`: Page number
    - `page_size`: Results per page
    - `min_amount`: Minimum token amount
    - `contract_address`: Filter for specific token
- `options`: Hook options

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

- `contract`: Token contract address
- `params`: Optional parameters
    - `network_id`: Network identifier
    - `page`: Page number
    - `page_size`: Results per page
    - `order_by`: Sort order ("asc" or "desc")
- `options`: Hook options

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

- `address`: Wallet address (used as the `to` parameter)
- `params`: Optional parameters
    - `network_id`: Network identifier (required by API)
    - `from`: Filter by sender address
    - `to`: Filter by recipient address (overridden by the main `address` argument)
    - `contract`: Filter by token contract
    - `startTime`, `endTime`: Filter by timestamp (Unix seconds)
    - `orderBy`, `orderDirection`: Sorting options
    - `limit`: Results per page
    - `page`: Page number
- `options`: Hook options (skip, refetchInterval)

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

- `pool`: Pool contract address
- `params`: Optional parameters
    - `network_id`: Network identifier
    - `from_timestamp`: Start timestamp
    - `to_timestamp`: End timestamp
    - `resolution`: Data resolution ("5m", "15m", "30m", "1h", "2h", "4h", "1d", "1w")
    - `page`: Page number
    - `page_size`: Results per page
- `options`: Hook options

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

- `options`: Configuration options
    - `contract`: Token contract address
    - `network`: Network identifier
    - `timeframe`: Time interval in seconds (default: 86400)
    - `startTime`: Start timestamp (Unix seconds)
    - `endTime`: End timestamp (Unix seconds)
    - `limit`: Number of results (default: 100)
    - `enabled`: Whether to enable the query (default: true)

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

- `params`: Optional parameters
    - `network_id`: Network identifier
    - `token`: Filter by token address
    - `pool`: Filter by pool address
    - `symbol`: Filter by token symbol
    - `factory`: Filter by factory address
    - `protocol`: Filter by protocol
    - `page`: Page number
    - `page_size`: Results per page
    - `sort_by`: Sort field ("tvl" or "creation_date")
    - `sort_direction`: Sort direction ("asc" or "desc")
    - `include_reserves`: Include reserve data
- `options`: Hook options

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

- `params`: Query parameters
    - `network_id`: Network identifier (required)
    - `pool`: Filter by pool address
    - `caller`: Filter by caller address
    - `sender`: Filter by sender address
    - `recipient`: Filter by recipient address
    - `tx_hash`: Filter by transaction hash
    - `protocol`: Filter by protocol
    - `page`: Page number
    - `page_size`: Results per page
- `options`: Hook options

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

### NFT API Hooks

#### useNFTCollections

Fetches NFT collection data for a specific contract address.

**Location**: `packages/nextjs/app/token-api/_hooks/useNFTCollections.ts`

```typescript
export function useNFTCollections(options: UseNFTCollectionsOptions) {
    const { contractAddress, network = "mainnet", enabled = true } = options;

    const normalizedContractAddress = normalizeContractAddress(contractAddress);
    const endpoint = `nft/collections/evm/${normalizedContractAddress}`;

    return useTokenApi<NFTCollection[]>(
        endpoint,
        { network_id: network },
        { skip: !normalizedContractAddress || !enabled }
    );
}
```

**Parameters**:

- `contractAddress`: NFT contract address (required)
- `network`: Network identifier (default: "mainnet")
- `enabled`: Whether to enable the query (default: true)

**Response Type**:

```typescript
interface NFTCollection {
    token_standard: string;
    contract: string;
    contract_creation: string;
    contract_creator: string;
    symbol: string;
    name: string;
    base_uri?: string;
    total_supply: number;
    total_unique_supply?: number;
    owners: number;
    total_transfers: number;
    network_id: NetworkId;
}
```

#### useNFTItems

Fetches individual NFT items from a collection.

**Location**: `packages/nextjs/app/token-api/_hooks/useNFTItems.ts`

```typescript
export function useNFTItems(options: UseNFTItemsOptions) {
    const {
        contractAddress,
        network = "mainnet",
        enabled = true,
        ...params
    } = options;

    const normalizedContractAddress = normalizeContractAddress(contractAddress);
    const endpoint = `nft/items/evm/${normalizedContractAddress}`;

    return useTokenApi<NFTItem[]>(
        endpoint,
        { network_id: network, ...params },
        { skip: !normalizedContractAddress || !enabled }
    );
}
```

**Parameters**:

- `contractAddress`: NFT contract address (required)
- `network`: Network identifier
- `token_id`: Specific token ID to fetch
- `limit`: Number of results per page
- `page`: Page number
- `enabled`: Whether to enable the query

**Response Type**:

```typescript
interface NFTItem {
    contract: string;
    token_id: string;
    owner: string;
    token_uri?: string;
    metadata?: {
        name?: string;
        description?: string;
        image?: string;
        attributes?: Array<{
            trait_type: string;
            value: any;
        }>;
    };
    network_id: NetworkId;
}
```

#### useNFTOwnerships

Fetches NFT ownership data for a wallet address.

**Location**: `packages/nextjs/app/token-api/_hooks/useNFTOwnerships.ts`

```typescript
export function useNFTOwnerships(options: UseNFTOwnershipsOptions) {
    const {
        walletAddress,
        network = "mainnet",
        enabled = true,
        ...params
    } = options;

    const normalizedWalletAddress = normalizeContractAddress(walletAddress);
    const endpoint = `nft/ownerships/evm/${normalizedWalletAddress}`;

    return useTokenApi<NFTOwnership[]>(
        endpoint,
        { network_id: network, ...params },
        { skip: !normalizedWalletAddress || !enabled }
    );
}
```

**Parameters**:

- `walletAddress`: Wallet address to check ownership for (required)
- `network`: Network identifier
- `contract_address`: Filter by specific NFT contract
- `limit`: Number of results per page
- `page`: Page number
- `enabled`: Whether to enable the query

**Response Type**:

```typescript
interface NFTOwnership {
    contract: string;
    token_id: string;
    owner: string;
    balance: string;
    token_uri?: string;
    metadata?: {
        name?: string;
        description?: string;
        image?: string;
    };
    network_id: NetworkId;
}
```

#### useNFTActivities

Fetches NFT activity/transaction history with advanced filtering.

**Location**: `packages/nextjs/app/token-api/_hooks/useNFTActivities.ts`

```typescript
export function useNFTActivities(options: UseNFTActivitiesOptions | null) {
    if (!options?.contract_address) {
        // Contract address is required for NFT Activities API
        return {
            data: undefined,
            isLoading: false,
            error: "Contract address is required",
        };
    }

    const endpoint = "nft/activities/evm";
    return useTokenApi<NFTActivity[]>(endpoint, options, {
        skip: !options.contract_address,
    });
}
```

**Parameters**:

- `contract_address`: NFT contract address (required)
- `network_id`: Network identifier
- `any`: Filter by any address (from/to/contract)
- `from_address`: Filter by sender address
- `to_address`: Filter by recipient address
- `startTime`: Start timestamp (Unix seconds)
- `endTime`: End timestamp (Unix seconds)
- `orderBy`: Sort field ("timestamp")
- `orderDirection`: Sort direction ("asc" | "desc")
- `limit`: Number of results per page
- `page`: Page number

**Response Type**:

```typescript
interface NFTActivity {
    "@type": string;
    timestamp: string;
    block_num: number;
    tx_hash: string;
    contract: string;
    token_id: string;
    from: string;
    to: string;
    amount: string;
    network_id: NetworkId;
}
```

#### useNFTSales

Fetches NFT sales/marketplace data.

**Location**: `packages/nextjs/app/token-api/_hooks/useNFTSales.ts`

```typescript
export function useNFTSales(options: UseNFTSalesOptions = {}) {
    const { network, enabled = true, token, ...otherParams } = options;

    // Map 'token' parameter to 'contract' for the API
    const queryParams: any = {
        network_id: network,
        ...otherParams,
    };

    if (token) {
        queryParams.contract = token; // API expects 'contract' not 'token'
    }

    return useTokenApi<NFTSale[]>("nft/sales/evm", queryParams, {
        skip: !enabled,
    });
}
```

**Parameters**:

- `network`: Network identifier
- `any`: Filter by any address involved
- `offerer`: Seller address
- `recipient`: Buyer address
- `token`: NFT contract address (mapped to 'contract' for API)
- `startTime`: Start timestamp (Unix seconds)
- `endTime`: End timestamp (Unix seconds)
- `orderBy`: Sort field ("timestamp")
- `orderDirection`: Sort direction ("asc" | "desc")
- `limit`: Number of results per page
- `page`: Page number
- `enabled`: Whether to enable the query

**Response Type**:

```typescript
interface NFTSale {
    timestamp: string;
    block_num: number;
    tx_hash: string;
    token: string;
    token_id: number;
    symbol: string;
    name: string;
    offerer: string;
    recipient: string;
    sale_amount: number;
    sale_currency: string;
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

**Token Components:**

- **GetMetadata**: Displays token metadata information
- **GetBalances**: Shows token balances for an address
- **GetHolders**: Lists token holders with pagination
- **GetTransfers**: Displays token transfer history
- **GetOHLCByContract**: Shows price charts for tokens
- **GetOHLCByPool**: Shows price charts for liquidity pools
- **GetSwaps**: Displays DEX swap events
- **GetPools**: Lists liquidity pools

**NFT Components:**

- **GetNFTCollections**: Displays NFT collection metadata and statistics
- **GetNFTItems**: Shows individual NFTs from a collection with metadata
- **GetNFTOwnerships**: Lists NFTs owned by a wallet address
- **GetNFTActivities**: Displays NFT transaction history with advanced filtering
- **GetNFTSales**: Shows NFT marketplace sales data

Example usage:

```tsx
import { GetMetadata } from "~~/app/token-api/_components/GetMetadata";
import { GetBalances } from "~~/app/token-api/_components/GetBalances";
import { GetNFTCollections } from "~~/app/token-api/_components/GetNFTCollections";
import { GetNFTOwnerships } from "~~/app/token-api/_components/GetNFTOwnerships";

export default function YourPage() {
    return (
        <div>
            {/* Token Components */}
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

            {/* NFT Components */}
            <GetNFTCollections isOpen={true} />
            <GetNFTOwnerships isOpen={true} />
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

## Type System

### Common Types

**Location**: `packages/nextjs/app/token-api/_types/index.ts`

Defines common types used throughout the SDK:

```typescript
export type NetworkId =
    | "mainnet"
    | "base"
    | "arbitrum-one"
    | "bsc"
    | "optimism"
    | "matic";

export interface TokenApiOptions {
    skip?: boolean;
    refetchInterval?: number;
}

export interface PaginationInfo {
    page: number;
    page_size: number;
    total_pages: number;
}
```

## Example Usage

Visit `http://localhost:3000/token-api` to see a comprehensive example of all components in action.

## API Endpoint References

The SDK covers the following Token API endpoints:

**Token Endpoints:**

- `/tokens/evm/{contract}` - Token metadata
- `/balances/evm/{address}` - Token balances
- `/holders/evm/{contract}` - Token holders
- `/transfers/evm` - Token transfers
- `/ohlc/pools/evm/{pool}` - Pool OHLC data
- `/ohlc/prices/evm/{contract}` - Token OHLC data
- `/pools/evm` - Liquidity pools
- `/swaps/evm` - DEX swaps

**NFT Endpoints:**

- `/nft/collections/evm/{contract}` - NFT collection data
- `/nft/items/evm/{contract}` - NFT items
- `/nft/ownerships/evm/{address}` - NFT ownerships
- `/nft/activities/evm` - NFT activities
- `/nft/sales/evm` - NFT sales

## Troubleshooting

### Authentication Issues

**Problem**: Getting 401 unauthorized errors
**Solution**:

1. Ensure you have a valid Graph API token from [The Graph Market](https://thegraph.com/market/)
2. Add the token to your `.env.local` file:
    ```env
    NEXT_PUBLIC_GRAPH_TOKEN=your_token_here
    ```
3. Restart your development server after adding the token
4. Check the browser console for authentication error messages

### Data Structure Issues

**Problem**: Components showing "No valid data found" despite successful API responses
**Solution**:

- This was resolved in recent updates where hooks now return data arrays directly
- Ensure you're using the latest version of the hooks
- Check that components use `Array.isArray(data)` instead of `data?.data`

### NFT Activities API Issues

**Problem**: Getting 400 errors with "contract field validation" messages
**Solution**:

- The NFT Activities API requires a contract address parameter
- Ensure you provide a valid NFT contract address (not just a wallet address)
- Use time filters to prevent database timeouts on popular contracts

### Database Timeout Issues

**Problem**: Getting 500 errors with "Query took too long" messages
**Solution**:

- Add time filters (startTime and endTime) to your queries
- Use the provided time range buttons (Last 24h, Last 7 days, etc.)
- Popular NFT contracts like BAYC require time filtering to avoid timeouts

### Network Connection Issues

**Problem**: Fetch errors or network timeouts
**Solution**:

1. Check your internet connection
2. Verify the API URL is correct in your `.env.local`
3. Check if The Graph Token API service is operational
4. Try with a different network (mainnet, base, etc.)

### Type Errors

**Problem**: TypeScript errors about missing properties
**Solution**:

- Ensure you're using the correct interfaces from `_types` directory
- Check that hook return types match what your component expects
- Some API responses may have optional fields - use optional chaining (`?.`)

### Component Not Loading

**Problem**: Components appear but don't fetch data
**Solution**:

1. Check that the `enabled` or `skip` parameters are set correctly
2. Verify that required parameters (like contract addresses) are provided
3. Check the browser console for error messages
4. Ensure the component's `shouldFetch` state is properly managed

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests for any improvements.
