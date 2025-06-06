# Workshop: Building the Token API Test Page

This workshop guides you through recreating a `WorkshopPage`. This component serves as a comprehensive testbed for all the custom data-fetching hooks developed for The Graph Token API SDK, including both traditional token hooks and NFT hooks.

**Goal**: To understand how to integrate and use the various Token API hooks (both token and NFT) within a React component, manage their state, handle parameters, and observe the results.

## Prerequisites

- A working Scaffold-ETH 2 + Token API SDK setup (as per the main `README.md`).
- Familiarity with React, TypeScript, and React Hooks (`useState`, `useEffect`).
- Node.js and Yarn installed.

## Steps

### Step 1: Setup the Component File

1.  Navigate to `packages/nextjs/app/`.
2.  Create a new directory named `workshop` (or similar).
3.  Inside `workshop`, create a file named `page.tsx`.
4.  Add the basic component structure and necessary imports:

    ```tsx
    // packages/nextjs/app/workshop/page.tsx
    "use client";

    import { useEffect, useState } from "react";
    import { EVM_NETWORKS } from "~~/app/token-api/_config/networks";
    import {
        useHistoricalBalances,
        useTokenBalances,
        useTokenHolders,
        useTokenMetadata,
        useTokenOHLCByContract,
        useTokenOHLCByPool,
        useTokenPools,
        useTokenSwaps,
        useTokenTransfers,
        useNFTCollections,
        useNFTItems,
        useNFTOwnerships,
        useNFTActivities,
        useNFTHolders,
        useNFTSales,
    } from "~~/app/token-api/_hooks";
    import type { NetworkId } from "~~/app/token-api/_types";
    import { AddressInput } from "~~/components/scaffold-eth";

    const WorkshopPage = () => {
        // State and hooks will go here

        return (
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6">
                    Token API Workshop Page
                </h1>
                {/* UI Elements will go here */}
                <p className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-md">
                    Check your browser's console (Developer Tools) to see the
                    data, loading states, and errors for each hook.
                </p>
            </div>
        );
    };

    export default WorkshopPage;
    ```

### Step 2: Initialize State Variables

Inside the `WorkshopPage` component, add the state variables needed to control the parameters for the hooks:

```typescript
// Network selection
const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");

// Address inputs
const [contractAddress, setContractAddress] = useState<string>(
    "0xc944E90C64B2c07662A292be6244BDf05Cda44a7" // Default: GRT on mainnet
);
const [walletAddress, setWalletAddress] = useState<string>(
    "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // Default: Vitalik's address
);
const [poolAddress, setPoolAddress] = useState<string>(
    "0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801" // Default: GRT/WETH Uniswap V3 pool
);

// Timestamp inputs for Historical Balances and OHLC
const [historicalBalancesFromTs, setHistoricalBalancesFromTs] = useState<
    number | undefined
>(undefined);
const [historicalBalancesToTs, setHistoricalBalancesToTs] = useState<
    number | undefined
>(undefined);

// Set initial timestamp values on client mount to avoid hydration issues
useEffect(() => {
    const sevenDaysAgo = Math.floor(
        (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000
    );
    const now = Math.floor(Date.now() / 1000);
    setHistoricalBalancesFromTs(sevenDaysAgo);
    setHistoricalBalancesToTs(now);
}, []); // Empty dependency array ensures this runs only once on mount

// Flag to enable OHLC fetch only when timestamps are ready
const timestampsReady =
    historicalBalancesFromTs !== undefined &&
    historicalBalancesToTs !== undefined;

// State for managing console logging (explained later)
type LoggedKeys =
    | "metadata"
    | "balances"
    | "holders"
    | "transfers"
    | "ohlcByPool"
    | "ohlcByContract"
    | "pools"
    | "swaps"
    | "historicalBalances"
    | "nftCollections"
    | "nftItems"
    | "nftOwnerships"
    | "nftActivities"
    | "nftHolders"
    | "nftSales";
const [logged, setLogged] = useState<Partial<Record<LoggedKeys, boolean>>>({});
```

### Step 3: Instantiate Data Fetching Hooks

Now, initialize each specialized hook, passing the relevant state variables as parameters:

