"use client";

import { useEffect, useState } from "react";
import { EVM_NETWORKS, getBlockExplorerTxUrl, getNetworkName } from "~~/app/token-api/_config/networks";
import { PROTOCOLS, ProtocolId, formatProtocolDisplay } from "~~/app/token-api/_config/protocols";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import { Swap, SwapsParams, useTokenSwaps } from "~~/app/token-api/_hooks/useTokenSwaps";
import { Address, AddressInput } from "~~/components/scaffold-eth";

export const GetSwaps = ({ isOpen = true }: { isOpen?: boolean }) => {
  // State for search parameters
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [callerAddress, setCallerAddress] = useState<string>("");
  const [senderAddress, setSenderAddress] = useState<string>("");
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolId>("uniswap_v3");
  const [limit, setLimit] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // Combined search parameters for the hook
  const [searchParams, setSearchParams] = useState<SwapsParams>({
    network_id: selectedNetwork,
    page,
    page_size: limit,
  });

  // Skip initial API call until user clicks search
  const [shouldFetch, setShouldFetch] = useState(false);

  // Fetch data using the hook
  const { data, isLoading, error, refetch } = useTokenSwaps(searchParams, { skip: !shouldFetch });

  // Local state to store the data
  const [swaps, setSwaps] = useState<Swap[]>([]);

  // Update swaps when data is received
  useEffect(() => {
    console.log("Data from API:", data);

    // Make sure data exists and check if it has the swap data array
    if (data) {
      // Debug the structure of the first swap
      if (Array.isArray(data) && data.length > 0) {
        console.log("First swap object structure:", JSON.stringify(data[0], null, 2));
      }

      // Set swaps from array data
      if (Array.isArray(data)) {
        console.log("Total swaps found (direct array):", data.length);
        setSwaps(data);
      }
      // Additional fallback check
      else {
        console.warn("Unexpected data format:", data);
        setSwaps([]);
      }
    } else if (error) {
      console.error("❌ Error fetching swaps:", error);
      setSwaps([]);
    }
  }, [data, error]);

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setSwaps([]);
  };

  // Handle protocol change
  const handleProtocolChange = (newProtocol: string) => {
    setSelectedProtocol(newProtocol as ProtocolId);
    setSwaps([]);
  };

  const fetchSwaps = async () => {
    // Update search parameters
    const params: SwapsParams = {
      network_id: selectedNetwork,
      page,
      page_size: limit,
      protocol: selectedProtocol,
    };

    // Add optional parameters if provided
    if (poolAddress) params.pool = poolAddress;
    if (callerAddress) params.caller = callerAddress;
    if (senderAddress) params.sender = senderAddress;
    if (recipientAddress) params.recipient = recipientAddress;
    if (transactionId) params.tx_hash = transactionId;

    // Log details
    console.log(`🔍 Searching swaps with parameters:`, params);
    console.log(`🔑 Using network: ${selectedNetwork}`);
    console.log(`🔄 Using protocol: ${selectedProtocol}`);

    // Update search params and trigger fetch
    setSearchParams(params);
    setShouldFetch(true);
  };

  // Format date
  const formatDate = (dateStr?: string | number) => {
    if (!dateStr) return "No timestamp";

    if (typeof dateStr === "number") {
      return new Date(dateStr * 1000).toLocaleString();
    } else {
      return new Date(dateStr).toLocaleString();
    }
  };

  // Update the formatAmount function to handle decimals properly
  const formatAmount = (amount?: string, decimals: number = 18) => {
    // Handle undefined or null amount
    if (!amount) return "No amount";

    // The amount might be positive or negative
    const isNegative = amount.startsWith("-");
    const absoluteAmount = isNegative ? amount.substring(1) : amount;

    try {
      // Convert to a decimal value based on decimals
      const value = BigInt(absoluteAmount) / BigInt(10 ** decimals);
      const valueNumber = Number(value);

      // Format with commas for readability
      const formattedAmount = valueNumber.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      });

      return isNegative ? `-${formattedAmount}` : formattedAmount;
    } catch (e) {
      console.error("Error formatting amount:", e);
      // Fallback to simple format
      const formattedAmount = new Intl.NumberFormat().format(Number(absoluteAmount));
      return isNegative ? `-${formattedAmount}` : formattedAmount;
    }
  };

  // Helper to safely get token symbol
  const getTokenSymbol = (token: any): string => {
    if (!token) return "Unknown";

    // If token is an object with symbol property
    if (typeof token === "object" && token.symbol) {
      return token.symbol;
    }

    // If token is a string (old format)
    if (typeof token === "string") {
      return token;
    }

    return "Unknown";
  };

  // Helper to safely get token address
  const getTokenAddress = (token: any): string => {
    if (!token) return "";

    // If token is an object with address property
    if (typeof token === "object" && token.address) {
      return token.address;
    }

    // If token is a string (old format - assume it's the address)
    if (typeof token === "string") {
      return token;
    }

    return "";
  };

  // Helper to safely get token decimals
  const getTokenDecimals = (token: any): number => {
    if (!token) return 18;

    // If token is an object with decimals property
    if (typeof token === "object" && token.decimals !== undefined) {
      return Number(token.decimals);
    }

    return 18; // Default decimals
  };

  // Generate block explorer URL for transaction
  const getExplorerUrl = (txId: string, networkId: string) => {
    if (!txId) return "#";
    return getBlockExplorerTxUrl(networkId as NetworkId, txId);
  };

  // Handle pagination
  const goToNextPage = () => {
    const newPage = page + 1;
    setPage(newPage);

    // Update params and refetch
    const newParams = {
      ...searchParams,
      page: newPage,
    };

    setSearchParams(newParams);

    // Only refetch if we're already fetching data
    if (shouldFetch) {
      // Use the updated params directly instead of relying on state update
      refetch();
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);

      // Update params and refetch
      const newParams = {
        ...searchParams,
        page: newPage,
      };

      setSearchParams(newParams);

      // Only refetch if we're already fetching data
      if (shouldFetch) {
        // Use the updated params directly instead of relying on state update
        refetch();
      }
    }
  };

  return (
    <details className="collapse bg-blue-500/20 shadow-lg mb-4 rounded-xl border border-blue-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>💱 DEX Swaps - Explore token swap events across protocols</span>
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
                      placeholder="e.g. 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640 (ETH/USDC)"
                    />
                  </div>
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base font-bold">Caller Address (optional)</span>
                    </label>
                    <AddressInput
                      value={callerAddress}
                      onChange={setCallerAddress}
                      placeholder="Enter caller address"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Sender Address (optional)</span>
                    </label>
                    <AddressInput
                      value={senderAddress}
                      onChange={setSenderAddress}
                      placeholder="Enter sender address"
                    />
                  </div>
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Recipient Address (optional)</span>
                    </label>
                    <AddressInput
                      value={recipientAddress}
                      onChange={setRecipientAddress}
                      placeholder="Enter recipient address"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Transaction ID (optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter transaction ID"
                      className="input input-bordered w-full"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Results per Page</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={limit}
                      onChange={e => setLimit(Number(e.target.value))}
                    >
                      <option value={10}>10 Results</option>
                      <option value={25}>25 Results</option>
                      <option value={50}>50 Results</option>
                      <option value={100}>100 Results</option>
                    </select>
                  </div>
                  <div className="flex items-end justify-end w-full">
                    <button
                      className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                      onClick={fetchSwaps}
                      disabled={isLoading}
                    >
                      {isLoading ? "Searching..." : "Search Swaps"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Searching for swaps on {getNetworkName(selectedNetwork)}...</span>
            </div>
          )}

          {error && (
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

          {!isLoading && !error && swaps.length > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title">
                    {swaps.length} Swap{swaps.length !== 1 ? "s" : ""} Found on {getNetworkName(selectedNetwork)}
                  </h2>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-outline" onClick={goToPrevPage} disabled={page <= 1 || isLoading}>
                      Previous
                    </button>
                    <span className="flex items-center">Page {page}</span>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={goToNextPage}
                      disabled={swaps.length < limit || isLoading}
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th className="w-[15%]">Transaction</th>
                        <th className="w-[15%]">Pool</th>
                        <th className="w-[15%]">Time</th>
                        <th className="w-[20%]">Token 0</th>
                        <th className="w-[20%]">Token 1</th>
                        <th className="w-[15%]">Addresses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {swaps.map((swap, index) => (
                        <tr key={index}>
                          <td>
                            <a
                              href={getExplorerUrl(swap.transaction_id || "", selectedNetwork)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link link-hover link-primary"
                            >
                              {swap.transaction_id ? `${swap.transaction_id.substring(0, 10)}...` : "No transaction"}
                            </a>
                          </td>
                          <td>{swap.pool ? <Address address={swap.pool} /> : "No pool"}</td>
                          <td>{swap.datetime ? formatDate(swap.datetime) : "No timestamp"}</td>
                          <td>
                            <div className="flex flex-col">
                              <span>
                                {swap.value0 !== undefined
                                  ? Number(swap.value0).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 6,
                                    })
                                  : formatAmount(swap.amount0, getTokenDecimals(swap.token0))}
                              </span>
                              <span className="text-xs text-opacity-70">{getTokenSymbol(swap.token0)}</span>
                              {swap.amount0_usd && (
                                <span className="text-xs text-success">${Number(swap.amount0_usd).toFixed(2)}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-col">
                              <span>
                                {swap.value1 !== undefined
                                  ? Number(swap.value1).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 6,
                                    })
                                  : formatAmount(swap.amount1, getTokenDecimals(swap.token1))}
                              </span>
                              <span className="text-xs text-opacity-70">{getTokenSymbol(swap.token1)}</span>
                              {swap.amount1_usd && (
                                <span className="text-xs text-success">${Number(swap.amount1_usd).toFixed(2)}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-col gap-1">
                              <div className="text-xs">
                                <span className="opacity-70">From:</span>{" "}
                                {swap.sender ? <Address address={swap.sender} /> : "Unknown"}
                              </div>
                              <div className="text-xs">
                                <span className="opacity-70">To:</span>{" "}
                                {swap.recipient ? <Address address={swap.recipient} /> : "Unknown"}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && swaps.length === 0 && (
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
              <span>No swaps found matching your criteria on {getNetworkName(selectedNetwork)}</span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
