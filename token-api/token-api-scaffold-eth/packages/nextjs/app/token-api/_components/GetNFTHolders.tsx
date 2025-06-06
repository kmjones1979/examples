"use client";

import { useEffect, useRef, useState } from "react";
import { EVM_NETWORKS, getNetworkName } from "~~/app/token-api/_config/networks";
import { NFTHolder, useNFTHolders } from "~~/app/token-api/_hooks/useNFTHolders";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import { AddressInput } from "~~/components/scaffold-eth";

export const GetNFTHolders = ({ isOpen = true }: { isOpen?: boolean }) => {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [holders, setHolders] = useState<NFTHolder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shouldFetch, setShouldFetch] = useState<boolean>(false);
  const processingData = useRef(false);

  const {
    data,
    isLoading: apiLoading,
    error: apiError,
    refetch,
  } = useNFTHolders({
    contractAddress: contractAddress,
    network: selectedNetwork,
    enabled: shouldFetch,
  });

  useEffect(() => {
    if (apiLoading) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoading(false);
    }
  }, [apiLoading]);

  useEffect(() => {
    if (!data || processingData.current) return;
    processingData.current = true;

    try {
      console.log("👥 Received NFT holders data from hook:", data);
      // The useTokenApi hook already extracts the data array from the API response
      if (Array.isArray(data) && data.length > 0) {
        setHolders(data);
        console.log("✅ Successfully processed NFT holders:", data.length, "holders found");
      } else {
        console.log("No valid holders data found in response. Data structure:", typeof data, data);
        setHolders([]);
      }
    } catch (err) {
      console.error("Error processing NFT holders data:", err);
      setHolders([]);
    } finally {
      setTimeout(() => {
        processingData.current = false;
      }, 100);
    }
  }, [data]);

  useEffect(() => {
    if (!apiError) {
      setError(null);
      return;
    }
    console.error("❌ API error from hook (NFT Holders):", apiError);
    setError(typeof apiError === "string" ? apiError : (apiError as Error)?.message || "Failed to fetch NFT holders");
  }, [apiError]);

  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setHolders([]);
    setError(null);
    setShouldFetch(false);
  };

  const fetchHolders = async () => {
    if (!contractAddress) {
      setError("Please enter a contract address");
      setIsLoading(false);
      return;
    }
    setError(null);
    setHolders([]);
    setIsLoading(true);
    processingData.current = false;
    setShouldFetch(true);
  };

  const formatPercentage = (percentage: number): string => {
    return `${(percentage * 100).toFixed(4)}%`;
  };

  const formatQuantity = (quantity: number): string => {
    return quantity.toLocaleString();
  };

  return (
    <details className="collapse bg-purple-500/20 shadow-lg mb-4 rounded-xl border border-purple-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>👥 NFT Holders - Get holders for a contract</span>
        </div>
      </summary>
      <div className="collapse-content">
        <div className="flex flex-col gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <label className="label">
                    <span className="label-text text-xl font-bold">Enter Contract Address</span>
                  </label>
                  <AddressInput
                    value={contractAddress}
                    onChange={setContractAddress}
                    placeholder="Enter NFT contract address"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    e.g., 0xBd3531dA5CF5857e7CfAA92426877b022e612cf8 (Pudgy Penguins)
                  </p>
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
              <span>
                Loading NFT holders for {contractAddress} on {getNetworkName(selectedNetwork)}...
              </span>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <span>Error: {error}</span>
            </div>
          )}

          {!isLoading && !error && holders.length > 0 && (
            <div className="card bg-base-100 shadow-xl mt-4">
              <div className="card-body">
                <h3 className="text-lg font-bold">NFT Holders ({holders.length} found):</h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Holder Address</th>
                        <th>Token Standard</th>
                        <th>Quantity</th>
                        <th>Unique Tokens</th>
                        <th>Percentage</th>
                        <th>Network</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holders.map((holder, index) => (
                        <tr key={holder.address} className="hover">
                          <td className="font-medium">{index + 1}</td>
                          <td>
                            <AddressInput value={holder.address} onChange={() => {}} placeholder="Holder Address" />
                          </td>
                          <td>
                            <div className="badge badge-outline">{holder.token_standard}</div>
                          </td>
                          <td className="font-mono">
                            <div className="stat-value text-sm">{formatQuantity(holder.quantity)}</div>
                          </td>
                          <td className="font-mono">
                            <div className="stat-value text-sm">{formatQuantity(holder.unique_tokens)}</div>
                          </td>
                          <td>
                            <div className="badge badge-secondary">{formatPercentage(holder.percentage)}</div>
                          </td>
                          <td>
                            <div className="badge badge-primary">{getNetworkName(holder.network_id)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && holders.length === 0 && shouldFetch && (
            <div className="alert alert-info">
              <span>No holders found for the specified contract on {getNetworkName(selectedNetwork)}.</span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