```typescript
// --- TokenMetadata Hook ---
const {
    data: metadataData,
    isLoading: isLoadingMetadata,
    error: errorMetadata,
} = useTokenMetadata(contractAddress, { network_id: selectedNetwork });

// --- TokenBalances Hook ---
const {
    data: balancesData,
    isLoading: isLoadingBalances,
    error: errorBalances,
} = useTokenBalances(walletAddress, { network_id: selectedNetwork });

// --- TokenHolders Hook ---
const {
    data: holdersData,
    isLoading: isLoadingHolders,
    error: errorHolders,
} = useTokenHolders(contractAddress, { network_id: selectedNetwork });

// --- TokenTransfers Hook ---
const {
    data: transfersData,
    isLoading: isLoadingTransfers,
    error: errorTransfers,
} = useTokenTransfers(walletAddress, {
    network_id: selectedNetwork,
    // contract: contractAddress, // Optional: Filter transfers by token contract - Removed for workshop to broaden search
    limit: 100,
});

// --- TokenOHLCByPool Hook ---
const {
    data: ohlcByPoolData,
    isLoading: isLoadingOhlcByPool,
    error: errorOhlcByPool,
} = useTokenOHLCByPool(poolAddress, {
    network_id: selectedNetwork,
    resolution: "1d", // Daily resolution
});

// --- TokenOHLCByContract Hook ---
const {
    data: ohlcByContractData,
    isLoading: isLoadingOhlcByContract,
    error: errorOhlcByContract,
} = useTokenOHLCByContract({
    contract: contractAddress,
    network: selectedNetwork,
    timeframe: 86400, // 1 day in seconds
    limit: 100,
    enabled: timestampsReady, // Only fetch when timestamps are set
    startTime: historicalBalancesFromTs,
    endTime: historicalBalancesToTs,
});

// --- TokenPools Hook ---
const {
    data: poolsData,
    isLoading: isLoadingPools,
    error: errorPools,
} = useTokenPools({
    network_id: selectedNetwork,
    token: contractAddress, // Optional: Filter pools by token
    page_size: 10,
});

// --- TokenSwaps Hook ---
const {
    data: swapsData,
    isLoading: isLoadingSwaps,
    error: errorSwaps,
} = useTokenSwaps({
    network_id: selectedNetwork,
    pool: poolAddress, // Filter swaps by pool address
    page_size: 10,
});

// --- HistoricalBalances Hook ---
const {
    data: historicalBalancesData,
    isLoading: isLoadingHistoricalBalances,
    error: errorHistoricalBalances,
} = useHistoricalBalances(walletAddress, {
    network_id: selectedNetwork,
    contract_address: contractAddress, // Optional: Filter by token
    from_timestamp: historicalBalancesFromTs,
    to_timestamp: historicalBalancesToTs,
    resolution: "day",
});

// --- NFT Hooks ---

// --- NFTCollections Hook ---
const {
    data: nftCollectionsData,
    isLoading: isLoadingNFTCollections,
    error: errorNFTCollections,
} = useNFTCollections({
    contractAddress: contractAddress,
    network: selectedNetwork,
    enabled: timestampsReady,
});

// --- NFTItems Hook ---
const {
    data: nftItemsData,
    isLoading: isLoadingNFTItems,
    error: errorNFTItems,
} = useNFTItems({
    contractAddress: contractAddress,
    network: selectedNetwork,
    limit: 10,
    enabled: timestampsReady,
});

// --- NFTOwnerships Hook ---
const {
    data: nftOwnershipsData,
    isLoading: isLoadingNFTOwnerships,
    error: errorNFTOwnerships,
} = useNFTOwnerships({
    walletAddress: walletAddress,
    network: selectedNetwork,
    limit: 10,
    enabled: timestampsReady,
});

// --- NFTActivities Hook ---
const {
    data: nftActivitiesData,
    isLoading: isLoadingNFTActivities,
    error: errorNFTActivities,
} = useNFTActivities(
    contractAddress
        ? {
              contract_address: contractAddress,
              network_id: selectedNetwork,
              any: walletAddress, // Optional: Filter by wallet address
              startTime: historicalBalancesFromTs,
              endTime: historicalBalancesToTs,
              limit: 10,
          }
        : null
);

// --- NFTHolders Hook ---
const {
    data: nftHoldersData,
    isLoading: isLoadingNFTHolders,
    error: errorNFTHolders,
} = useNFTHolders({
    contractAddress: contractAddress,
    network: selectedNetwork,
    enabled: timestampsReady,
});

// --- NFTSales Hook ---
const {
    data: nftSalesData,
    isLoading: isLoadingNFTSales,
    error: errorNFTSales,
} = useNFTSales({
    network: selectedNetwork,
    token: contractAddress, // NFT contract address
    offerer: walletAddress, // Optional: Filter by seller
    limit: 10,
    enabled: timestampsReady,
});
```

_Remember: These hooks fetch data automatically when the component mounts or when their dependencies (like `selectedNetwork`, `contractAddress`, etc.) change._

### Step 4: Implement Console Logging

