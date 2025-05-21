"use client";

import { useEffect, useRef, useState } from "react";
import { EVM_NETWORKS, getNetworkName } from "~~/app/token-api/_config/networks";
import {
  NFTActivitiesResponse,
  NFTActivity,
  UseNFTActivitiesOptions,
  useNFTActivities,
} from "~~/app/token-api/_hooks/useNFTActivities";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import { AddressInput } from "~~/components/scaffold-eth";

// Mock activity types - These are for client-side conceptual filtering if desired.
// The API's '@type' filter takes one of: "TRANSFER", "MINT", "BURN".
// The 'sale' type is not directly in the schema's '@type' enum for this endpoint.
const CLIENT_ACTIVITY_TYPES = [
  { id: "MINT", name: "Mint" },
  { id: "TRANSFER", name: "Transfer" },
  { id: "BURN", name: "Burn" },
  // { id: "sale", name: "Sale" }, // 'sale' is not a direct @type in the schema for activities
];

export const GetNFTActivities = ({ isOpen = false }: { isOpen?: boolean }) => {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [activities, setActivities] = useState<NFTActivity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shouldFetch, setShouldFetch] = useState<boolean>(false);
  const processingData = useRef(false);

  // Filter states - updated to match hook options
  const [anyAddress, setAnyAddress] = useState<string>("");
  const [fromAddress, setFromAddress] = useState<string>("");
  const [toAddress, setToAddress] = useState<string>("");
  const [contractAddress, setContractAddress] = useState<string>("");
  const [selectedActivityType, setSelectedActivityType] = useState<string>("");

  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [orderBy, setOrderBy] = useState<"timestamp">("timestamp");
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("desc");
  const [limit, setLimit] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const buildOptions = (): UseNFTActivitiesOptions => {
    const options: UseNFTActivitiesOptions = { network: selectedNetwork, enabled: shouldFetch, limit, page };
    if (anyAddress) options.any = anyAddress;
    if (fromAddress) options.from = fromAddress;
    if (toAddress) options.to = toAddress;
    if (contractAddress) options.contract_address = contractAddress;
    if (startTime) options.startTime = parseInt(startTime, 10);
    if (endTime) options.endTime = parseInt(endTime, 10);
    if (orderBy) options.orderBy = orderBy;
    if (orderDirection) options.orderDirection = orderDirection;

    return options;
  };

  const { data, isLoading: apiLoading, error: apiError, refetch } = useNFTActivities(buildOptions());

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
      console.log("📜 Received NFT activities data from hook:", data);
      if (data?.data) {
        setActivities(data.data);
      } else {
        console.log("No valid activities data found in response");
        setActivities([]);
      }
    } catch (err) {
      console.error("Error processing NFT activities data:", err);
      setActivities([]);
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
    console.error("❌ API error from hook (NFT Activities):", apiError);
    setError(
      typeof apiError === "string" ? apiError : (apiError as Error)?.message || "Failed to fetch NFT activities",
    );
  }, [apiError]);

  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setActivities([]);
    setError(null);
    setPage(1);
    setShouldFetch(false);
  };

  const fetchActivities = async () => {
    setError(null);
    setActivities([]);
    setPage(1);
    setIsLoading(true);
    processingData.current = false;
    setShouldFetch(true);
  };

  useEffect(() => {
    if (shouldFetch) {
    }
  }, [shouldFetch]);

  return (
    <details className="collapse bg-orange-500/20 shadow-lg mb-4 rounded-xl border border-orange-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>📊 NFT Activities - View NFT event history</span>
        </div>
      </summary>
      <div className="collapse-content">
        <div className="flex flex-col gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="text-xl font-semibold mb-2">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Any Address (From/To/Contract)</span>
                  </label>
                  <AddressInput value={anyAddress} onChange={setAnyAddress} placeholder="Optional" />
                  <p className="text-sm text-gray-500 mt-1">e.g., 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">From Address (Optional)</span>
                  </label>
                  <AddressInput value={fromAddress} onChange={setFromAddress} placeholder="Optional" />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">To Address (Optional)</span>
                  </label>
                  <AddressInput value={toAddress} onChange={setToAddress} placeholder="Optional" />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Contract Address (Optional)</span>
                  </label>
                  <AddressInput
                    value={contractAddress}
                    onChange={setContractAddress}
                    placeholder="Filter by contract"
                  />
                  <p className="text-sm text-gray-500 mt-1">e.g., 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D</p>
                </div>

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
                    <span className="label-text">Activity Type (API: @type - Optional)</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={selectedActivityType}
                    onChange={e => setSelectedActivityType(e.target.value)}
                  >
                    <option value="">Any</option>
                    {CLIENT_ACTIVITY_TYPES.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    API filters by a single @type. For multiple, filter results client-side.
                  </p>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Start Time (Unix Timestamp)</span>
                  </label>
                  <input
                    type="number"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    placeholder="Optional (e.g., 1672531200)"
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">End Time (Unix Timestamp)</span>
                  </label>
                  <input
                    type="number"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    placeholder="Optional (e.g., 1675209600)"
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Order By</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={orderBy}
                    onChange={e => setOrderBy(e.target.value as "timestamp")}
                  >
                    <option value="timestamp">Timestamp</option>
                  </select>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Order Direction</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={orderDirection}
                    onChange={e => setOrderDirection(e.target.value as "asc" | "desc")}
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Limit</span>
                  </label>
                  <input
                    type="number"
                    value={limit}
                    onChange={e => setLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    placeholder="Number of items (1-1000)"
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
                  onClick={fetchActivities}
                  disabled={isLoading}
                >
                  {isLoading ? "Fetching..." : "Fetch Activities"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading NFT activities on {getNetworkName(selectedNetwork)}...</span>
            </div>
          )}
          {error && (
            <div className="alert alert-error">
              <span>Error: {error}</span>
            </div>
          )}

          {!isLoading && !error && activities.length > 0 && (
            <div className="card bg-base-100 shadow-xl mt-4">
              <div className="card-body">
                <h3 className="text-lg font-bold">NFT Activities Results ({activities.length}):</h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Type (@type)</th>
                        <th>Timestamp</th>
                        <th>Tx Hash</th>
                        <th>Contract</th>
                        <th>Token ID</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((activity, index) => (
                        <tr key={`${activity.tx_hash}-${index}`}>
                          <td>{activity["@type"]}</td>
                          <td>{new Date(activity.timestamp).toLocaleString()}</td>
                          <td>
                            <AddressInput value={activity.tx_hash} onChange={() => {}} placeholder="TX Hash" />
                          </td>
                          <td>
                            <AddressInput value={activity.contract} onChange={() => {}} placeholder="Contract" />
                          </td>
                          <td>{activity.token_id}</td>
                          <td>
                            <AddressInput value={activity.from} onChange={() => {}} placeholder="From" />
                          </td>
                          <td>
                            <AddressInput value={activity.to} onChange={() => {}} placeholder="To" />
                          </td>
                          <td>{activity.amount}</td>
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
                    disabled={activities.length < limit}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
          {!isLoading && !error && activities.length === 0 && shouldFetch && (
            <div className="alert alert-info mt-4">
              <span>No NFT activities found for the selected filters.</span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
