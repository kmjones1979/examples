"use client";

import { useEffect, useRef, useState } from "react";
import { EVM_NETWORKS, getNetworkName } from "~~/app/token-api/_config/networks";
import { NFTCollection, NFTCollectionsResponse, useNFTCollections } from "~~/app/token-api/_hooks/useNFTCollections";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import { AddressInput } from "~~/components/scaffold-eth";

export const GetNFTCollections = ({ isOpen = true }: { isOpen?: boolean }) => {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shouldFetch, setShouldFetch] = useState<boolean>(false);
  const processingData = useRef(false);

  const {
    data,
    isLoading: apiLoading,
    error: apiError,
    refetch,
  } = useNFTCollections({
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
      console.log("🎨 Received NFT collections data from hook:", data);
      if (data?.data) {
        setCollections(data.data);
      } else {
        console.log("No valid collections data found in response");
        setCollections([]);
      }
    } catch (err) {
      console.error("Error processing NFT collections data:", err);
      setCollections([]);
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
    console.error("❌ API error from hook (NFT Collections):", apiError);
    setError(
      typeof apiError === "string" ? apiError : (apiError as Error)?.message || "Failed to fetch NFT collections",
    );
  }, [apiError]);

  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setCollections([]);
    setError(null);
    setShouldFetch(false);
  };

  const fetchCollections = async () => {
    if (!contractAddress) {
      setError("Please enter a contract address");
      setIsLoading(false);
      return;
    }
    setError(null);
    setCollections([]);
    setIsLoading(true);
    processingData.current = false;
    setShouldFetch(true);
  };

  return (
    <details className="collapse bg-purple-500/20 shadow-lg mb-4 rounded-xl border border-purple-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>🖼️ NFT Collections - Get collections for a contract</span>
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
                    placeholder="Enter contract address"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    e.g., 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D (Bored Ape Yacht Club)
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
                  onClick={fetchCollections}
                  disabled={isLoading || !contractAddress}
                >
                  {isLoading ? "Fetching..." : "Fetch Collections"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>
                Loading NFT collections for {contractAddress} on {getNetworkName(selectedNetwork)}...
              </span>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <span>Error: {error}</span>
            </div>
          )}

          {!isLoading && !error && collections.length > 0 && (
            <div className="card bg-base-100 shadow-xl mt-4">
              <div className="card-body">
                <h3 className="text-lg font-bold">NFT Collection Details:</h3>
                <div className="overflow-x-auto">
                  {collections.map((collection, cIndex) => (
                    <div key={cIndex} className="mb-4 p-4 border rounded-lg">
                      <h4 className="font-semibold text-md mb-2">Collection #{cIndex + 1}</h4>
                      <table className="table table-zebra w-full">
                        <tbody>
                          <tr>
                            <td className="font-medium">Name</td>
                            <td>{collection.name}</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Symbol</td>
                            <td>{collection.symbol}</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Contract Address</td>
                            <td>
                              <AddressInput value={collection.contract} onChange={() => {}} placeholder="Contract" />
                            </td>
                          </tr>
                          <tr>
                            <td className="font-medium">Created</td>
                            <td>{new Date(collection.contract_creation).toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Creator</td>
                            <td>
                              <AddressInput
                                value={collection.contract_creator}
                                onChange={() => {}}
                                placeholder="Creator"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="font-medium">Total Supply</td>
                            <td>{collection.total_supply.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Owners</td>
                            <td>{collection.owners.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Total Transfers</td>
                            <td>{collection.total_transfers.toLocaleString()}</td>
                          </tr>
                          {collection.base_uri && (
                            <tr>
                              <td className="font-medium">Base URI</td>
                              <td>{collection.base_uri}</td>
                            </tr>
                          )}
                          <tr>
                            <td className="font-medium">Network</td>
                            <td>{getNetworkName(collection.network_id)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {!isLoading && !error && collections.length === 0 && shouldFetch && (
            <div className="alert alert-info mt-4">
              <span>No NFT collections found for this contract ({contractAddress}) and network.</span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
