# Token API Components Tutorial

This tutorial explains how the Token API components in the `packages/nextjs/app/token-api/_components` directory were built using custom hooks and Scaffold-ETH 2 (SE-2) utilities.

## Architecture Overview

The token-api components are built using a layered approach:

1. **Base API Hook**: `useTokenApi` serves as the foundation for all API interactions
2. **Specialized Hooks**: Custom hooks for specific endpoints (e.g., `useTokenMetadata`, `useTokenBalances`)
3. **UI Components**: React components that consume these hooks to display token data

## The Base Hook: useTokenApi

`useTokenApi` is the core hook that handles all API communication, providing consistent error handling, loading states, and data formatting. It's designed as a generic hook that:

-   Makes fetch requests to the token API proxy endpoint
-   Handles loading and error states
-   Supports pagination and interval-based refetching
-   Normalizes API responses

```typescript
export const useTokenApi = <DataType, ParamsType = Record<string, any>>(
    endpoint: string,
    params?: ParamsType,
    options: TokenApiOptions = {}
) => {
    // State management for data, loading, errors
    const [data, setData] = useState<DataType | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);

    // Fetch implementation and other logic
    // ...

    return {
        data,
        isLoading,
        error,
        refetch: fetchData,
        lastUpdated,
    };
};
```

## Specialized Hooks

Each specialized hook extends `useTokenApi` for specific API endpoints, adding type safety and specialized logic:

### useTokenMetadata

Used in `GetMetadata.tsx` to fetch detailed information about ERC20 tokens.

```typescript
export const useTokenMetadata = (
    contract: string | undefined,
    params?: TokenMetadataParams,
    options = { skip: contract ? false : true }
) => {
    // Uses useTokenApi internally with endpoint formatting
    const result = useTokenApi<any>(
        normalizedContract ? `tokens/evm/${normalizedContract}` : "",
        { ...params },
        options
    );

    // Response normalization and formatting
    // ...

    return {
        ...result,
        data: formattedData,
    };
};
```

### Other Specialized Hooks

-   `useTokenBalances`: Used in `GetBalances.tsx` for retrieving token balances
-   `useTokenHolders`: Used in `GetHolders.tsx` for fetching token holder information
-   `useTokenTransfers`: Used in `GetTransfers.tsx` for transaction history (Note: Currently uses balances endpoint as fallback due to API limitations)
-   `useTokenSwaps`: Used in `GetSwaps.tsx` for DEX swap data
-   `useTokenPools`: Used in `GetPools.tsx` for liquidity pool information
-   `useTokenOHLCByPool`: Used in `GetOHLCByPool.tsx` for pool price chart data
-   `useTokenOHLCByContract`: Used in `GetOHLCByContract.tsx` for token price charts

## Component Implementation Pattern

Each component follows a consistent pattern:

1. **State Management**: Using React's `useState` for form inputs and UI state
2. **Hook Integration**: Leveraging the specialized hooks with proper parameters
3. **Error Handling**: Displaying user-friendly error messages
4. **Loading States**: Showing loading indicators during API requests
5. **Data Rendering**: Presenting the fetched data in a structured format

### Component Example: GetMetadata.tsx

```typescript
export const GetMetadata = ({ isOpen = true }: { isOpen?: boolean }) => {
    // Local state for form inputs and UI
    const [contractAddress, setContractAddress] = useState<string>("");
    const [selectedNetwork, setSelectedNetwork] =
        useState<NetworkId>("mainnet");
    const [error, setError] = useState<string | null>(null);
    const [shouldFetch, setShouldFetch] = useState<boolean>(false);

    // Use the specialized hook
    const {
        data: tokenData,
        isLoading,
        error: hookError,
        refetch,
    } = useTokenMetadata(
        contractAddress,
        {
            network_id: selectedNetwork,
            include_market_data: true,
        },
        { skip: !shouldFetch } // Skip initial fetch until explicitly triggered
    );

    // Error handling, UI rendering, etc.
    // ...
};
```

## Integration with Scaffold-ETH 2 Components

The token-api components leverage SE-2's pre-built components for enhanced UX:

-   **Address**: Used to display wallet and contract addresses with ENS support
-   **AddressInput**: Used for user input of Ethereum addresses with validation
-   **Balance**: Used to display token balances in the UI

Example from GetMetadata.tsx:

```typescript
<AddressInput
    value={contractAddress}
    onChange={setContractAddress}
    placeholder="Enter token contract address"
/>
```

## Hook Usage in Each Component

1. **GetMetadata.tsx**

    - Uses `useTokenMetadata` to fetch basic token information
    - Displays token name, symbol, supply, and price data

2. **GetBalances.tsx**

    - Uses `useTokenBalances` to fetch account token balances
    - Displays balance information with proper decimals handling

3. **GetHolders.tsx**

    - Uses `useTokenHolders` to fetch top token holders
    - Implements pagination through the hook's options

4. **GetTransfers.tsx**

    - Currently uses balances endpoint as a workaround due to API limitations
    - Originally designed to use `useTokenTransfers` hook
    - Formats balance data to resemble transfers for UI consistency

