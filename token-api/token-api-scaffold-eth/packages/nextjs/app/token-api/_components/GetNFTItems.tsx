"use client";

import { useEffect, useRef, useState } from "react";
import { EVM_NETWORKS, getNetworkName } from "~~/app/token-api/_config/networks";
import { NFTItem, NFTItemsResponse, useNFTItems } from "~~/app/token-api/_hooks/useNFTItems";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import { AddressInput } from "~~/components/scaffold-eth";

export const GetNFTItems = ({ isOpen = false }: { isOpen?: boolean }) => {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [tokenId, setTokenId] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [item, setItem] = useState<NFTItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shouldFetch, setShouldFetch] = useState<boolean>(false);
  const processingData = useRef(false);

  const {
    data,
    isLoading: apiLoading,
    error: apiError,
    refetch,
  } = useNFTItems({
    contractAddress: contractAddress,
    tokenId: tokenId,
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
      console.log("🖼️ Received NFT item data from hook:", data);
      if (Array.isArray(data) && data.length > 0) {
        setItem(data[0]);
        console.log("✅ Successfully processed NFT item:", data[0].name || `Token #${data[0].token_id}`);
      } else {
        console.log("No valid item data found in response or data array empty");
        setItem(null);
      }
    } catch (err) {
      console.error("Error processing NFT item data:", err);
      setItem(null);
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
    console.error("❌ API error from hook (NFT Item):", apiError);
    setError(typeof apiError === "string" ? apiError : (apiError as Error)?.message || "Failed to fetch NFT item");
  }, [apiError]);

  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setItem(null);
    setError(null);
    setShouldFetch(false);
  };

  const fetchItem = async () => {
    if (!contractAddress || !tokenId) {
      setError("Please enter both contract address and token ID");
      setIsLoading(false);
      return;
    }
    setError(null);
    setItem(null);
    setIsLoading(true);
    processingData.current = false;
    setShouldFetch(true);
  };

  return (
    <details className="collapse bg-teal-500/20 shadow-lg mb-4 rounded-xl border border-teal-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>🧩 NFT Item - Get details for a specific NFT</span>
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
                    <span className="label-text text-xl font-bold">Enter Token ID</span>
                  </label>
                  <input
                    type="text"
                    value={tokenId}
                    onChange={e => setTokenId(e.target.value)}
                    placeholder="Enter token ID (e.g., 888)"
                    className="input input-bordered w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">e.g., 1 or 888</p>
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
                  onClick={fetchItem}
                  disabled={isLoading || !contractAddress || !tokenId}
                >
                  {isLoading ? "Fetching..." : "Fetch Item"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>
                Loading NFT item {tokenId} from {contractAddress} on {getNetworkName(selectedNetwork)}...
              </span>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <span>Error: {error}</span>
            </div>
          )}

          {!isLoading && !error && item && (
            <div className="card bg-base-100 shadow-xl mt-4">
              <div className="card-body">
                <h3 className="text-lg font-bold">NFT Item Result:</h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <tbody>
                      <tr>
                        <td className="font-medium">Token ID</td>
                        <td>{item.token_id}</td>
                      </tr>
                      <tr>
                        <td className="font-medium">Standard</td>
                        <td>{item.token_standard}</td>
                      </tr>
                      <tr>
                        <td className="font-medium">Name</td>
                        <td>{item.name || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="font-medium">Symbol</td>
                        <td>{item.symbol || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="font-medium">Contract</td>
                        <td>
                          <AddressInput value={item.contract} onChange={() => {}} placeholder="Contract" />
                        </td>
                      </tr>
                      <tr>
                        <td className="font-medium">Owner</td>
                        <td>
                          <AddressInput value={item.owner} onChange={() => {}} placeholder="Owner" />
                        </td>
                      </tr>
                      {item.image && (
                        <tr>
                          <td className="font-medium">Image</td>
                          <td>
                            <img
                              src={item.image}
                              alt={`NFT ${item.name || item.token_id}`}
                              className="h-40 w-40 object-contain rounded"
                            />
                          </td>
                        </tr>
                      )}
                      {item.description && (
                        <tr>
                          <td className="font-medium">Description</td>
                          <td>{item.description}</td>
                        </tr>
                      )}
                      {item.uri && (
                        <tr>
                          <td className="font-medium">Token URI</td>
                          <td>
                            <a href={item.uri} target="_blank" rel="noopener noreferrer" className="link link-primary">
                              View URI
                            </a>
                          </td>
                        </tr>
                      )}
                      {item.attributes && item.attributes.length > 0 && (
                        <tr>
                          <td className="font-medium align-top">Attributes</td>
                          <td>
                            <div className="grid grid-cols-2 gap-2">
                              {item.attributes.map((attr, idx) => (
                                <div key={idx} className="badge badge-outline p-3">
                                  <span className="font-semibold mr-1">{attr.trait_type}:</span> {attr.value}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="font-medium">Network</td>
                        <td>{getNetworkName(item.network_id)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {!isLoading && !error && !item && shouldFetch && (
            <div className="alert alert-info mt-4">
              <span>
                No NFT item found for contract {contractAddress}, token ID {tokenId}, on{" "}
                {getNetworkName(selectedNetwork)}.
              </span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