Add `useEffect` hooks to log the data from each data-fetching hook to the console only once when the data first becomes available.

```typescript
// --- useEffects to log data for each hook ---

useEffect(() => {
    if (!logged.metadata && metadataData !== undefined) {
        console.log("useTokenMetadata:", {
            data: metadataData,
            isLoading: isLoadingMetadata,
            error: errorMetadata,
        });
        setLogged((l) => ({ ...l, metadata: true }));
    }
}, [metadataData, isLoadingMetadata, errorMetadata, logged]);

useEffect(() => {
    if (!logged.balances && balancesData !== undefined) {
        console.log("useTokenBalances:", {
            data: balancesData,
            isLoading: isLoadingBalances,
            error: errorBalances,
        });
        setLogged((l) => ({ ...l, balances: true }));
    }
}, [balancesData, isLoadingBalances, errorBalances, logged]);

// ... (Repeat this pattern for all other hooks: holders, transfers, ohlcByPool, etc.) ...

// Example for Historical Balances
useEffect(() => {
    if (!logged.historicalBalances && historicalBalancesData !== undefined) {
        console.log("useHistoricalBalances:", {
            data: historicalBalancesData,
            isLoading: isLoadingHistoricalBalances,
            error: errorHistoricalBalances,
        });
        setLogged((l) => ({ ...l, historicalBalances: true }));
    }
}, [
    historicalBalancesData,
    isLoadingHistoricalBalances,
    errorHistoricalBalances,
    logged,
]);

// --- NFT useEffects ---

useEffect(() => {
    if (!logged.nftCollections && nftCollectionsData !== undefined) {
        console.log("useNFTCollections:", {
            data: nftCollectionsData,
            isLoading: isLoadingNFTCollections,
            error: errorNFTCollections,
        });
        setLogged((l) => ({ ...l, nftCollections: true }));
    }
}, [nftCollectionsData, isLoadingNFTCollections, errorNFTCollections, logged]);

useEffect(() => {
    if (!logged.nftItems && nftItemsData !== undefined) {
        console.log("useNFTItems:", {
            data: nftItemsData,
            isLoading: isLoadingNFTItems,
            error: errorNFTItems,
        });
        setLogged((l) => ({ ...l, nftItems: true }));
    }
}, [nftItemsData, isLoadingNFTItems, errorNFTItems, logged]);

useEffect(() => {
    if (!logged.nftOwnerships && nftOwnershipsData !== undefined) {
        console.log("useNFTOwnerships:", {
            data: nftOwnershipsData,
            isLoading: isLoadingNFTOwnerships,
            error: errorNFTOwnerships,
        });
        setLogged((l) => ({ ...l, nftOwnerships: true }));
    }
}, [nftOwnershipsData, isLoadingNFTOwnerships, errorNFTOwnerships, logged]);

useEffect(() => {
    if (!logged.nftActivities && nftActivitiesData !== undefined) {
        console.log("useNFTActivities:", {
            data: nftActivitiesData,
            isLoading: isLoadingNFTActivities,
            error: errorNFTActivities,
        });
        setLogged((l) => ({ ...l, nftActivities: true }));
    }
}, [nftActivitiesData, isLoadingNFTActivities, errorNFTActivities, logged]);

useEffect(() => {
    if (!logged.nftHolders && nftHoldersData !== undefined) {
        console.log("useNFTHolders:", {
            data: nftHoldersData,
            isLoading: isLoadingNFTHolders,
            error: errorNFTHolders,
        });
        setLogged((l) => ({ ...l, nftHolders: true }));
    }
}, [nftHoldersData, isLoadingNFTHolders, errorNFTHolders, logged]);

useEffect(() => {
    if (!logged.nftSales && nftSalesData !== undefined) {
        console.log("useNFTSales:", {
            data: nftSalesData,
            isLoading: isLoadingNFTSales,
            error: errorNFTSales,
        });
        setLogged((l) => ({ ...l, nftSales: true }));
    }
}, [nftSalesData, isLoadingNFTSales, errorNFTSales, logged]);
```

_Make sure to add a similar `useEffect` block for **every** data-fetching hook initialized in Step 3._

### Step 5: Build the User Interface

Inside the `return` statement of the `WorkshopPage` component, add the UI elements for user input. Use Tailwind CSS for styling.

