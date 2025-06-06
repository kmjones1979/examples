"use client";

import { useEffect, useRef, useState } from "react";
import { EVM_NETWORKS, getNetworkName } from "~~/app/token-api/_config/networks";
import {
  NFTOwnership,
  NFTOwnershipsResponse,
  UseNFTOwnershipsOptions,
  useNFTOwnerships,
} from "~~/app/token-api/_hooks/useNFTOwnerships";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import { AddressInput } from "~~/components/scaffold-eth";

export const GetNFTOwnerships = ({ isOpen = false }: { isOpen?: boolean }) => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [ownerships, setOwnerships] = useState<NFTOwnership[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shouldFetch, setShouldFetch] = useState<boolean>(false);
  const processingData = useRef(false);

  const [limit, setLimit] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const buildOptions = (): UseNFTOwnershipsOptions => {
    const options: UseNFTOwnershipsOptions = {
      walletAddress: walletAddress,
      network: selectedNetwork,
      enabled: shouldFetch,
      limit,
      page,
    };
    return options;
  };

  const { data, isLoading: apiLoading, error: apiError, refetch } = useNFTOwnerships(buildOptions());

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
      console.log("OWNERSHIP Received NFT ownerships data from hook:", data);
      if (Array.isArray(data) && data.length > 0) {
        setOwnerships(data);
        console.log("✅ Successfully processed NFT ownerships:", data.length, "NFTs found");
      } else {
        console.log("No valid ownerships data found in response");
        setOwnerships([]);
      }
    } catch (err) {
      console.error("Error processing NFT ownerships data:", err);
      setOwnerships([]);
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
    console.error("❌ API error from hook (NFT Ownerships):", apiError);
    setError(
      typeof apiError === "string" ? apiError : (apiError as Error)?.message || "Failed to fetch NFT ownerships",
    );
  }, [apiError]);

  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setOwnerships([]);
    setError(null);
    setPage(1);
    setShouldFetch(false);
  };

  const fetchOwnerships = async () => {
    if (!walletAddress) {
      setError("Please enter a wallet address");
      setIsLoading(false);
      return;
    }
    setError(null);
    setOwnerships([]);
    setPage(1);
    setIsLoading(true);
    processingData.current = false;
    setShouldFetch(true);
  };

  useEffect(() => {
    if (shouldFetch && walletAddress) {
    }
  }, [limit, page, shouldFetch]);

  return (
    <details className="collapse bg-lime-500/20 shadow-lg mb-4 rounded-xl border border-lime-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>🖼️ NFT Ownerships - View NFTs owned by an address</span>
        </div>
      </summary>
      <div className="collapse-content">
        <div className="flex flex-col gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="w-full mb-4">
                <label className="label">
                  <span className="label-text text-xl font-bold">Enter Wallet Address</span>
                </label>
                <AddressInput value={walletAddress} onChange={setWalletAddress} placeholder="Enter wallet address" />
                <p className="text-sm text-gray-500 mt-1">
                  e.g., 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 (Vitalik Buterin)
                </p>
              </div>
              <h3 className="text-lg font-semibold mb-2">Optional Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Network</span>
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
                <div>
                  <label className="label">
                    <span className="label-text">Limit</span>
                  </label>
                  <input
                    type="number"
                    value={limit}
                    onChange={e => setLimit(Math.max(1, Math.min(1000, parseInt(e.target.value, 10) || 1)))}
                    placeholder="Items per page (1-1000)"
                    className="input input-bordered w-full"
                    min="1"
                    max="1000"
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Page</span>
                  </label>
                  <input
                    type="number"
                    value={page}
                    onChange={e => setPage(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    placeholder="Page number (min 1)"
                    className="input input-bordered w-full"
                    min="1"
                  />
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={fetchOwnerships}
                  disabled={isLoading || !walletAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch Ownerships"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>
                Loading NFT ownerships for {walletAddress} on {getNetworkName(selectedNetwork)}...
              </span>
            </div>
          )}
          {error && (
            <div className="alert alert-error">
              <span>Error: {error}</span>
            </div>
          )}

          {!isLoading && !error && ownerships.length > 0 && (
            <div className="card bg-base-100 shadow-xl mt-4">
              <div className="card-body">
                <h3 className="text-lg font-bold">NFT Ownerships Results ({ownerships.length}):</h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Token ID</th>
                        <th>Standard</th>
                        <th>Contract</th>
                        <th>Symbol</th>
                        <th>Network</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ownerships.map((nft, index) => (
                        <tr key={`${nft.contract}-${nft.token_id}-${index}`}>
                          <td>{nft.name || "N/A"}</td>
                          <td>{nft.token_id}</td>
                          <td>{nft.token_standard}</td>
                          <td>
                            <AddressInput value={nft.contract} onChange={() => {}} placeholder="Contract" />
                          </td>
                          <td>{nft.symbol || "N/A"}</td>
                          <td>{getNetworkName(nft.network_id)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <button className="btn btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    Previous
                  </button>
                  <span>Page {page}</span>
                  <button
                    className="btn btn-sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={ownerships.length < limit}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
          {!isLoading && !error && ownerships.length === 0 && shouldFetch && (
            <div className="alert alert-info mt-4">
              <span>No NFT ownerships found for address {walletAddress} with the current filters.</span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
