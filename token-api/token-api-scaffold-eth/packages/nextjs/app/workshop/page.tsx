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
} from "~~/app/token-api/_hooks";
import type { NetworkId } from "~~/app/token-api/_types";
import { AddressInput } from "~~/components/scaffold-eth";

// Ensure all necessary types for state/params are here
type LoggedKeys =
  | "metadata"
  | "balances"
  | "holders"
  | "transfers"
  | "ohlcByPool"
  | "ohlcByContract"
  | "pools"
  | "swaps"
  | "historicalBalances";

const TestPage = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [contractAddress, setContractAddress] = useState<string>("0xc944E90C64B2c07662A292be6244BDf05Cda44a7");
  const [walletAddress, setWalletAddress] = useState<string>("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
  const [poolAddress, setPoolAddress] = useState<string>("0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801");

  // Initialize timestamp states to undefined to avoid hydration mismatch
  const [historicalBalancesFromTs, setHistoricalBalancesFromTs] = useState<number | undefined>(undefined);
  const [historicalBalancesToTs, setHistoricalBalancesToTs] = useState<number | undefined>(undefined);

  // Set initial timestamp values on client mount
  useEffect(() => {
    setHistoricalBalancesFromTs(Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000));
    setHistoricalBalancesToTs(Math.floor(Date.now() / 1000));
  }, []); // Empty dependency array ensures this runs only once on mount

  // Determine if timestamps are ready for the API call
  const timestampsReady = historicalBalancesFromTs !== undefined && historicalBalancesToTs !== undefined;

  // --- TokenMetadata Hook ---
  const {
    data: metadataData,
    isLoading: isLoadingMetadata,
    error: errorMetadata,
    refetch: refetchMetadata,
  } = useTokenMetadata(contractAddress, { network_id: selectedNetwork });

  // --- TokenBalances Hook ---
  const {
    data: balancesData,
    isLoading: isLoadingBalances,
    error: errorBalances,
    refetch: refetchBalances,
  } = useTokenBalances(walletAddress, { network_id: selectedNetwork });

  // --- TokenHolders Hook ---
  const {
    data: holdersData,
    isLoading: isLoadingHolders,
    error: errorHolders,
    refetch: refetchHolders,
  } = useTokenHolders(contractAddress, { network_id: selectedNetwork });

  // --- TokenTransfers Hook ---
  const {
    data: transfersData,
    isLoading: isLoadingTransfers,
    error: errorTransfers,
    refetch: refetchTransfers,
  } = useTokenTransfers(walletAddress, {
    network_id: selectedNetwork,
    // contract: contractAddress, // Optional: Filter transfers by token contract - REMOVED FOR TESTING
    limit: 100,
  });

  // --- TokenOHLCByPool Hook ---
  const {
    data: ohlcByPoolData,
    isLoading: isLoadingOhlcByPool,
    error: errorOhlcByPool,
    refetch: refetchOhlcByPool,
  } = useTokenOHLCByPool(poolAddress, { network_id: selectedNetwork, resolution: "1d" });

  // --- TokenOHLCByContract Hook ---
  const {
    data: ohlcByContractData,
    isLoading: isLoadingOhlcByContract,
    error: errorOhlcByContract,
    refetch: refetchOhlcByContract,
  } = useTokenOHLCByContract({
    contract: contractAddress,
    network: selectedNetwork,
    timeframe: 86400,
    limit: 100,
    enabled: timestampsReady,
    startTime: historicalBalancesFromTs,
    endTime: historicalBalancesToTs,
  });

  // --- TokenPools Hook ---
  const {
    data: poolsData,
    isLoading: isLoadingPools,
    error: errorPools,
    refetch: refetchPools,
  } = useTokenPools({ network_id: selectedNetwork, token: contractAddress, page_size: 10 });

  // --- TokenSwaps Hook ---
  const {
    data: swapsData,
    isLoading: isLoadingSwaps,
    error: errorSwaps,
    refetch: refetchSwaps,
  } = useTokenSwaps({ network_id: selectedNetwork, pool: poolAddress, page_size: 10 });

  // --- HistoricalBalances Hook ---
  const {
    data: historicalBalancesData,
    isLoading: isLoadingHistoricalBalances,
    error: errorHistoricalBalances,
    refetch: refetchHistoricalBalances,
  } = useHistoricalBalances(walletAddress, {
    network_id: selectedNetwork,
    contract_address: contractAddress,
    from_timestamp: historicalBalancesFromTs,
    to_timestamp: historicalBalancesToTs,
    resolution: "day",
  });

  // --- useEffects to log data for each hook ---
  const [logged, setLogged] = useState<Partial<Record<LoggedKeys, boolean>>>({});

  useEffect(() => {
    if (!logged.metadata && metadataData !== undefined) {
      console.log("useTokenMetadata:", { data: metadataData, isLoading: isLoadingMetadata, error: errorMetadata });
      setLogged(l => ({ ...l, metadata: true }));
    }
  }, [metadataData, isLoadingMetadata, errorMetadata, logged]);

  useEffect(() => {
    if (!logged.balances && balancesData !== undefined) {
      console.log("useTokenBalances:", { data: balancesData, isLoading: isLoadingBalances, error: errorBalances });
      setLogged(l => ({ ...l, balances: true }));
    }
  }, [balancesData, isLoadingBalances, errorBalances, logged]);

  useEffect(() => {
    if (!logged.holders && holdersData !== undefined) {
      console.log("useTokenHolders:", { data: holdersData, isLoading: isLoadingHolders, error: errorHolders });
      setLogged(l => ({ ...l, holders: true }));
    }
  }, [holdersData, isLoadingHolders, errorHolders, logged]);

  useEffect(() => {
    if (!logged.transfers && transfersData !== undefined) {
      console.log("useTokenTransfers:", { data: transfersData, isLoading: isLoadingTransfers, error: errorTransfers });
      setLogged(l => ({ ...l, transfers: true }));
    }
  }, [transfersData, isLoadingTransfers, errorTransfers, logged]);

  useEffect(() => {
    if (!logged.ohlcByPool && ohlcByPoolData !== undefined) {
      console.log("useTokenOHLCByPool:", {
        data: ohlcByPoolData,
        isLoading: isLoadingOhlcByPool,
        error: errorOhlcByPool,
      });
      setLogged(l => ({ ...l, ohlcByPool: true }));
    }
  }, [ohlcByPoolData, isLoadingOhlcByPool, errorOhlcByPool, logged]);

  useEffect(() => {
    if (!logged.ohlcByContract && ohlcByContractData !== undefined) {
      console.log("useTokenOHLCByContract:", {
        data: ohlcByContractData,
        isLoading: isLoadingOhlcByContract,
        error: errorOhlcByContract,
      });
      setLogged(l => ({ ...l, ohlcByContract: true }));
    }
  }, [ohlcByContractData, isLoadingOhlcByContract, errorOhlcByContract, logged]);

  useEffect(() => {
    if (!logged.pools && poolsData !== undefined) {
      console.log("useTokenPools:", { data: poolsData, isLoading: isLoadingPools, error: errorPools });
      setLogged(l => ({ ...l, pools: true }));
    }
  }, [poolsData, isLoadingPools, errorPools, logged]);

  useEffect(() => {
    if (!logged.swaps && swapsData !== undefined) {
      console.log("useTokenSwaps:", { data: swapsData, isLoading: isLoadingSwaps, error: errorSwaps });
      setLogged(l => ({ ...l, swaps: true }));
    }
  }, [swapsData, isLoadingSwaps, errorSwaps, logged]);

  useEffect(() => {
    if (!logged.historicalBalances && historicalBalancesData !== undefined) {
      console.log("useHistoricalBalances:", {
        data: historicalBalancesData,
        isLoading: isLoadingHistoricalBalances,
        error: errorHistoricalBalances,
      });
      setLogged(l => ({ ...l, historicalBalances: true }));
    }
  }, [historicalBalancesData, isLoadingHistoricalBalances, errorHistoricalBalances, logged]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Token API Hooks Tutorial</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="network-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Network:
          </label>
          <select
            id="network-select"
            value={selectedNetwork}
            onChange={e => setSelectedNetwork(e.target.value as NetworkId)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {EVM_NETWORKS.map(network => (
              <option key={network.id} value={network.id}>
                {network.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="contract-address" className="block text-sm font-medium text-gray-700 mb-1">
            Contract Address:
          </label>
          <AddressInput value={contractAddress} onChange={setContractAddress} placeholder="Enter contract address" />
        </div>
        <div>
          <label htmlFor="wallet-address" className="block text-sm font-medium text-gray-700 mb-1">
            Wallet Address:
          </label>
          <AddressInput value={walletAddress} onChange={setWalletAddress} placeholder="Enter wallet address" />
        </div>
        <div>
          <label htmlFor="pool-address" className="block text-sm font-medium text-gray-700 mb-1">
            Pool Address:
          </label>
          <AddressInput value={poolAddress} onChange={setPoolAddress} placeholder="Enter pool address" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <label htmlFor="from-ts-hist-balance" className="block text-sm font-medium text-gray-700 mb-1">
            From Timestamp (Unix):
          </label>
          <input
            type="number"
            id="from-ts-hist-balance"
            value={historicalBalancesFromTs ?? ""}
            onChange={e => setHistoricalBalancesFromTs(parseInt(e.target.value))}
            className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          />
          <p className="text-xs text-gray-500">e.g., 1672531200 (Jan 1, 2023 00:00:00 GMT)</p>
        </div>
        <div>
          <label htmlFor="to-ts-hist-balance" className="block text-sm font-medium text-gray-700 mb-1">
            To Timestamp (Unix):
          </label>
          <input
            type="number"
            id="to-ts-hist-balance"
            value={historicalBalancesToTs ?? ""}
            onChange={e => setHistoricalBalancesToTs(parseInt(e.target.value))}
            className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          />
          <p className="text-xs text-gray-500">e.g., 1675209600 (Feb 1, 2023 00:00:00 GMT)</p>
        </div>
      </div>

      <p className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-md">
        Check your browser's console (Developer Tools) to see the data, loading states, and errors for each hook after
        clicking the "Fetch Data" button.
      </p>
    </div>
  );
};

export default TestPage;
