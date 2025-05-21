"use client";

import { useEffect, useState } from "react";
import { getExampleTokenAddress } from "~~/app/token-api/_config/exampleTokens";
import { EVM_NETWORKS, getNetworkName } from "~~/app/token-api/_config/networks";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import { TokenHolder, TokenHoldersResponse, useTokenHolders } from "~~/app/token-api/_hooks/useTokenHolders";
import { Address, AddressInput } from "~~/components/scaffold-eth";

// API response holder format (extends TokenHolder with additional fields)
interface HolderItem {
  block_num?: number;
  timestamp?: number;
  date?: string;
  address: string;
  amount: string;
  decimals: number;
  symbol: string;
  network_id: string;
  price_usd?: number;
  value_usd?: number;
  balance?: string;
  balance_usd?: number;
  last_updated_block?: number;
  token_share?: number;
}

interface ApiResponse {
  data: HolderItem[];
  statistics?: {
    bytes_read: number;
    rows_read: number;
    elapsed: number;
  };
  contract_address?: string;
  holders?: TokenHolder[];
  page?: number;
  page_size?: number;
  total_holders?: number;
}

// Helper function to estimate date from block number and network
const estimateDateFromBlock = (blockNum: number | undefined, networkId: string): Date => {
  if (blockNum === undefined) {
    return new Date();
  }

  const now = new Date();
  const blockTime = networkId === "mainnet" ? 12 : 3; // Estimated seconds per block
  // Current block estimates based on network
  const currentBlock = now.getTime() / 1000 / blockTime;
  const blockDiff = Math.max(0, currentBlock - blockNum); // Ensure non-negative
  const secondsAgo = blockDiff * blockTime;

  // Calculate the date, ensuring it's not in the future
  const estimatedDate = new Date(now.getTime() - secondsAgo * 1000);
  return estimatedDate > now ? now : estimatedDate;
};

