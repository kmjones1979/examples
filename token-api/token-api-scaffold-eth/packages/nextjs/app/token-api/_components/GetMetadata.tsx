"use client";

import { useEffect, useRef, useState } from "react";
import { estimateDateFromBlock } from "~~/app/token-api/_config/blockTimeUtils";
import { getExampleTokenAddress } from "~~/app/token-api/_config/exampleTokens";
import { EVM_NETWORKS, getNetworkName } from "~~/app/token-api/_config/networks";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import { TokenMetadata, useTokenMetadata } from "~~/app/token-api/_hooks/useTokenMetadata";
import { Address, AddressInput } from "~~/components/scaffold-eth";

export const GetMetadata = ({ isOpen = false }: { isOpen?: boolean }) => {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [error, setError] = useState<string | null>(null);
  const [shouldFetch, setShouldFetch] = useState<boolean>(false);
  const processingData = useRef(false);

  // Use the hook with proper control
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
    { skip: !shouldFetch }, // Skip initial fetch until explicitly triggered
  );

  // Handle API errors separately
  useEffect(() => {
    if (!hookError) return;

    console.error("❌ API error from hook:", hookError);
    const errorMessage = typeof hookError === "string" ? hookError : "Failed to fetch token metadata";

    // Custom error message for 404 responses
    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      setError(`No metadata found for this token contract. Please verify:
        1. The contract address is correct
        2. The contract is an ERC20 token
        3. The selected network is correct (currently: ${getNetworkName(selectedNetwork)})
        
        Try using example token: ${getExampleTokenAddress(selectedNetwork)}`);
    } else {
      setError(errorMessage);
    }
  }, [hookError, selectedNetwork]);

  // Handle network change
  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setError(null);
    setShouldFetch(false);
  };

  const fetchMetadata = async () => {
    if (!contractAddress) {
      setError("Please enter a contract address");
      return;
    }

    // Basic validation for Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      setError("Please enter a valid ERC20 contract address");
      return;
    }

    // Reset state before fetching
    setError(null);
    processingData.current = false;
    setShouldFetch(true);

    try {
      // Use the refetch function from the hook
      await refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("❌ Error fetching metadata:", err);
      setError(errorMessage);
    }
  };

  // Format large numbers with commas
  const formatNumber = (num: string | number) => {
    return new Intl.NumberFormat().format(Number(num));
  };

  // Format supply with decimals
  const formatSupply = (supply: string, decimals: number | undefined) => {
    const actualDecimals = decimals || 18; // Default to 18 if undefined
    const amount = Number(supply) / Math.pow(10, actualDecimals);
    return formatNumber(amount.toFixed(2));
  };

  return (
    <details className="collapse bg-blue-500/20 shadow-lg mb-4 rounded-xl border border-blue-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>🔍 Token Metadata - Get detailed information about any ERC20 token</span>
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
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={fetchMetadata}
                  disabled={isLoading || !contractAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch Metadata"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading token metadata on {getNetworkName(selectedNetwork)}...</span>
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

          {!isLoading && !error && tokenData && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                  {tokenData.icon?.web3icon && (
                    <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{tokenData.icon.web3icon}</span>
                    </div>
                  )}
                  {tokenData.logo_url && (
                    <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center flex-shrink-0">
                      <img src={tokenData.logo_url} alt="Token logo" className="w-10 h-10 rounded-full" />
                    </div>
                  )}
                  <div className="flex-grow min-w-0">
                    <h2 className="card-title text-2xl">{tokenData.name}</h2>
                    <p className="text-lg opacity-70">{tokenData.symbol}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="stat bg-base-200 rounded-box p-4">
                    <div className="stat-title">Contract Address</div>
                    <div className="stat-value text-base break-all font-mono">
                      {tokenData.contract_address || tokenData.address || contractAddress ? (
                        <Address address={tokenData.contract_address || tokenData.address || contractAddress} />
                      ) : (
                        "Unknown contract address"
                      )}
                    </div>
                  </div>

                  <div className="stat bg-base-200 rounded-box p-4">
                    <div className="stat-title">Network</div>
                    <div className="stat-value">{getNetworkName(tokenData.network_id || selectedNetwork)}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="stat bg-base-200 rounded-box p-4">
                      <div className="stat-title">Circulating Supply</div>
                      <div className="stat-value text-primary text-2xl sm:text-3xl break-all">
                        {formatSupply(
                          tokenData.circulating_supply || tokenData.total_supply || "0",
                          tokenData.decimals,
                        )}
                      </div>
                      <div className="stat-desc">Decimals: {tokenData.decimals}</div>
                    </div>

                    <div className="stat bg-base-200 rounded-box p-4">
                      <div className="stat-title">Total Holders</div>
                      <div className="stat-value text-secondary">{formatNumber(tokenData.holders || 0)}</div>
                    </div>

                    {tokenData.market_data?.price_usd && (
                      <div className="stat bg-base-200 rounded-box p-4">
                        <div className="stat-title">Price (USD)</div>
                        <div className="stat-value">${tokenData.market_data.price_usd.toFixed(4)}</div>
                        {tokenData.market_data.price_change_percentage_24h && (
                          <div
                            className={`stat-desc ${tokenData.market_data.price_change_percentage_24h >= 0 ? "text-success" : "text-error"}`}
                          >
                            {tokenData.market_data.price_change_percentage_24h >= 0 ? "↗︎" : "↘︎"}
                            {tokenData.market_data.price_change_percentage_24h.toFixed(2)}% (24h)
                          </div>
                        )}
                      </div>
                    )}

                    {tokenData.market_data?.market_cap && (
                      <div className="stat bg-base-200 rounded-box p-4">
                        <div className="stat-title">Market Cap (USD)</div>
                        <div className="stat-value text-2xl sm:text-3xl break-all">
                          ${formatNumber(tokenData.market_data.market_cap.toFixed(2))}
                        </div>
                      </div>
                    )}

                    {tokenData.market_data?.total_volume_24h && (
                      <div className="stat bg-base-200 rounded-box p-4">
                        <div className="stat-title">24h Volume (USD)</div>
                        <div className="stat-value">
                          ${formatNumber(tokenData.market_data.total_volume_24h.toFixed(2))}
                        </div>
                      </div>
                    )}

                    <div className="stat bg-base-200 rounded-box p-4">
                      <div className="stat-title">Last Updated</div>
                      <div className="stat-value text-base">
                        {tokenData.block_timestamp
                          ? new Date(tokenData.block_timestamp * 1000).toLocaleString()
                          : tokenData.timestamp
                            ? new Date(tokenData.timestamp.replace(" ", "T")).toLocaleString()
                            : tokenData.datetime || tokenData.date
                              ? new Date((tokenData.datetime || tokenData.date) as string).toLocaleString()
                              : estimateDateFromBlock(
                                  tokenData.block_number || tokenData.block_num || 0,
                                  tokenData.network_id || selectedNetwork,
                                ).toLocaleString()}
                      </div>
                      <div className="stat-desc">
                        Block: {tokenData.block_number || tokenData.block_num || "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
