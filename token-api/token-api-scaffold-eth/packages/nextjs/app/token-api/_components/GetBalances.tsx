"use client";

import { useEffect, useRef, useState } from "react";
import { EVM_NETWORKS, getBlockExplorerTokenUrl, getNetworkName } from "~~/app/token-api/_config/networks";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import { TokenBalance, useTokenBalances } from "~~/app/token-api/_hooks/useTokenBalances";
import { Address, AddressInput } from "~~/components/scaffold-eth";

export const GetBalances = ({ isOpen = true }: { isOpen?: boolean }) => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(100);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shouldFetch, setShouldFetch] = useState<boolean>(false);
  const processingData = useRef(false);

  // Use the hook with proper control
  const {
    data,
    isLoading: apiLoading,
    error: apiError,
    refetch,
  } = useTokenBalances(
    walletAddress,
    {
      network_id: selectedNetwork,
      page_size: pageSize,
      page: page,
    },
    { skip: !shouldFetch }, // Only fetch when explicitly triggered
  );

  // Handle data changes without causing infinite loops
  useEffect(() => {
    // Prevent processing if we're already handling data or no data exists
    if (!data || processingData.current) return;

    // Set the processing flag to prevent re-entry
    processingData.current = true;

    try {
      console.log("📊 Received balances data from hook:", data);
      setIsLoading(false);

      // Check if data is an object with a data property
      if (data && typeof data === "object" && "data" in data && Array.isArray((data as any).data)) {
        const balancesArray = (data as any).data;
        console.log("📊 Setting balances from nested data array:", balancesArray.length);

        // Normalize the data to ensure consistent property names
        const normalizedBalances = balancesArray.map((balance: any) => {
          // Log original contract properties
          console.log("Original token data:", {
            contract_address: balance.contract_address,
            contract: balance.contract,
            address: balance.address,
          });

          const normalized = {
            contract_address: balance.contract_address || balance.contract || balance.address || "",
            amount: balance.amount || balance.balance || "0",
            symbol: balance.symbol || "Unknown",
            decimals: balance.decimals || 18,
            name: balance.name || balance.token_name || balance.symbol || "Unknown Token",
            amount_usd: balance.amount_usd || balance.value_usd || balance.value || 0,
            network_id: balance.network_id || selectedNetwork,
          };

          console.log("Normalized contract_address:", normalized.contract_address);
          return normalized;
        });

        setBalances(normalizedBalances);
      }
      // Check if data is directly an array
      else if (Array.isArray(data)) {
        console.log("📊 Setting balances from direct data array:", data.length);

        // Normalize the data to ensure consistent property names
        const normalizedBalances = data.map((balance: any) => {
          // Log original contract properties
          console.log("Original token data:", {
            contract_address: balance.contract_address,
            contract: balance.contract,
            address: balance.address,
          });

          const normalized = {
            contract_address: balance.contract_address || balance.contract || balance.address || "",
            amount: balance.amount || balance.balance || "0",
            symbol: balance.symbol || "Unknown",
            decimals: balance.decimals || 18,
            name: balance.name || balance.token_name || balance.symbol || "Unknown Token",
            amount_usd: balance.amount_usd || balance.value_usd || balance.value || 0,
            network_id: balance.network_id || selectedNetwork,
          };

          console.log("Normalized contract_address:", normalized.contract_address);
          return normalized;
        });

        setBalances(normalizedBalances);
      }
      // Handle other cases
      else {
        console.log("No valid data found in response");
        setBalances([]);
      }
    } catch (err) {
      console.error("Error processing data from hook:", err);
      setBalances([]);
    } finally {
      // Always release the processing flag after handling the data
      setTimeout(() => {
        processingData.current = false;
      }, 100);
    }
  }, [data]);

  // Handle API errors separately
  useEffect(() => {
    if (!apiError) return;

    setIsLoading(false);
    console.error("❌ API error from hook:", apiError);
    setError(typeof apiError === "string" ? apiError : "Failed to fetch balances");
  }, [apiError]);

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);

    // Reset state
    setBalances([]);
    setError(null);
    setShouldFetch(false);
  };

  // Trigger fetch using direct API call
  const fetchBalances = async () => {
    if (!walletAddress) {
      setError("Please enter an address");
      return;
    }

    // Reset state before fetching
    setError(null);
    setBalances([]);
    setIsLoading(true);
    processingData.current = false;

    // Enable fetching via the hook
    setShouldFetch(true);

    try {
      // Optionally manually refetch the data
      await refetch?.();
    } catch (err) {
      console.error("Error triggering refetch:", err);
    }
  };

  // Format balance value with token decimals
  const formatBalance = (balance: TokenBalance) => {
    if (!balance.amount || balance.decimals === undefined) return "0";

    try {
      // Convert from wei to token units
      const value = Number(balance.amount) / Math.pow(10, balance.decimals);
      // Format with appropriate decimal places
      return value.toLocaleString(undefined, {
        maximumFractionDigits: Math.min(balance.decimals, 6),
        minimumFractionDigits: 0,
      });
    } catch (e) {
      console.error("Error formatting balance:", e);
      return balance.amount;
    }
  };

  return (
    <details className="collapse bg-blue-500/20 shadow-lg mb-4 rounded-xl border border-blue-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>💰 Token Balances - Check token balances for any address</span>
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
                    <span className="label-text text-xl font-bold">Enter Ethereum Address</span>
                  </label>
                  <AddressInput value={walletAddress} onChange={setWalletAddress} placeholder="Enter any address" />
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
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={fetchBalances}
                  disabled={isLoading || !walletAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch Balances"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading token balances on {getNetworkName(selectedNetwork)}...</span>
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

          {!isLoading && !error && walletAddress && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">Token Balances on {getNetworkName(selectedNetwork)}</h2>
                <div className="flex flex-col gap-2">
                  {balances && balances.length > 0 ? (
                    balances.map((token, index) => {
                      console.log(`Rendering token ${index}:`, token);
                      return (
                        <div key={`${token.contract_address}-${index}`} className="card bg-base-200 shadow-sm">
                          <div className="card-body p-4">
                            <div className="flex flex-col">
                              <div className="text-lg font-semibold">{token.symbol || "Unknown Token"}</div>
                              <div className="text-xl">
                                {formatBalance(token)} {token.symbol}
                              </div>
                              {token.amount_usd && (
                                <div className="text-sm text-success">${token.amount_usd.toFixed(2)}</div>
                              )}
                              <div className="text-xs opacity-70 mt-2">
                                Contract:{" "}
                                {token.contract_address ? (
                                  <Address address={token.contract_address} format="short" />
                                ) : (
                                  "Unknown contract address"
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
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
                      <span>No token balances found for this address on {getNetworkName(selectedNetwork)}</span>
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