export const GetHolders = ({ isOpen = false }: { isOpen?: boolean }) => {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [holders, setHolders] = useState<HolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<string>("desc");
  const [limit, setLimit] = useState<number>(50);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Use the hook to get types but skip automatic fetching
  const {
    data,
    isLoading: hookLoading,
    error: hookError,
  } = useTokenHolders(
    contractAddress,
    {
      network_id: selectedNetwork,
      page_size: limit,
      page: page,
    },
    { skip: true }, // Skip initial fetch until explicitly triggered
  );

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setHolders([]);
    setError(null);
    setPage(1); // Reset pagination when network changes
  };

  const fetchHolders = async () => {
    if (!contractAddress) {
      setError("Please enter a contract address");
      return;
    }

    // Basic validation for Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      setError("Please enter a valid ERC20 contract address");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHolders([]);

    try {
      // Ensure the address has 0x prefix
      const formattedAddress = contractAddress.startsWith("0x") ? contractAddress : `0x${contractAddress}`;

      // Define the API endpoint
      const endpoint = `holders/evm/${formattedAddress}`;
      console.log("🔍 API endpoint:", endpoint);

      // Build the query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("path", endpoint);
      queryParams.append("network_id", selectedNetwork);
      queryParams.append("order_by", orderBy);
      queryParams.append("page_size", limit.toString());
      queryParams.append("page", page.toString());

      // Call the API directly
      const fullUrl = `/api/token-proxy?${queryParams.toString()}`;
      console.log("🔍 Making direct API request to:", fullUrl);
      console.log(`🔑 Using network: ${selectedNetwork}`);
      console.log(`📝 Contract Address: ${contractAddress}`);

      const response = await fetch(fullUrl);
      console.log("🔍 API response status:", response.status);

      // Handle 404 with custom error message
      if (response.status === 404) {
        const errorText = await response.text();
        throw new Error(`No holders found for this token contract. Please verify:
          1. The contract address is correct
          2. The contract is an ERC20 token
          3. The selected network is correct (currently: ${getNetworkName(selectedNetwork)})
          
          Try using example token: ${getExampleTokenAddress(selectedNetwork)}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API error response:", errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const jsonData: ApiResponse = await response.json();
      console.log("🔍 API response data:", jsonData);

      // Process the response based on format
      if (jsonData.data && Array.isArray(jsonData.data)) {
        console.log("📊 Setting holders from jsonData.data, count:", jsonData.data.length);
        setHolders(jsonData.data);

        // Update pagination if possible
        if (jsonData.page && jsonData.total_holders) {
          const totalPgs = Math.ceil(jsonData.total_holders / (jsonData.page_size || limit));
          setTotalPages(totalPgs);
          console.log(`📊 Total pages: ${totalPgs}, Current page: ${jsonData.page}`);
        }
      } else if (jsonData.holders && Array.isArray(jsonData.holders)) {
        console.log("📊 Setting holders from jsonData.holders, count:", jsonData.holders.length);

        // Map holders to expected format
        const mappedHolders = jsonData.holders.map((holder: TokenHolder) => ({
          address: holder.address,
          amount: holder.balance,
          balance: holder.balance,
          block_num: holder.last_updated_block,
          decimals: 18, // Default decimals if not provided
          symbol: "TOKEN", // Default symbol if not provided
          network_id: selectedNetwork,
          value_usd: holder.balance_usd,
          token_share: holder.token_share,
        }));

        setHolders(mappedHolders);

        // Update pagination if possible
        if (jsonData.page && jsonData.total_holders) {
          const totalPgs = Math.ceil(jsonData.total_holders / (jsonData.page_size || limit));
          setTotalPages(totalPgs);
          console.log(`📊 Total pages: ${totalPgs}, Current page: ${jsonData.page}`);
        }
      } else if (Array.isArray(jsonData)) {
        console.log("📊 Setting holders from array jsonData, count:", jsonData.length);

        // Map array data to expected format
        const mappedHolders = jsonData.map((item: any) => ({
          address: item.address,
          amount: item.amount || item.balance || "0",
          balance: item.balance || item.amount || "0",
          block_num: item.block_num || item.last_updated_block || 0,
          decimals: item.decimals || 18,
          symbol: item.symbol || "TOKEN",
          network_id: item.network_id || selectedNetwork,
          value_usd: item.value_usd || item.balance_usd,
          token_share: item.token_share,
        }));

        setHolders(mappedHolders);
      } else {
        console.log("⚠️ No token holders found in response or unexpected format");
        setHolders([]);
      }

      // If no total pages info, estimate based on result length
      if (holders.length < limit) {
        setTotalPages(page); // Assume this is the last page
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching holders:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation functions
  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(prevPage => prevPage + 1);
      fetchHolders();
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      setPage(prevPage => prevPage - 1);
      fetchHolders();
    }
  };

  // Format token amount with appropriate decimals
  const formatTokenAmount = (amount: string, decimals: number) => {
    try {
      const value = Number(amount) / Math.pow(10, decimals);
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: Math.min(decimals, 6),
      });
    } catch (e) {
      return amount;
    }
  };

  return (
    <details className="collapse bg-blue-500/20 shadow-lg mb-4 rounded-xl border border-blue-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>👥 Token Holders - View all holders of an ERC20 token</span>
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
                    <span className="label-text text-xl font-bold">Enter Token Contract Address</span>
                  </label>
                  <AddressInput
                    value={contractAddress}
                    onChange={setContractAddress}
                    placeholder="Enter token contract address"
                  />
                  <div className="mt-2 text-sm opacity-70">
                    Example for {getNetworkName(selectedNetwork)}: {getExampleTokenAddress(selectedNetwork)}
                  </div>
                </div>
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
                    <span className="label-text text-base">Sort Order</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={orderBy}
                    onChange={e => setOrderBy(e.target.value)}
                  >
                    <option value="desc">Highest Balance First</option>
                    <option value="asc">Lowest Balance First</option>
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
                    <option value={10}>10 Holders</option>
                    <option value={50}>50 Holders</option>
                    <option value={100}>100 Holders</option>
                    <option value={500}>500 Holders</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                  <button className="btn btn-sm" onClick={goToPrevPage} disabled={page === 1 || isLoading}>
                    Previous
                  </button>
                  <span className="py-1">
                    Page {page} of {totalPages || "?"}
                  </span>
                  <button className="btn btn-sm" onClick={goToNextPage} disabled={isLoading || holders.length < limit}>
                    Next
                  </button>
                </div>
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={fetchHolders}
                  disabled={isLoading || !contractAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch Holders"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading token holders on {getNetworkName(selectedNetwork)}...</span>
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

          {!isLoading && !error && contractAddress && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">Token Holders on {getNetworkName(selectedNetwork)}</h2>
                <div className="flex flex-col gap-2">
                  {holders && holders.length > 0 ? (
                    holders.map((holder, index) => (
                      <div key={`${holder.address}-${index}`} className="card bg-base-200 shadow-sm">
                        <div className="card-body p-4">
                          <div className="flex flex-col">
                            <div className="flex justify-between items-center">
                              <div className="text-lg font-semibold">Holder #{(page - 1) * limit + index + 1}</div>
                              <div className="text-sm opacity-70">
                                <Address address={holder.address} />
                              </div>
                            </div>
                            <div className="text-xl">
                              {formatTokenAmount(holder.amount || holder.balance || "0", holder.decimals)}{" "}
                              {holder.symbol}
                            </div>
                            {(holder.value_usd || holder.balance_usd) && (
                              <div className="text-sm text-success">
                                ${(holder.value_usd || holder.balance_usd || 0).toFixed(2)}
                              </div>
                            )}
                            {holder.token_share !== undefined && (
                              <div className="text-sm opacity-80">
                                {(holder.token_share * 100).toFixed(4)}% of total supply
                              </div>
                            )}
                            <div className="text-xs opacity-70">
                              Last updated:{" "}
                              {holder.timestamp
                                ? new Date(holder.timestamp * 1000).toLocaleString()
                                : estimateDateFromBlock(holder.block_num, holder.network_id).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
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
                      <span>No token holders found for this contract on {getNetworkName(selectedNetwork)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
