"use client";

import { useState } from "react";
import { EVM_NETWORKS, getNetworkName } from "~~/app/token-api/_config/networks";
import { TIME_INTERVALS, TIME_SPANS, getTimeRange } from "~~/app/token-api/_config/timeConfig";
import {
  HistoricalBalance,
  TokenBalanceHistory,
  useHistoricalBalances,
} from "~~/app/token-api/_hooks/useHistoricalBalances";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import { Address, AddressInput } from "~~/components/scaffold-eth";

// Adapter interface for API response
interface HistoricalBalanceItem {
  datetime: string;
  contract: string;
  name: string;
  symbol: string;
  decimals: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ApiResponse {
  data: HistoricalBalanceItem[];
  statistics: {
    bytes_read: number;
    rows_read: number;
    elapsed: number;
  };
  pagination?: {
    previous_page: number;
    current_page: number;
    next_page: number;
    total_pages: number;
  };
  results?: number;
  total_results?: number;
}

export const GetHistorical = ({ isOpen = true }: { isOpen?: boolean }) => {
  // State for search parameters
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [selectedInterval, setSelectedInterval] = useState<string>("1d");
  const [selectedTimeSpan, setSelectedTimeSpan] = useState<string>("30d");
  const [contractFilter, setContractFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [useMinimalParams, setUseMinimalParams] = useState<boolean>(true);

  // State for API results
  const [historicalBalances, setHistoricalBalances] = useState<HistoricalBalanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Use the hook to get types but skip automatic fetching
  const {
    data,
    isLoading: hookLoading,
    error: hookError,
  } = useHistoricalBalances(
    walletAddress,
    {
      network_id: selectedNetwork,
      contract_address: contractFilter || undefined,
    },
    { skip: true }, // Skip initial fetch until explicitly triggered
  );

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setHistoricalBalances([]);
    setError(null);
    setPage(1);
  };

  // Handle interval change
  const handleIntervalChange = (newInterval: string) => {
    setSelectedInterval(newInterval);
    setHistoricalBalances([]);
    setError(null);
  };

  const fetchHistoricalBalances = async () => {
    if (!walletAddress) {
      setError("Please enter a wallet address");
      return;
    }

    // Basic validation for Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setError("Please enter a valid Ethereum address");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHistoricalBalances([]);

    try {
      // Ensure the address has 0x prefix
      const formattedAddress = walletAddress.startsWith("0x") ? walletAddress : `0x${walletAddress}`;

      // Define the API endpoint
      const endpoint = `historical/balances/evm/${formattedAddress}`;

      // Create query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("path", endpoint);
      queryParams.append("network_id", selectedNetwork);

      // Only add additional parameters if not using minimal params mode
      if (!useMinimalParams) {
        const { startTime, endTime } = getTimeRange(selectedTimeSpan);
        queryParams.append("interval", selectedInterval);
        queryParams.append("startTime", startTime.toString());
        queryParams.append("endTime", endTime.toString());
        queryParams.append("limit", limit.toString());
        queryParams.append("page", page.toString());

        // Add contract filter if provided
        if (contractFilter) {
          queryParams.append("contracts", contractFilter);
        }
      }

      const fullUrl = `/api/token-proxy?${queryParams.toString()}`;

      console.log(`🌐 Making API request via proxy: ${fullUrl}`);
      console.log(`🔑 Using network: ${selectedNetwork}`);
      console.log(`🔧 Mode: ${useMinimalParams ? "Minimal parameters" : "Full parameters"}`);

      const response = await fetch(fullUrl);
      console.log("🔍 API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error Response:", errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data: ApiResponse = await response.json();
      console.log("🔍 API response data:", data);

      // Process the response
      if (data.data && Array.isArray(data.data)) {
        console.log(`📊 Setting historical balances from data.data, count: ${data.data.length}`);
        setHistoricalBalances(data.data);
      } else if (Array.isArray(data)) {
        console.log(`📊 Setting historical balances from array data, count: ${data.length}`);

        // Map to the expected format if necessary
        const mappedData = data.map((item: any) => ({
          datetime: item.datetime || new Date(item.timestamp * 1000).toISOString(),
          contract: item.contract_address || item.contract || "",
          name: item.token_name || item.name || "Unknown",
          symbol: item.token_symbol || item.symbol || "?",
          decimals: item.token_decimals?.toString() || "18",
          open: parseFloat(item.open || item.balance || "0"),
          high: parseFloat(item.high || item.balance || "0"),
          low: parseFloat(item.low || item.balance || "0"),
          close: parseFloat(item.close || item.balance || "0"),
        }));

        setHistoricalBalances(mappedData);
      } else {
        console.log("⚠️ No historical balances found in response");
        setHistoricalBalances([]);
      }

      // Update pagination info if available
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages || 1);
      } else if (data.results && data.total_results) {
        setTotalPages(Math.ceil(data.total_results / limit));
      } else {
        setTotalPages(1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching historical balances:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Format number with appropriate decimal places
  const formatNumber = (num: number, decimals: string) => {
    const decimalPlaces = Math.min(6, Number(decimals)); // Cap at 6 decimal places
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimalPlaces,
    });
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  // Handle pagination
  const goToNextPage = () => {
    if (page < totalPages) {
      const newPage = page + 1;
      setPage(newPage);
      // We'll do a fresh fetch with the new page number
      // Instead of using the callback version which might cause issues
      setTimeout(() => {
        fetchHistoricalBalances();
      }, 10);
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      // We'll do a fresh fetch with the new page number
      // Instead of using the callback version which might cause issues
      setTimeout(() => {
        fetchHistoricalBalances();
      }, 10);
    }
  };

  return (
    <details className="collapse bg-blue-500/20 shadow-lg mb-4 rounded-xl border border-blue-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>📈 Historical Balances - Track token balance changes over time</span>
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
                <div className="w-full">
                  <label className="label">
                    <span className="label-text text-xl font-bold">Enter Wallet Address</span>
                  </label>
                  <AddressInput value={walletAddress} onChange={setWalletAddress} placeholder="Enter wallet address" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <span className="label-text text-base">Filter by Contract (optional)</span>
                    </label>
                    <AddressInput
                      value={contractFilter}
                      onChange={setContractFilter}
                      placeholder="Enter token contract address to filter"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Time Period</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={selectedTimeSpan}
                      onChange={e => setSelectedTimeSpan(e.target.value)}
                    >
                      {TIME_SPANS.map(span => (
                        <option key={span.id} value={span.id}>
                          {span.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Interval</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={selectedInterval}
                      onChange={e => handleIntervalChange(e.target.value)}
                    >
                      {TIME_INTERVALS.map(interval => (
                        <option key={interval.id} value={interval.id}>
                          {interval.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Results per Page</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={limit}
                      onChange={e => setLimit(Number(e.target.value))}
                    >
                      <option value={10}>10 Records</option>
                      <option value={25}>25 Records</option>
                      <option value={50}>50 Records</option>
                    </select>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={useMinimalParams}
                      onChange={e => setUseMinimalParams(e.target.checked)}
                    />
                    <span className="label-text">Use minimal parameters (recommended for initial query)</span>
                  </label>
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={fetchHistoricalBalances}
                  disabled={isLoading || !walletAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch Historical Balances"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading historical balances on {getNetworkName(selectedNetwork)}...</span>
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

          {!isLoading && !error && historicalBalances.length > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title">
                    Historical Balances for <Address address={walletAddress} />
                  </h2>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-outline" onClick={goToPrevPage} disabled={page <= 1 || isLoading}>
                      Previous
                    </button>
                    <span className="flex items-center">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={goToNextPage}
                      disabled={page >= totalPages || isLoading}
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Date/Time</th>
                        <th>Token</th>
                        <th>Contract</th>
                        <th>Open</th>
                        <th>High</th>
                        <th>Low</th>
                        <th>Close</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicalBalances.map((balance, index) => (
                        <tr key={`${balance.contract}-${balance.datetime}-${index}`}>
                          <td>{formatDate(balance.datetime)}</td>
                          <td>
                            <div className="flex flex-col">
                              <span>{balance.symbol}</span>
                              <span className="text-xs opacity-70">{balance.name}</span>
                            </div>
                          </td>
                          <td>
                            <Address address={balance.contract} />
                          </td>
                          <td>{formatNumber(balance.open, balance.decimals)}</td>
                          <td>{formatNumber(balance.high, balance.decimals)}</td>
                          <td>{formatNumber(balance.low, balance.decimals)}</td>
                          <td>{formatNumber(balance.close, balance.decimals)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && historicalBalances.length === 0 && walletAddress && (
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
              <span>No historical balance data found for this address on {getNetworkName(selectedNetwork)}</span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
