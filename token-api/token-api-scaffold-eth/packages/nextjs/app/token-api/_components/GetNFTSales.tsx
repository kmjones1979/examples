"use client";

import { useEffect, useRef, useState } from "react";
import { EVM_NETWORKS, getNetworkName } from "~~/app/token-api/_config/networks";
import { NFTSale, NFTSalesResponse, UseNFTSalesOptions, useNFTSales } from "~~/app/token-api/_hooks/useNFTSales";
import { NetworkId } from "~~/app/token-api/_hooks/useTokenApi";
import { AddressInput } from "~~/components/scaffold-eth";

export const GetNFTSales = ({ isOpen = false }: { isOpen?: boolean }) => {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("mainnet");
  const [sales, setSales] = useState<NFTSale[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shouldFetch, setShouldFetch] = useState<boolean>(false);
  const processingData = useRef(false);

  // Filter states to match UseNFTSalesOptions
  const [anyAddress, setAnyAddress] = useState<string>("");
  const [offererAddress, setOffererAddress] = useState<string>("");
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [tokenContractAddress, setTokenContractAddress] = useState<string>(""); // formerly contractAddress, maps to 'token' in API
  // tokenId and marketplace are no longer direct API filters for this endpoint
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [orderBy, setOrderBy] = useState<"timestamp">("timestamp");
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("desc");
  const [limit, setLimit] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const buildOptions = (): UseNFTSalesOptions => {
    const options: UseNFTSalesOptions = {
      network: selectedNetwork,
      enabled: shouldFetch,
      limit,
      page,
    };
    if (anyAddress) options.any = anyAddress;
    if (offererAddress) options.offerer = offererAddress;
    if (recipientAddress) options.recipient = recipientAddress;
    if (tokenContractAddress) options.token = tokenContractAddress; // Hook maps this
    if (startTime) options.startTime = parseInt(startTime, 10);
    if (endTime) options.endTime = parseInt(endTime, 10);
    if (orderBy) options.orderBy = orderBy;
    if (orderDirection) options.orderDirection = orderDirection;
    return options;
  };

  const { data, isLoading: apiLoading, error: apiError, refetch } = useNFTSales(buildOptions());

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
      console.log("🛍️ Received NFT sales data from hook:", data);
      if (Array.isArray(data) && data.length > 0) {
        setSales(data);
      } else {
        console.log("No valid sales data found in response");
        setSales([]);
      }
    } catch (err) {
      console.error("Error processing NFT sales data:", err);
      setSales([]);
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
    console.error("❌ API error from hook (NFT Sales):", apiError);
    setError(typeof apiError === "string" ? apiError : (apiError as Error)?.message || "Failed to fetch NFT sales");
  }, [apiError]);

  const handleNetworkChange = (newNetwork: string) => {
    setSelectedNetwork(newNetwork as NetworkId);
    setSales([]);
    setError(null);
    setPage(1);
    setShouldFetch(false);
  };

  const fetchSales = async () => {
    setError(null);
    setSales([]);
    setPage(1);
    setIsLoading(true);
    processingData.current = false;
    setShouldFetch(true);
  };

  useEffect(() => {
    if (shouldFetch) {
      // Hook handles refetching when options change
    }
  }, [shouldFetch]);

  return (
    <details className="collapse bg-pink-500/20 shadow-lg mb-4 rounded-xl border border-pink-500/30" open={isOpen}>
      <summary className="collapse-title text-xl font-bold cursor-pointer hover:bg-base-300">
        <div className="flex justify-between items-center">
          <span>🛒 NFT Sales - View NFT sales history</span>
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
                    <span className="label-text">Any Address (Offerer/Recipient/Token Contract)</span>
                  </label>
                  <AddressInput value={anyAddress} onChange={setAnyAddress} placeholder="Optional" />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Token Contract Address (Token)</span>
                  </label>
                  <AddressInput
                    value={tokenContractAddress}
                    onChange={setTokenContractAddress}
                    placeholder="Optional NFT Contract"
                  />
                  <p className="text-sm text-gray-500 mt-1">e.g., 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Offerer (Seller) Address</span>
                  </label>
                  <AddressInput value={offererAddress} onChange={setOffererAddress} placeholder="Optional Seller" />
                  <p className="text-sm text-gray-500 mt-1">e.g., 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Recipient (Buyer) Address</span>
                  </label>
                  <AddressInput value={recipientAddress} onChange={setRecipientAddress} placeholder="Optional Buyer" />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Start Time (Unix Timestamp)</span>
                  </label>
                  <input
                    type="number"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    placeholder="Optional"
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
                    placeholder="Optional"
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
                    placeholder="1-1000"
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
                    placeholder="Min 1"
                    className="input input-bordered w-full"
                    min="1"
                  />
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={fetchSales}
                  disabled={isLoading}
                >
                  {isLoading ? "Fetching..." : "Fetch Sales"}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="alert">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading NFT sales on {getNetworkName(selectedNetwork)}...</span>
            </div>
          )}
          {error && (
            <div className="alert alert-error">
              <span>Error: {error}</span>
            </div>
          )}

          {!isLoading && !error && sales.length > 0 && (
            <div className="card bg-base-100 shadow-xl mt-4">
              <div className="card-body">
                <h3 className="text-lg font-bold">NFT Sales Results ({sales.length}):</h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Tx Hash</th>
                        <th>Token (Contract)</th>
                        <th>Token ID</th>
                        <th>Name</th>
                        <th>Symbol</th>
                        <th>Offerer (Seller)</th>
                        <th>Recipient (Buyer)</th>
                        <th>Sale Amount</th>
                        <th>Currency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale, index) => (
                        <tr key={`${sale.tx_hash}-${index}`}>
                          <td>{new Date(sale.timestamp).toLocaleString()}</td>
                          <td>
                            <AddressInput value={sale.tx_hash} onChange={() => {}} placeholder="TX Hash" />
                          </td>
                          <td>
                            <AddressInput value={sale.token} onChange={() => {}} placeholder="Token Contract" />
                          </td>
                          <td>{sale.token_id}</td>
                          <td>{sale.name}</td>
                          <td>{sale.symbol}</td>
                          <td>
                            <AddressInput value={sale.offerer} onChange={() => {}} placeholder="Offerer" />
                          </td>
                          <td>
                            <AddressInput value={sale.recipient} onChange={() => {}} placeholder="Recipient" />
                          </td>
                          <td>{sale.sale_amount}</td>
                          <td>{sale.sale_currency}</td>
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
                  <button className="btn btn-sm" onClick={() => setPage(p => p + 1)} disabled={sales.length < limit}>
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
          {!isLoading && !error && sales.length === 0 && shouldFetch && (
            <div className="alert alert-info mt-4">
              <span>No NFT sales found for the selected filters.</span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
