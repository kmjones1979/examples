"use client";

import { useEffect, useState } from "react";
import { EVM_NETWORKS, getNetworkName } from "~~/app/token-api/_config/networks";
import { PROTOCOLS, ProtocolId, formatProtocolDisplay } from "~~/app/token-api/_config/protocols";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import { Pool, PoolsParams, useTokenPools } from "~~/app/token-api/_hooks/useTokenPools";
import { Address, AddressInput } from "~~/components/scaffold-eth";

export const GetPools = ({ isOpen = false }: { isOpen?: boolean }) => {
  // State for search parameters
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolId>("uniswap_v3");
  const [symbol, setSymbol] = useState<string>("");
  const [pools, setPools] = useState<Pool[]>([]);

  // Combined search parameters for the hook
  const [searchParams, setSearchParams] = useState<PoolsParams>({
    network_id: selectedNetwork,
    protocol: selectedProtocol,
    page: 1,
    page_size: 50,
    include_reserves: true,
  });

  // Skip initial API call until user clicks search
  const [shouldFetch, setShouldFetch] = useState(false);

  // Fetch data using the hook
  const { data, isLoading, error } = useTokenPools(shouldFetch ? searchParams : undefined, { skip: !shouldFetch });

  // Update pools when data is received (with safeguards)
  useEffect(() => {
    if (!data) return;

    try {
      // Handle array data
      if (Array.isArray(data)) {
        console.log("Total pools found (direct array):", data.length);
        setPools(data);
      }
      // Handle nested data
      else if (data.data && Array.isArray(data.data)) {
        console.log("Total pools found (nested data):", data.data.length);
        setPools(data.data);
      }
      // Handle unexpected format
      else {
        console.warn("Unexpected data format:", data);
        setPools([]);
      }
    } catch (err) {
      console.error("Error processing pool data:", err);
      setPools([]);
    }
  }, [data]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("❌ Error fetching pools:", error);
      setPools([]);
    }
  }, [error]);

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    // Only reset pools if we've already searched
    if (shouldFetch) {
      setPools([]);
    }
  };

  // Handle protocol change
  const handleProtocolChange = (newProtocol: string) => {
    setSelectedProtocol(newProtocol as ProtocolId);
    // Only reset pools if we've already searched
    if (shouldFetch) {
      setPools([]);
    }
  };

  const fetchPools = () => {
    // Create new params object
    const params: PoolsParams = {
      network_id: selectedNetwork,
      protocol: selectedProtocol,
      page: 1,
      page_size: 50,
      include_reserves: true,
    };

    // Add optional parameters if provided
    if (poolAddress) params.pool = poolAddress;
    if (tokenAddress) params.token = tokenAddress;
    if (symbol) params.symbol = symbol;

    // Log details
    console.log(`🔍 Searching pools with parameters:`, params);
    console.log(`🔑 Using network: ${selectedNetwork}`);
    console.log(`🔄 Using protocol: ${selectedProtocol}`);

    // Update search params and trigger fetch
    // (do this in a single update to prevent race conditions)
    setSearchParams(params);
    setShouldFetch(true);
  };

  // Format fee as percentage
  const formatFee = (fee?: number) => {
    return fee ? `${fee / 10000}%` : "N/A";
  };

  // Format date from either timestamp or date string
  const formatDate = (date?: number | string) => {
    if (!date) return "N/A";

    if (typeof date === "number") {
      return new Date(date * 1000).toLocaleString();
    } else {
      return new Date(date).toLocaleString();
    }
  };

  return (
    <details className="collapse bg-blue-500/20 shadow-lg mb-4 rounded-xl border border-blue-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>🔄 DEX Pools - Explore liquidity pools across protocols</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 transform transition-transform duration-200 details-toggle"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </summary>
      <style jsx>{`
        details[open] .details-toggle {
          transform: rotate(180deg);
        }
      `}</style>
      <div className="collapse-content">
        <div className="flex flex-col gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base font-bold">Pool Address (optional)</span>
                    </label>
                    <AddressInput
                      value={poolAddress}
                      onChange={setPoolAddress}
                      placeholder="Enter pool contract address"
                    />
                  </div>
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base font-bold">Token Address (optional)</span>
                    </label>
                    <AddressInput
                      value={tokenAddress}
                      onChange={setTokenAddress}
                      placeholder="Enter token contract address"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Symbol (optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter token symbol"
                      className="input input-bordered w-full"
                      value={symbol}
                      onChange={e => setSymbol(e.target.value)}
                    />
                  </div>
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Network</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={selectedNetwork}
                      onChange={e => handleNetworkChange(e.target.value)}
                    >
                      {EVM_NETWORKS.map(network => (
                        <option key={network.id} value={network.id}>
                          {network.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Protocol</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={selectedProtocol}
                      onChange={e => handleProtocolChange(e.target.value)}
                    >
                      {PROTOCOLS.map(protocol => (
                        <option key={protocol.id} value={protocol.id}>
                          {protocol.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={fetchPools}
                  disabled={isLoading}
                >
                  {isLoading ? "Searching..." : "Search Pools"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Searching for pools on {getNetworkName(selectedNetwork)}...</span>
            </div>
          )}

          {error && shouldFetch && (
            <div className="alert alert-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Error: {error}</span>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {pools.length > 0 ? (
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title mb-4">
                      {pools.length} Pool{pools.length !== 1 ? "s" : ""} Found on {getNetworkName(selectedNetwork)}
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th>Pool</th>
                            <th>Pair</th>
                            <th>Fee</th>
                            <th>Created</th>
                            <th>Protocol</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pools.map((pool, index) => (
                            <tr key={`${pool.pool}-${index}`}>
                              <td>
                                <Address address={pool.pool} />
                              </td>
                              <td>
                                <div className="flex items-center gap-1">
                                  <span>{pool.token0.symbol}</span>
                                  <span>/</span>
                                  <span>{pool.token1.symbol}</span>
                                </div>
                              </td>
                              <td>{formatFee(pool.fee)}</td>
                              <td>{formatDate(pool.datetime)}</td>
                              <td>
                                <span className="badge badge-accent">
                                  {formatProtocolDisplay(pool.protocol as ProtocolId)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : shouldFetch ? (
                <div className="alert alert-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>No pools found matching your criteria on {getNetworkName(selectedNetwork)}</span>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </details>
  );
};