5. **GetSwaps.tsx**

    - Uses `useTokenSwaps` to fetch DEX swap events
    - Displays price impact and slippage information

6. **GetPools.tsx**

    - Uses `useTokenPools` to fetch liquidity pool data
    - Shows TVL and fee tier information

7. **GetOHLCByPool.tsx** and **GetOHLCByContract.tsx**

    - Use `useTokenOHLCByPool` and `useTokenOHLCByContract` respectively
    - Implement time interval selection and chart rendering
    - Support different parameter formats based on API requirements

8. **GetHistorical.tsx**
    - Uses `useTokenHistorical` for historical price and volume data
    - Formats data for time-series visualization

## Testing All Hooks: test/page.tsx

The `packages/nextjs/app/test/page.tsx` component serves as a comprehensive testbed and interactive demonstration for all the custom data fetching hooks provided by the Token API SDK. It allows developers to see each hook in action, modify input parameters, and observe the fetched data directly in the browser's console.

### 1. Purpose and Overview

The main goal of `TestPage.tsx` is to:

-   Instantiate every specialized hook (e.g., `useTokenMetadata`, `useTokenBalances`, etc.).
-   Provide a user interface to dynamically change the common parameters for these hooks (like network, contract addresses, wallet addresses).
-   Automatically fetch data when the component mounts or when these parameters change.
-   Log the data, loading states, and errors for each hook to the browser's console, ensuring each piece of data is logged only once upon arrival.

### 2. State Management

The component utilizes several React `useState` hooks to manage user inputs and component behavior:

-   **`selectedNetwork`**:

    ```typescript
    const [selectedNetwork, setSelectedNetwork] =
        useState<NetworkId>("mainnet");
    ```

    Stores the currently selected blockchain network (e.g., "mainnet", "base"). This is used by almost all hooks.

-   **`contractAddress`**:

    ```typescript
    const [contractAddress, setContractAddress] = useState<string>(
        "0xc944E90C64B2c07662A292be6244BDf05Cda44a7"
    );
    ```

    Holds the token contract address, used by hooks like `useTokenMetadata`, `useTokenHolders`, `useTokenOHLCByContract`, and as a filter for `useTokenTransfers`.

-   **`walletAddress`**:

    ```typescript
    const [walletAddress, setWalletAddress] = useState<string>(
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
    );
    ```

    Stores the wallet address, used by `useTokenBalances`, `useTokenTransfers`, and `useHistoricalBalances`.

-   **`poolAddress`**:

    ```typescript
    const [poolAddress, setPoolAddress] = useState<string>(
        "0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801"
    );
    ```

    Contains the liquidity pool address, used by `useTokenOHLCByPool` and `useTokenSwaps`.

-   **`historicalBalancesFromTs` and `historicalBalancesToTs`**:

    ```typescript
    const [historicalBalancesFromTs, setHistoricalBalancesFromTs] = useState<
        number | undefined
    >(undefined);
    const [historicalBalancesToTs, setHistoricalBalancesToTs] = useState<
        number | undefined
    >(undefined);
    ```

    These store the start and end Unix timestamps for the `useHistoricalBalances` hook. They are initialized to `undefined` to prevent server-client hydration mismatches and then set in a `useEffect` hook to default to the last 7 days:

    ```typescript
    useEffect(() => {
        setHistoricalBalancesFromTs(
            Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)
        );
        setHistoricalBalancesToTs(Math.floor(Date.now() / 1000));
    }, []);
    ```

-   **`logged`**:
    ```typescript
    const [logged, setLogged] = useState<Partial<Record<LoggedKeys, boolean>>>(
        {}
    );
    ```
    This state, along with the `LoggedKeys` type, is crucial for managing console output. It keeps track of which hooks' data has already been logged to ensure that each piece of data is only output once when it first becomes available. `LoggedKeys` is a union type of string literals representing each hook (e.g., "metadata", "balances").

### 3. Hook Initialization and Data Fetching

All specialized data fetching hooks are initialized in the component. They automatically fetch data when the component mounts and whenever their relevant parameters (derived from the state variables above) change.

Here's a brief overview of how each hook is set up:

-   **`useTokenMetadata`**:

    ```typescript
    const { data: metadataData, ... } = useTokenMetadata(contractAddress, { network_id: selectedNetwork });
    ```

    Fetches metadata for the given `contractAddress` on the `selectedNetwork`.

-   **`useTokenBalances`**:

    ```typescript
    const { data: balancesData, ... } = useTokenBalances(walletAddress, { network_id: selectedNetwork });
    ```

    Fetches token balances for the `walletAddress` on the `selectedNetwork`.

-   **`useTokenHolders`**:

    ```typescript
    const { data: holdersData, ... } = useTokenHolders(contractAddress, { network_id: selectedNetwork });
    ```

    Fetches a list of token holders for the `contractAddress`.

-   **`useTokenTransfers`**:

    ```typescript
    const { data: transfersData, ... } = useTokenTransfers(walletAddress, { network_id: selectedNetwork, contract: contractAddress, limit: 100 });
    ```

    Fetches token transfers for the `walletAddress`, with an optional filter for `contractAddress` on the `selectedNetwork`.