```jsx
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Token API Workshop Page</h1>

            {/* --- Input Section --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Network Selector */}
                <div>
                    <label
                        htmlFor="network-select"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Select Network:
                    </label>
                    <select
                        id="network-select"
                        value={selectedNetwork}
                        onChange={(e) =>
                            setSelectedNetwork(e.target.value as NetworkId)
                        }
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        {EVM_NETWORKS.map((network) => (
                            <option key={network.id} value={network.id}>
                                {network.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Contract Address Input */}
                <div>
                    <label
                        htmlFor="contract-address"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Contract Address:
                    </label>
                    <AddressInput
                        value={contractAddress}
                        onChange={setContractAddress}
                        placeholder="Enter contract address"
                    />
                </div>

                {/* Wallet Address Input */}
                <div>
                    <label
                        htmlFor="wallet-address"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Wallet Address:
                    </label>
                    <AddressInput
                        value={walletAddress}
                        onChange={setWalletAddress}
                        placeholder="Enter wallet address"
                    />
                </div>

                {/* Pool Address Input */}
                <div>
                    <label
                        htmlFor="pool-address"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Pool Address:
                    </label>
                    <AddressInput
                        value={poolAddress}
                        onChange={setPoolAddress}
                        placeholder="Enter pool address"
                    />
                </div>
            </div>

            {/* Timestamp Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                    <label
                        htmlFor="from-ts-hist-balance"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        From Timestamp (Unix):
                    </label>
                    <input
                        type="number"
                        id="from-ts-hist-balance"
                        value={historicalBalancesFromTs ?? ""}
                        onChange={(e) =>
                            setHistoricalBalancesFromTs(parseInt(e.target.value))
                        }
                        className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    />
                    <p className="text-xs text-gray-500">
                        e.g., 1672531200 (Jan 1, 2023 00:00:00 GMT)
                    </p>
                </div>
                <div>
                    <label
                        htmlFor="to-ts-hist-balance"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        To Timestamp (Unix):
                    </label>
                    <input
                        type="number"
                        id="to-ts-hist-balance"
                        value={historicalBalancesToTs ?? ""}
                        onChange={(e) =>
                            setHistoricalBalancesToTs(parseInt(e.target.value))
                        }
                        className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    />
                    <p className="text-xs text-gray-500">
                        e.g., 1675209600 (Feb 1, 2023 00:00:00 GMT)
                    </p>
                </div>
            </div>

            {/* --- Console Output Guide --- */}
            <p className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-md">
                Check your browser's console (Developer Tools) to see the data,
                loading states, and errors for each hook.
            </p>
        </div>
    );
```

### Step 6: Run and Test

1.  Save the `WORKSHOP.MD` and `packages/nextjs/app/workshop/page.tsx` files.
2.  Make sure your development server is running (`yarn start`).
3.  Navigate to `http://localhost:3000/workshop` in your browser.
4.  Open your browser's Developer Tools (usually by pressing F12) and go to the Console tab.
5.  Observe the logs. As the component loads and the hooks fetch data, you should see output similar to:
    ```
    useTokenMetadata: {data: {..}, isLoading: false, error: undefined}
    useTokenBalances: {data: [...], isLoading: false, error: undefined}
    ...
    ```
6.  Try changing the Network, addresses, or timestamps in the UI. Observe how new logs appear in the console as the hooks refetch data based on the updated parameters.

## Conclusion

Congratulations! You have successfully recreated the `TestPage` component, demonstrating how to use the Token API SDK's custom hooks. You've learned how to:

- Set up state for hook parameters.
- Initialize and use multiple data-fetching hooks in a single component.
- Control hook execution timing (e.g., enabling based on parameter readiness).
- Manage and observe console output effectively.
- Build a simple UI to interact with the hooks.

This workshop provides a solid foundation for integrating both token and NFT hooks into your own custom components and applications within the Scaffold-ETH 2 environment.

**Key Takeaways:**

- **Token hooks** work with traditional ERC20 data (balances, transfers, prices)
- **NFT hooks** provide comprehensive NFT functionality (collections, items, ownerships, activities, sales)
- **Authentication is required**: Ensure `NEXT_PUBLIC_GRAPH_TOKEN` is set in your `.env.local` file
- **NFT Activities API requirements**: Contract address is mandatory - cannot work with just wallet addresses
- **Time filtering prevents timeouts**: Default 30-day ranges are automatically applied for popular contracts
- **Data structure simplified**: All hooks now return arrays directly (`NFTCollection[]`), eliminating confusion
- **Error handling improved**: Clear messages for authentication, validation, and timeout issues

**Common Issues Resolved:**

- Authentication 401 errors → Set proper Graph API token
- "No NFT collections found" → Fixed authentication and data processing
- Database timeouts → Implemented automatic time filtering
- Validation errors → Added required parameter validation
- Data structure confusion → Hooks return arrays directly

Remember to consult the hook definitions and `_types` directory for detailed parameter options and response structures. Check the main README.md for troubleshooting common issues like authentication errors and database timeouts.
