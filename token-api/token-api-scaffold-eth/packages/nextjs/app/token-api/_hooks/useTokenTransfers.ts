"use client";

import { useTokenApi } from "./useTokenApi";
import type { NetworkId } from "./useTokenApi";

/**
 * Token transfer information
 */
export interface TokenTransfer {
  token_address: string;
  token_id?: string;
  from_address: string;
  to_address: string;
  value: string;
  value_display?: string;
  value_usd?: number;
  tx_hash: string;
  tx_index: number;
  block_number: number;
  block_timestamp: number;
  log_index: number;
  type: "erc20" | "erc721" | "erc1155";
}

/**
 * Alternative token transfer structure from API
 */
export interface TokenTransferItem {
  block_num: number;
  datetime?: string;
  timestamp?: number;
  date?: string;
  contract: string;
  from: string;
  to: string;
  amount: string;
  value?: number;
  transaction_id: string;
  decimals: number;
  symbol: string;
  network_id: string;
  price_usd?: number;
  value_usd?: number;
}

/**
 * Token transfers API response
 */
export interface TokenTransfersResponse {
  data: TokenTransferItem[];
  transfers?: TokenTransfer[];
  statistics?: {
    bytes_read: number;
    rows_read: number;
    elapsed: number;
  };
  pagination?: {
    page: number;
    page_size: number;
    total_pages: number;
  };
  results?: number;
  total_results?: number;
}

/**
 * Parameters for token transfers API call
 */
export interface TokenTransfersParams {
  network_id?: NetworkId; // Network ID (mainnet, arbitrum-one, base, bsc, matic, optimism)
  from?: string; // Filter by from address
  to?: string; // Filter by to address
  age?: number; // Number of days to look back (1-180, default: 30)
  contract?: string; // Filter by contract address
  limit?: number; // Maximum number of items returned (1-500, default: 10)
  page?: number; // Page number of results (≥ 1, default: 1)

  // The following parameters are optional and may be supported
  low_liquidity?: boolean; // Include low liquidity tokens
  start_date?: string; // Start date for filtering in ISO format
  end_date?: string; // End date for filtering in ISO format
  include_prices?: boolean; // Include price information
}

/**
 * Hook to fetch token transfers
 *
 * @param address - Wallet address to query for transfers
 * @param params - Optional parameters
 * @param options - Hook options
 * @returns Token transfers data and functions
 */
export const useTokenTransfers = (
  address: string | undefined, // This address will be used as the 'to' parameter
  params?: TokenTransfersParams,
  options = { skip: address ? false : true },
) => {
  // Normalize the address (ensure it has 0x prefix) - this might not be needed for query params directly
  // const normalizedAddress = address && !address.startsWith("0x") ? `0x${address}` : address;

  const endpoint = "transfers/evm"; // Path as per The Graph docs

  // Prepare params for useTokenApi.
  // The input 'address' is used as the 'to' parameter.
  // User can also provide 'from', 'contract', 'limit' etc., via the 'params' object.
  const queryParams: Record<string, any> = {
    ...params, // Spread other parameters first
    to: address, // Set/override 'to' with the main address argument
    network_id: params?.network_id, // Ensure network_id is passed
  };

  // Remove undefined keys to keep URL clean, useTokenApi also does this but good practice here too.
  Object.keys(queryParams).forEach(key => {
    if (queryParams[key] === undefined) {
      delete queryParams[key];
    }
  });

  // If the main 'address' (used for 'to') is undefined, we should probably skip.
  // The options.skip already handles if address is undefined at the hook call level.
  // However, if 'to' is explicitly set to undefined in params and address is also undefined,
  // the query might be malformed or too broad.
  // For now, useTokenApi will strip undefined values.

  // Call the base API hook with the proper parameters
  const result = useTokenApi<TokenTransfersResponse>(endpoint, queryParams, options);

  return result;
};