-   **`useTokenOHLCByPool`**:

    ```typescript
    const { data: ohlcByPoolData, ... } = useTokenOHLCByPool(poolAddress, { network_id: selectedNetwork, resolution: "1d" });
    ```

    Fetches OHLC (Open, High, Low, Close) price data for the specified `poolAddress`.

-   **`useTokenOHLCByContract`**:

    ```typescript
    const { data: ohlcByContractData, ... } = useTokenOHLCByContract({ contract: contractAddress, network: selectedNetwork, timeframe: 86400, limit: 100, enabled: true });
    ```

    Fetches OHLC price data for the `contractAddress`.

-   **`useTokenPools`**:

    ```typescript
    const { data: poolsData, ... } = useTokenPools({ network_id: selectedNetwork, token: contractAddress, page_size: 10 });
    ```

    Fetches a list of liquidity pools, optionally filtered by `contractAddress` (token).

-   **`useTokenSwaps`**:

    ```typescript
    const { data: swapsData, ... } = useTokenSwaps({ network_id: selectedNetwork, pool: poolAddress, page_size: 10 });
    ```

    Fetches swap events for the specified `poolAddress`.

-   **`useHistoricalBalances`**:
    ```typescript
    const { data: historicalBalancesData, ... } = useHistoricalBalances(walletAddress, {
      network_id: selectedNetwork,
      contract_address: contractAddress,
      from_timestamp: historicalBalancesFromTs,
      to_timestamp: historicalBalancesToTs,
      resolution: "day",
    });
    ```
    Fetches historical token balances for the `walletAddress`, filtered by `contractAddress` within the given timestamp range.

### 4. Console Logging Mechanism

To prevent the console from being flooded with logs on every re-render, a series of `useEffect` hooks are implemented, one for each data-fetching hook. These `useEffect` hooks depend on the data, loading state, error state, and the `logged` state object.

Example for `useTokenMetadata`:

```typescript
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
```

**Explanation**:

-   This effect runs when `metadataData`, `isLoadingMetadata`, `errorMetadata`, or `logged` changes.
-   `!logged.metadata`: Checks if the metadata has already been logged.
-   `metadataData !== undefined`: Ensures there's actual data to log.
-   If both conditions are true, it logs the current data, loading, and error status for `useTokenMetadata`.
-   `setLogged(l => ({ ...l, metadata: true }))`: It then updates the `logged` state to mark that `metadata` has been logged, preventing future logs for the same data until `metadataData` itself changes to a new defined value (after perhaps an input change and refetch) and `logged.metadata` would have been reset or handled accordingly if re-logging of new data was desired (though in the current setup, it's a one-time log per data arrival).

This pattern is repeated for all other hooks, ensuring a clean and informative console output.

### 5. UI Elements and Interaction

The `TestPage.tsx` provides a user-friendly interface to modify the parameters for the hooks:

-   **Network Selector**: A dropdown list to select the `NetworkId` (e.g., Ethereum, Base, Polygon). Changing this will refetch data for all relevant hooks on the new network.
-   **Address Inputs**: Uses Scaffold-ETH's `AddressInput` component for:
    -   Contract Address
    -   Wallet Address
    -   Pool Address
        Changing these values will trigger refetches for hooks that depend on them.
-   **Timestamp Inputs**: Standard number input fields for "From Timestamp" and "To Timestamp" (Unix seconds) for the `useHistoricalBalances` hook.

### 6. Observing Data

As the page itself doesn't render the fetched data directly in complex tables or charts (to keep the test page focused on hook functionality), users are guided to:

```html
<p className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-md">
    Check your browser's console (Developer Tools) to see the data, loading
    states, and errors for each hook.
</p>
```

The console output will show the structured data, loading status (`isLoading`), and any errors (`error`) for each hook as they resolve.

This `TestPage.tsx` provides a robust way to understand the behavior, request parameters, and response structures of all the Token API SDK hooks.

## Best Practices Implemented

1. **Controlled Fetching**: Hooks support an `options` object with a `skip` parameter to prevent automatic fetching (e.g., `{ skip: true }`). This is useful when waiting for user input, as seen in components like `GetMetadata.tsx`. Alternatively, the `enabled` flag (used by `useTokenOHLCByContract`) provides fine-grained control, ensuring fetches only occur when specific conditions are met (like necessary parameters being defined), as demonstrated in `TestPage.tsx`.

2. **Error Handling**: Providing user-friendly error messages

3. **Loading States**: Clear loading indicators during data fetching

4. **Data Formatting**: Consistent number and address formatting

5. **Proper Component Composition**: Using Scaffold-ETH components like `<Address>` for consistent UI

## Conclusion

The token-api components demonstrate a well-structured approach to building data-driven React components with:

1. A reusable base hook for API communication
2. Specialized hooks for different data types
3. Consistent UI patterns and error handling
4. Integration with Scaffold-ETH 2 components and utilities
5. Comprehensive testing through a dedicated test page

This architecture allows for easy addition of new components and features while maintaining code consistency and developer experience.
