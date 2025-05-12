"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { EVM_NETWORKS, getBlockExplorerTxUrl, getNetworkName } from "~~/app/token-api/_config/networks";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import { TokenTransfer, TokenTransferItem, useTokenTransfers } from "~~/app/token-api/_hooks/useTokenTransfers";
import { Address, AddressInput } from "~~/components/scaffold-eth";

// Combined type to handle both API response formats
type CombinedTransfer = TokenTransferItem | TokenTransfer;

export const GetTransfers = ({ isOpen = true }: { isOpen?: boolean }) => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [transfers, setTransfers] = useState<CombinedTransfer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [age, setAge] = useState<number>(180); // Default to 180 days (maximum time frame)
  const [limit, setLimit] = useState<number>(100); // Default to 100 results
  const [page, setPage] = useState<number>(1); // Default to first page
  const [totalPages, setTotalPages] = useState<number>(1); // Total available pages
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Skip the API call until explicitly triggered
  const {
    data,
    isLoading: apiLoading,
    error: apiError,
    refetch,
  } = useTokenTransfers(
    walletAddress,
    {
      network_id: selectedNetwork,
      limit: limit,
      page: page,
      age: age,
    },
    { skip: true }, // Always skip initial fetch
  );

  // Extract transaction ID helper function
  const getTxId = (transfer: CombinedTransfer): string => {
    return (transfer as TokenTransferItem).transaction_id || (transfer as TokenTransfer).tx_hash || "";
  };

  // Extract from address helper function
  const getFromAddress = (transfer: CombinedTransfer): string => {
    return (transfer as TokenTransferItem).from || (transfer as TokenTransfer).from_address || "";
  };

  // Extract to address helper function
  const getToAddress = (transfer: CombinedTransfer): string => {
    return (transfer as TokenTransferItem).to || (transfer as TokenTransfer).to_address || "";
  };

  // Extract amount/value helper function
  const getAmount = (transfer: CombinedTransfer): string => {
    return (
      (transfer as TokenTransferItem).amount ||
      (transfer as TokenTransfer).value_display ||
      (transfer as TokenTransfer).value ||
      ""
    );
  };

  // Extract contract address helper function
  const getContractAddress = (transfer: CombinedTransfer): string => {
    return (transfer as TokenTransferItem).contract || (transfer as TokenTransfer).token_address || "";
  };

  // Format token amount based on decimals
  const formatTokenAmount = (amountStr: string, decimals: number): string => {
    try {
      if (!amountStr || amountStr === "0") {
        // If amount is zero or empty, format as 0.00 or 0 depending on decimals
        return Number(0).toLocaleString(undefined, {
          minimumFractionDigits: decimals > 0 ? 2 : 0,
          maximumFractionDigits: decimals > 0 ? 2 : 0,
        });
      }

      // If decimals is 0 (e.g., for NFTs), return the amount string as is (representing token ID or count).
      if (decimals === 0) {
        // Attempt to convert to number and localize, in case it's a large number string for an NFT count.
        const num = Number(amountStr);
        if (!isNaN(num)) {
          return num.toLocaleString();
        }
        return amountStr; // Fallback to raw string if not a simple number
      }

      // For tokens with decimals, use viem's formatUnits.
      // formatUnits expects a BigInt for the amount.
      let valueNumber: number;
      try {
        const formattedValueString = formatUnits(BigInt(amountStr), decimals);
        valueNumber = parseFloat(formattedValueString);
      } catch (parseError) {
        // Fallback if amountStr is not a simple integer string for BigInt conversion,
        // e.g., it's already a decimal string like "123.45" from some API fields.
        if (!isNaN(Number(amountStr))) {
          valueNumber = Number(amountStr);
        } else {
          console.error("Error parsing amount string for formatUnits:", parseError, { amountStr, decimals });
          return amountStr; // Fallback to raw string if completely unparseable
        }
      }

      if (isNaN(valueNumber)) {
        // Should not happen if parsing above is correct
        return amountStr;
      }

      // If the value is very small (but not zero), use scientific notation.
      if (valueNumber > 0 && valueNumber < 0.000001) {
        return valueNumber.toExponential(Math.min(decimals, 6)); // Use up to token's decimals or 6 for sci-notation
      }

      // Format the number with appropriate decimal places.
      // Show at least 2 decimal places for fungible tokens, and up to a max (e.g., 6 or token's own decimals).
      const displayDecimals = Math.min(decimals, 6); // Cap max display decimals at 6 for general readability
      return valueNumber.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: displayDecimals,
      });
    } catch (e) {
      console.error("Error formatting token amount:", e, { amountStr, decimals });
      // Fallback: try to return a somewhat formatted number if possible, else raw amount.
      if (amountStr && !isNaN(Number(amountStr)) && decimals > 0) {
        try {
          const fallbackValue = Number(amountStr) / 10 ** decimals;
          return fallbackValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: Math.min(decimals, 6),
          });
        } catch {
          // ignore
        }
      }
      return amountStr; // Last resort
    }
  };

  // Get decimals helper function
  const getDecimals = (transfer: CombinedTransfer): number => {
    return (transfer as TokenTransferItem).decimals || 18; // Default to 18 for most tokens
  };

  // Get formatted amount
  const getFormattedAmount = (transfer: CombinedTransfer): string => {
    const rawAmount = getAmount(transfer); // Fetches (item).amount OR (transfer).value_display OR (transfer).value
    const decimals = getDecimals(transfer); // Fetches (item).decimals, defaults to 18

    // Prioritize calculation if decimals are present and greater than 0,
    // and rawAmount is a valid string. This handles ERC20-like tokens.
    if (
      typeof (transfer as TokenTransferItem).decimals === "number" &&
      (transfer as TokenTransferItem).decimals > 0 &&
      rawAmount
    ) {
      return formatTokenAmount(rawAmount, (transfer as TokenTransferItem).decimals);
    }

    // If decimals are explicitly 0 (e.g. NFTs), also use formatTokenAmount which will handle it.
    // This will also catch rawAmount === "0" for fungible tokens if not caught above.
    if (
      typeof (transfer as TokenTransferItem).decimals === "number" &&
      (transfer as TokenTransferItem).decimals === 0 &&
      rawAmount
    ) {
      return formatTokenAmount(rawAmount, 0);
    }

    // Fallback for other cases:
    // If TokenTransferItem.value (numeric) is available, and we didn't use the path above.
    // This might be for API responses that directly provide a pre-formatted numeric value we trust.
    // However, given the USDT issue, this path is less preferred for fungible tokens.
    if ((transfer as TokenTransferItem).value !== undefined) {
      // If it's a number and seems like a token amount (not a USD value, for instance)
      // it's better to format it consistently if it has decimals.
      // If decimals suggest it's fungible, format it. Otherwise, stringify.
      if (decimals > 0) {
        return formatTokenAmount(String((transfer as TokenTransferItem).value), decimals);
      }
      return String((transfer as TokenTransferItem).value);
    }

    // If all else fails, format the rawAmount with the determined/defaulted decimals.
    // This ensures that even if the API structure is slightly different, we attempt a reasonable formatting.
    return formatTokenAmount(rawAmount, decimals);
  };

  // Extract timestamp helper function
  const getTimestamp = (transfer: CombinedTransfer): number => {
    if ((transfer as TokenTransferItem).datetime && typeof (transfer as TokenTransferItem).datetime === "string") {
      // Try to parse datetime string to timestamp
      try {
        return new Date((transfer as TokenTransferItem).datetime as string).getTime() / 1000;
      } catch (e) {
        console.error("Error parsing datetime:", e);
      }
    }
    return (transfer as TokenTransferItem).timestamp || (transfer as TokenTransfer).block_timestamp || 0;
  };

  // Extract symbol helper function
  const getSymbol = (transfer: CombinedTransfer): string => {
    return (transfer as TokenTransferItem).symbol || (transfer as TokenTransfer).type || "";
  };

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setTransfers([]); // Clear existing transfers
    setError(null);
  };

  // Function to go to next page
  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
      fetchTransfers(page + 1);
    }
  };

  // Function to go to previous page
  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
      fetchTransfers(page - 1);
    }
  };

  // Fetch transfers when button is clicked
  const fetchTransfers = async (pageNum = page) => {
    if (!walletAddress) {
      setError("Please enter a wallet address");
      return;
    }

    setError(null);
    setTransfers([]); // Clear existing transfers
    setIsLoading(true); // Set loading state manually

    console.log("🔍 Fetching transfers for wallet:", walletAddress);
    console.log("🔍 Using network:", selectedNetwork);
    console.log("🔍 Looking back:", age, "days");
    console.log("🔍 Page:", pageNum, "with", limit, "results per page");

    try {
      // Ensure the address has 0x prefix
      const formattedAddress = walletAddress.startsWith("0x") ? walletAddress : `0x${walletAddress}`;

      // Match how the balances endpoint is accessed since it's working
      const endpoint = `balances/evm/${formattedAddress}`;
      console.log("🔍 API endpoint:", endpoint);

      // Build the query parameters for the proxy API
      const queryParams = new URLSearchParams();
      queryParams.append("path", endpoint);
      queryParams.append("network_id", selectedNetwork);
      queryParams.append("limit", limit.toString());
      queryParams.append("page", pageNum.toString());

      // Call the API through the proxy that's working for balances
      const fullUrl = `/api/token-proxy?${queryParams.toString()}`;
      console.log("🔍 Making API request to:", fullUrl);

      try {
        const response = await fetch(fullUrl);
        console.log("🔍 API response status:", response.status);

        // Handle 404 responses
        if (response.status === 404) {
          console.log("⚠️ API returned 404 - No data found for this wallet");
          setTransfers([]);
          setTotalPages(1);
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API error response:", errorText);
          throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const jsonData = await response.json();
        console.log("🔍 API response data:", jsonData);

        // Process the response from balances endpoint
        if (jsonData.data && Array.isArray(jsonData.data)) {
          console.log("📊 Found balances, converting to transfers format");

          // Convert balances to transfer-like format for display
          const balancesAsTransfers = jsonData.data.map((balance: any) => ({
            block_num: balance.block_num || 0,
            datetime: balance.datetime || new Date().toISOString(),
            contract: balance.contract_address || balance.contract || "",
            from: "0x0000000000000000000000000000000000000000", // Unknown sender for balances
            to: walletAddress,
            amount: balance.amount || "0",
            value: balance.amount_usd || 0,
            network_id: balance.network_id || selectedNetwork,
            symbol: balance.symbol || "Unknown",
            decimals: balance.decimals || 18,
            transaction_id: "N/A", // Not available for balances
            price_usd: balance.price_usd || 0,
            value_usd: balance.amount_usd || 0,
          }));

          setTransfers(balancesAsTransfers);

          // Update pagination info if available
          if (jsonData.pagination) {
            setTotalPages(jsonData.pagination.total_pages || 1);
          } else {
            setTotalPages(1);
          }
        } else if (Array.isArray(jsonData)) {
          console.log("📊 Setting transfers from array data");
          setTransfers(jsonData);
          setTotalPages(1);
        } else {
          console.log("⚠️ No data found in response");
          setTransfers([]);
          setTotalPages(1);
        }
      } catch (fetchError) {
        console.error("❌ Fetch error:", fetchError);
        throw fetchError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching transfers:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update transfers when data is received from the hook
  useEffect(() => {
    console.log("Full API response:", data);

    if (data) {
      // Check if data is an array (direct response format)
      if (Array.isArray(data)) {
        console.log("📊 Transfers received (array format):", data.length);
        setTransfers(data);
      }
      // Check for traditional TokenTransfersResponse format
      else if (data.transfers) {
        console.log("📊 Transfers received (transfers format):", data.transfers.length);
        setTransfers(data.transfers);
      }
      // Check for alternative API response format
      else if (data.data) {
        console.log("📊 Transfers received (data format):", data.data.length);
        setTransfers(data.data);
      }
      // Handle empty or unexpected response
      else {
        console.warn("Unexpected API response format:", data);
        setTransfers([]);
      }
    } else if (apiError) {
      console.error("❌ API Error:", apiError);
      setError(typeof apiError === "string" ? apiError : "Failed to fetch transfers");
    }
  }, [data, apiError]);

  // Add useEffect to monitor state changes
  useEffect(() => {
    console.log("Wallet address state changed:", walletAddress);
    console.log("Is loading state:", apiLoading);
    console.log("Button should be disabled:", apiLoading || !walletAddress);
  }, [walletAddress, apiLoading]);

  return (
    <details className="collapse bg-blue-500/20 shadow-lg mb-4 rounded-xl border border-blue-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>🔄 Token Transfers - View token transfer history</span>
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
                  <AddressInput
                    value={walletAddress}
                    onChange={setWalletAddress}
                    placeholder="Enter wallet address to view transfers"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text text-base">Select Network</span>
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
                      <span className="label-text text-base">Age (Days)</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={age}
                      onChange={e => setAge(Number(e.target.value))}
                    >
                      <option value={7}>Last 7 days</option>
                      <option value={30}>Last 30 days</option>
                      <option value={90}>Last 90 days</option>
                      <option value={180}>Last 180 days (max)</option>
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
                      <option value={10}>10 Results</option>
                      <option value={25}>25 Results</option>
                      <option value={50}>50 Results</option>
                      <option value={100}>100 Results</option>
                      <option value={1000}>1000 Results (max)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={() => fetchTransfers()}
                  disabled={isLoading || !walletAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch Transfers"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading token transfers on {getNetworkName(selectedNetwork)}...</span>
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

          {!isLoading && !error && walletAddress && transfers.length === 0 && (
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
              <span>
                No token transfers found for this wallet on {getNetworkName(selectedNetwork)} in the last {age} days.
                Try another wallet address or network.
              </span>
            </div>
          )}

          {!isLoading && !error && walletAddress && transfers.length > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title">Token Transfers on {getNetworkName(selectedNetwork)}</h2>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-sm btn-outline" onClick={prevPage} disabled={page <= 1}>
                      Previous
                    </button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <button className="btn btn-sm btn-outline" onClick={nextPage} disabled={page >= totalPages}>
                      Next
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {transfers.map((transfer, index) => (
                    <div key={`${getTxId(transfer)}-${index}`} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                        <div className="flex flex-col">
                          <div className="text-lg font-semibold">{getSymbol(transfer) || "Token Transfer"}</div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm opacity-70">
                              Contract: <Address address={getContractAddress(transfer)} />
                            </div>
                            <div className="text-sm opacity-70">
                              To: <Address address={getToAddress(transfer)} />
                            </div>
                          </div>
                          <div className="text-xl">
                            {getFormattedAmount(transfer)} {getSymbol(transfer)}
                          </div>
                          {getAmount(transfer) !== getFormattedAmount(transfer) && (
                            <div className="text-xs opacity-60">Raw amount: {getAmount(transfer)}</div>
                          )}
                          {transfer.value_usd && (
                            <div className="text-sm text-success">${transfer.value_usd.toFixed(2)}</div>
                          )}
                          <div className="text-xs opacity-70">
                            Date: {new Date(getTimestamp(transfer) * 1000).toLocaleString()}
                          </div>
                          <div className="text-xs opacity-70">
                            <a
                              href={getBlockExplorerTxUrl(selectedNetwork, getTxId(transfer))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link link-primary"
                            >
                              View Transaction
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
