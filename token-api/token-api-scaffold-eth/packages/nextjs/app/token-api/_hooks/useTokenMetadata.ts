"use client";

import { NetworkId, useTokenApi } from "./useTokenApi";

/**
 * Token metadata information
 */
export interface TokenMetadata {
  contract_address?: string;
  address?: string; // Alternative property name for contract_address
  name?: string;
  symbol?: string;
  decimals?: number;
  total_supply?: string;
  circulating_supply?: string;
  block_number?: number;
  block_num?: number; // Alternative property name for block_number
  timestamp?: string;
  datetime?: string; // Alternative format for timestamp
  date?: string; // Another alternative for timestamp
  block_timestamp?: number;
  holders?: number;
  logo_url?: string;
  icon?: {
    web3icon?: string;
  };
  network_id?: NetworkId;
  market_data?: {
    price_usd: number;
    price_change_percentage_24h?: number;
    market_cap?: number;
    total_volume_24h?: number;
  };
  // For handling responses that contain nested data arrays
  data?: TokenMetadata[];
}

/**
 * Parameters for token metadata API call
 */
export interface TokenMetadataParams {
  network_id?: NetworkId;
  include_market_data?: boolean;
}

/**
 * Hook to fetch token metadata
 *
 * @param contract - Token contract address
 * @param params - Optional parameters
 * @param options - Hook options
 * @returns Token metadata and functions
 *
 * @example
 * ```typescript
 * const {
 *   data: tokenData,
 *   isLoading,
 *   error
 * } = useTokenMetadata("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", {
 *   network_id: "mainnet"
 * });
 * ```
 */
export const useTokenMetadata = (
  contract: string | undefined,
  params?: TokenMetadataParams,
  options = { skip: contract ? false : true },
) => {
  // Normalize the contract address (ensure it has 0x prefix)
  const normalizedContract = contract && !contract.startsWith("0x") ? `0x${contract}` : contract;

  const result = useTokenApi<any>(normalizedContract ? `tokens/evm/${normalizedContract}` : "", { ...params }, options);

  // Debug the raw response
  if (result.data) {
    console.log("💡 Raw token metadata response:", result.data);
  }

  // Handle the various response formats properly
  let formattedData: TokenMetadata | null = null;

  if (result.data) {
    // Case 1: Response is an array directly (as seen in the logs)
    if (Array.isArray(result.data) && result.data.length > 0) {
      formattedData = result.data[0];
    }
    // Case 2: Response is an object with data array property
    else if (
      typeof result.data === "object" &&
      "data" in result.data &&
      Array.isArray(result.data.data) &&
      result.data.data.length > 0
    ) {
      formattedData = result.data.data[0];
    }
    // Case 3: Response is already the token metadata object
    else if (typeof result.data === "object") {
      formattedData = result.data as TokenMetadata;
    }
  }

  console.log("💡 Formatted token metadata:", formattedData);

  return {
    ...result,
    data: formattedData,
  };
};
