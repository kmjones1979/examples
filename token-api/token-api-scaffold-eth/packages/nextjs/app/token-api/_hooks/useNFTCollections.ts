"use client";

import type { NetworkId } from "./useTokenApi";
import { useTokenApi } from "./useTokenApi";

export interface NFTCollection {
  contract: string;
  contract_creation: string;
  contract_creator: string;
  symbol: string;
  name: string;
  base_uri?: string; // Optional as per schema example, not in required list
  total_supply: number;
  owners: number;
  total_transfers: number;
  network_id: NetworkId;
}

export interface NFTCollectionsResponse {
  data: NFTCollection[];
  statistics?: {
    elapsed?: number;
    rows_read?: number;
    bytes_read?: number;
  };
}

export interface UseNFTCollectionsOptions {
  contractAddress: string; // Changed from contract to contractAddress for clarity
  network?: NetworkId;
  enabled?: boolean;
}

/**
 * React hook to get NFT collections for a specific contract
 */
export function useNFTCollections(options: UseNFTCollectionsOptions) {
  const { contractAddress, network, enabled = true } = options;

  const endpoint = `nft/collections/evm/${contractAddress}`;

  return useTokenApi<NFTCollectionsResponse>(
    endpoint,
    {
      network_id: network,
    },
    {
      // Skip if contractAddress is not provided, or if the hook is disabled
      skip: !contractAddress || !enabled,
    },
  );
}
