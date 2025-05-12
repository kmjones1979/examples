"use client";

import { useTokenApi } from "./useTokenApi";
import type { NetworkId } from "./useTokenApi";

/**
 * Token balance data returned from the API
 */
export interface TokenBalance {
  contract_address: string;
  amount: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  amount_usd?: number;
  price_usd?: number;
  logo_url?: string;
  icon?: {
    web3icon?: string;
  };
  network_id: NetworkId;
}

/**
 * Token balances API response
 */
export interface TokenBalancesResponse {
  data: TokenBalance[];
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
}

/**
 * Parameters for token balances API call
 */
export interface TokenBalancesParams {
  network_id?: NetworkId;
  page?: number;
  page_size?: number;
  min_amount?: string;
  contract_address?: string;
}

/**
 * Hook to fetch token balances for a specific address
 *
 * @param address - Wallet address
 * @param params - Optional filter parameters
 * @param options - Hook options
 * @returns Token balances data and functions
 */
export const useTokenBalances = (
  address: string | undefined,
  params?: TokenBalancesParams,
  options = { skip: address ? false : true },
) => {
  // Normalize the address (ensure it has 0x prefix)
  const normalizedAddress = address && !address.startsWith("0x") ? `0x${address}` : address;

  const result = useTokenApi<TokenBalancesResponse | TokenBalance[] | { data: TokenBalance[] }>(
    normalizedAddress ? `balances/evm/${normalizedAddress}` : "",
    { ...params },
    options,
  );

  // Handle different response formats
  let formattedData: TokenBalance[] = [];

  if (result.data) {
    if (Array.isArray(result.data)) {
      formattedData = result.data;
    } else if ("data" in result.data && Array.isArray(result.data.data)) {
      formattedData = result.data.data;
    }
  }

  return {
    ...result,
    data: formattedData,
  };
};
