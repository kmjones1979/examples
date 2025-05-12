"use client";

import { useEffect, useRef, useState } from "react";
import { EVM_NETWORKS, getNetworkName } from "~~/app/token-api/_config/networks";
import { TIME_INTERVALS, TIME_SPANS, getTimeRange } from "~~/app/token-api/_config/timeConfig";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import {
  OHLCDataPoint,
  PoolOHLCParams,
  PoolOHLCResponse,
  useTokenOHLCByPool,
} from "~~/app/token-api/_hooks/useTokenOHLCByPool";
import { Address, AddressInput } from "~~/components/scaffold-eth";

// Extended OHLC data interface for our component
interface OHLCDataExtended extends Partial<OHLCDataPoint> {
  datetime?: string;
  network_id?: string;
  pool?: string;
}

// Extended response interface to handle alternative API format
interface ExtendedPoolOHLCResponse extends PoolOHLCResponse {
  data?: any[];
  statistics?: {
    token0_symbol?: string;
    token0_address?: string;
    token1_symbol?: string;
    token1_address?: string;
    protocol?: string;
  };
}

export const GetOHLCByPool = ({ isOpen = true }: { isOpen?: boolean }) => {
  // State for search parameters
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [selectedInterval, setSelectedInterval] = useState<PoolOHLCParams["resolution"]>("1d");
  const [selectedTimeSpan, setSelectedTimeSpan] = useState<string>("30d");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [shouldFetch, setShouldFetch] = useState<boolean>(false);
  const processingData = useRef(false);

  // State for API results
  const [ohlcData, setOhlcData] = useState<OHLCDataExtended[]>([]);
  const [poolInfo, setPoolInfo] = useState<{
    token0_symbol?: string;
    token1_symbol?: string;
    protocol?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Get time range based on selected time span
  const { startTime, endTime } = getTimeRange(selectedTimeSpan);

  // Use the hook to fetch OHLC data
  const {
    data: responseData,
    isLoading,
    error: hookError,
    refetch,
  } = useTokenOHLCByPool(
    poolAddress,
    {
      network_id: selectedNetwork,
      from_timestamp: startTime,
      to_timestamp: endTime,
      resolution: selectedInterval,
    },
    { skip: !shouldFetch },
  );

  // Process data from the hook when it's available
  useEffect(() => {
    if (!responseData || processingData.current) return;

    // Set the processing flag to prevent re-entry
    processingData.current = true;

    try {
      // Log the complete raw response to see exactly what we're getting
      console.log("🔍 COMPLETE RAW RESPONSE:", responseData);

      // Check if responseData is an array (direct array response)
      if (Array.isArray(responseData)) {
        console.log("📊 Processing direct array response");

        // Process the data array
        const formattedData = responseData.map((item: any) => {
          const timestamp =
            item.timestamp || (item.datetime ? new Date(item.datetime).getTime() / 1000 : Date.now() / 1000);
          return {
            timestamp,
            open: typeof item.open === "string" ? parseFloat(item.open) : item.open || 0,
            high: typeof item.high === "string" ? parseFloat(item.high) : item.high || 0,
            low: typeof item.low === "string" ? parseFloat(item.low) : item.low || 0,
            close: typeof item.close === "string" ? parseFloat(item.close) : item.close || 0,
            volume_token0: item.volume_token0 || item.volume || 0,
            volume_token1: item.volume_token1 || 0,
            volume_usd: item.volume_usd,
            datetime: new Date(timestamp * 1000).toISOString(),
            network_id: selectedNetwork,
            pool: poolAddress,
          };
        });

        if (formattedData.length > 0) {
          console.log("✅ Successfully processed array data with", formattedData.length, "entries");
          setOhlcData(formattedData);

          // For direct array response, we don't have token info, so use defaults
          setPoolInfo({
            token0_symbol: "Token0",
            token1_symbol: "Token1",
            protocol: "Unknown",
          });

          // Estimate total pages based on data length
          setTotalPages(Math.ceil(responseData.length / pageSize) || 1);

          // Stop triggering more fetches
          setShouldFetch(false);
        }
      }
      // Check if we have the original expected format
      else if (responseData.ohlc && Array.isArray(responseData.ohlc) && responseData.ohlc.length > 0) {
        console.log("📈 Processing data using the expected ohlc format");
        const formattedData = responseData.ohlc.map((item: OHLCDataPoint) => ({
          ...item,
          datetime: new Date(item.timestamp * 1000).toISOString(),
          network_id: selectedNetwork,
          pool: poolAddress,
        }));

        setOhlcData(formattedData);

        // Set pool token information
        setPoolInfo({
          token0_symbol: responseData.token0_symbol || "Token0",
          token1_symbol: responseData.token1_symbol || "Token1",
          protocol: responseData.protocol || "Unknown",
        });

        // Handle pagination if available
        if (responseData.pagination) {
          setTotalPages(responseData.pagination.total_pages || 1);
        } else {
          setTotalPages(Math.ceil(responseData.ohlc.length / pageSize) || 1);
        }

        // Stop triggering more fetches
        setShouldFetch(false);
      }
      // Check if the data is directly in the response (no nesting)
      else if ((responseData as any).data && Array.isArray((responseData as any).data)) {
        console.log("📊 Processing data from response.data array");
        const dataArray = (responseData as any).data;
        const statistics = (responseData as any).statistics || {};

        // Process the data array
        const formattedData = dataArray.map((item: any) => {
          const timestamp =
            item.timestamp || (item.datetime ? new Date(item.datetime).getTime() / 1000 : Date.now() / 1000);
          return {
            timestamp,
            open: typeof item.open === "string" ? parseFloat(item.open) : item.open || 0,
            high: typeof item.high === "string" ? parseFloat(item.high) : item.high || 0,
            low: typeof item.low === "string" ? parseFloat(item.low) : item.low || 0,
            close: typeof item.close === "string" ? parseFloat(item.close) : item.close || 0,
            volume_token0: item.volume_token0 || item.volume || 0,
            volume_token1: item.volume_token1 || 0,
            volume_usd: item.volume_usd,
            datetime: new Date(timestamp * 1000).toISOString(),
            network_id: selectedNetwork,
            pool: poolAddress,
          };
        });

        // Only update state if we actually have data to display
        if (formattedData.length > 0) {
          console.log("✅ Successfully processed data with", formattedData.length, "entries");
          setOhlcData(formattedData);

          // Set token info from the response if available
          setPoolInfo({
            token0_symbol: statistics.token0_symbol || "Token0",
            token1_symbol: statistics.token1_symbol || "Token1",
            protocol: statistics.protocol || "Unknown",
          });

          // Handle pagination
          if ((responseData as any).pagination) {
            setTotalPages((responseData as any).pagination.total_pages || 1);
          } else {
            setTotalPages(Math.ceil(dataArray.length / pageSize) || 1);
          }

          // Stop triggering more fetches
          setShouldFetch(false);
        } else {
          console.warn("⚠️ Data array was empty");
          setOhlcData([]);
          setPoolInfo(null);
          // Stop fetching if there's no data to avoid loops
          setShouldFetch(false);
        }
      }
      // No recognizable data format found
      else {
        console.log("⚠️ No pool OHLC data found in response or unexpected format");
        setOhlcData([]);
        setPoolInfo(null);
        // Stop fetching to avoid loops
        setShouldFetch(false);
      }
    } catch (err) {
      console.error("❌ Error processing pool OHLC data:", err);
      setError(`Error processing data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      // Release the processing flag after a longer delay to avoid race conditions
      setTimeout(() => {
        processingData.current = false;
      }, 1000);
    }
  }, [responseData, pageSize, selectedNetwork, poolAddress]);

  // Handle API errors
  useEffect(() => {
    if (!hookError) return;

    console.error("❌ API error from hook:", hookError);
    const errorMessage = typeof hookError === "string" ? hookError : "Failed to fetch pool OHLC data";

    // Custom error message for 404 responses
    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      setError(`No OHLC data found for this pool. Please verify:
        1. The pool address is correct
        2. The pool exists on the selected network (currently: ${getNetworkName(selectedNetwork)})
        3. The pool has sufficient trading activity`);
    } else {
      setError(errorMessage);
    }
  }, [hookError, selectedNetwork]);

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setOhlcData([]);
    setError(null);
    setPage(1);
    setShouldFetch(false);
  };

  // Handle interval change
  const handleIntervalChange = (newInterval: PoolOHLCParams["resolution"]) => {
    setSelectedInterval(newInterval);
    setOhlcData([]);
    setError(null);
    setPage(1);
  };

  // Fetch OHLC data
  const fetchOHLCData = async () => {
    if (!poolAddress) {
      setError("Please enter a pool address");
      return;
    }

    // Reset state
    setError(null);
    setOhlcData([]);
    setPage(1);

    // Reset processing flag to ensure we can process the new data
    processingData.current = false;

    // Set shouldFetch to false first to ensure a clean state
    setShouldFetch(false);

    // Use setTimeout to ensure state updates before setting to true
    setTimeout(() => {
      setShouldFetch(true);
      // Manually trigger refetch
      refetch();
    }, 100);
  };

  // Format date for display
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (err) {
      return "Invalid Date";
    }
  };

  // Format price for display
  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(price);
  };

  // Format volume for display
  const formatVolume = (volume: number | undefined) => {
    if (volume === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(volume);
  };

  // Pagination handlers
  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };

  // Calculate price change percentage
  const calculatePriceChange = (open: number | undefined, close: number | undefined) => {
    if (open === undefined || close === undefined || open === 0) return null;
    const percentChange = ((close - open) / open) * 100;
    return percentChange;
  };

  if (!isOpen) return null;

  return (
    <details className="collapse bg-blue-500/20 shadow-lg mb-4 rounded-xl border border-blue-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>📈 Pool OHLC Price Data - View price charts for any liquidity pool</span>
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
          {/* Input Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col gap-4">
                {/* Pool Address Input */}
                <div className="w-full">
                  <label className="label">
                    <span className="label-text text-xl font-bold">Enter Pool Address</span>
                  </label>
                  <AddressInput
                    value={poolAddress}
                    onChange={value => {
                      setPoolAddress(value);
                      setShouldFetch(false);
                    }}
                    placeholder="Enter pool address (0x...)"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
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

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-base">Interval</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={selectedInterval}
                      onChange={e => handleIntervalChange(e.target.value as PoolOHLCParams["resolution"])}
                    >
                      {TIME_INTERVALS.map(interval => (
                        <option key={interval.id} value={interval.id}>
                          {interval.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-base">Time Range</span>
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
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={fetchOHLCData}
                  disabled={isLoading || !poolAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch OHLC Data"}
                </button>
              </div>
            </div>
          </div>

          {/* Examples Section */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-lg">Examples</h3>
              <p className="text-sm opacity-70 mb-2">Click an example to try it:</p>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="font-medium text-sm">Uniswap V3 ETH/USDC Pool (Mainnet): </span>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      setPoolAddress("0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640");
                      setSelectedNetwork("mainnet");
                    }}
                  >
                    0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="font-medium text-sm">Uniswap V3 WETH/USDT Pool (Arbitrum): </span>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      setPoolAddress("0x641c00a822ea9bb7d9a1e7e4eff8f7e39f9db213");
                      setSelectedNetwork("arbitrum-one");
                    }}
                  >
                    0x641c00a822ea9bb7d9a1e7e4eff8f7e39f9db213
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="font-medium text-sm">PancakeSwap CAKE/BNB Pool (BSC): </span>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      setPoolAddress("0x0ed7e52944161450477ee417de9cd3a859b14fd0");
                      setSelectedNetwork("bsc");
                    }}
                  >
                    0x0ed7e52944161450477ee417de9cd3a859b14fd0
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading pool OHLC data on {getNetworkName(selectedNetwork)}...</span>
            </div>
          )}

          {/* Error Message */}
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
              <span className="break-all whitespace-pre-wrap">{error}</span>
            </div>
          )}

          {/* Pool Information */}
          {!isLoading && !error && poolInfo && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Pool Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="stat bg-base-200 rounded-box p-4">
                    <div className="stat-title">Pool Address</div>
                    <div className="stat-value text-base break-all font-mono">
                      <Address address={poolAddress} size="sm" />
                    </div>
                  </div>
                  <div className="stat bg-base-200 rounded-box p-4">
                    <div className="stat-title">Token Pair</div>
                    <div className="stat-value text-primary text-lg">
                      {poolInfo.token0_symbol}/{poolInfo.token1_symbol}
                    </div>
                  </div>
                  <div className="stat bg-base-200 rounded-box p-4">
                    <div className="stat-title">Protocol</div>
                    <div className="stat-value text-secondary text-lg">{poolInfo.protocol}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OHLC Data Table */}
          {!isLoading && !error && ohlcData.length > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">OHLC Price Data</h3>
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Date/Time</th>
                        <th>Open</th>
                        <th>High</th>
                        <th>Low</th>
                        <th>Close</th>
                        <th>Change</th>
                        <th>Volume (Token0)</th>
                        <th>Volume (Token1)</th>
                        {ohlcData[0]?.volume_usd !== undefined && <th>Volume (USD)</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {ohlcData.map((item, index) => {
                        const priceChange = calculatePriceChange(item.open, item.close);
                        const priceChangeClass = priceChange
                          ? priceChange > 0
                            ? "text-green-500"
                            : priceChange < 0
                              ? "text-red-500"
                              : ""
                          : "";

                        return (
                          <tr key={index}>
                            <td>{formatDate(item.datetime)}</td>
                            <td>{formatPrice(item.open)}</td>
                            <td>{formatPrice(item.high)}</td>
                            <td>{formatPrice(item.low)}</td>
                            <td>{formatPrice(item.close)}</td>
                            <td className={priceChangeClass}>
                              {priceChange !== null ? `${priceChange.toFixed(2)}%` : "N/A"}
                            </td>
                            <td>{formatVolume(item.volume_token0)}</td>
                            <td>{formatVolume(item.volume_token1)}</td>
                            {item.volume_usd !== undefined && <td>{formatVolume(item.volume_usd)}</td>}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={goToPrevPage}
                      disabled={page === 1 || isLoading}
                    >
                      Previous
                    </button>
                    <span>
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
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && !ohlcData.length && (
            <div className="alert alert-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Enter a pool address and click "Fetch OHLC Data" to view price data</span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
