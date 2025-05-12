"use client";

import { useTokenApi } from "./useTokenApi";
import type { NetworkId } from "./useTokenApi";

/**
 * Historical balance data point for a token
 */
export interface HistoricalBalance {
  timestamp: number;
  block_number?: number;
  block_num?: number;
  datetime?: string;
  date?: string;
  balance: string;
  balance_usd?: number;
  token_price_usd?: number;
  price_usd?: number;
}

/**
 * Token balance history entry with token information
 */
export interface TokenBalanceHistory {
  contract_address: string;
  token_name?: string;
  token_symbol?: string;
  symbol?: string;
  name?: string;
  token_decimals?: number;
  decimals?: number;
  network_id?: NetworkId;
  balances: HistoricalBalance[];
}

/**
 * Historical balances API response
 */
export interface HistoricalBalancesResponse {
  data?: TokenBalanceHistory[];
  statistics?: {
    bytes_read: number;
    rows_read: number;
    elapsed: number;
  };
}

/**
 * Parameters for historical balances API call
 */
export interface HistoricalBalancesParams {
  contract_address?: string;
  network_id?: NetworkId;
  from_timestamp?: number;
  to_timestamp?: number;
  start_timestamp?: number;
  end_timestamp?: number;
  resolution?: "day" | "hour";
}

/**
 * Hook to fetch historical token balances for an address
 *
 * @param address - Wallet address
 * @param params - Optional parameters
 * @param options - Hook options
 * @returns Historical balance data and functions
 */
export const useHistoricalBalances = (
  address: string | undefined,
  params?: HistoricalBalancesParams,
  options = { skip: address ? false : true },
) => {
  // Normalize the address (ensure it has 0x prefix)
  const normalizedAddress = address && !address.startsWith("0x") ? `0x${address}` : address;

  const result = useTokenApi<HistoricalBalancesResponse | TokenBalanceHistory[] | { data: TokenBalanceHistory[] }>(
    normalizedAddress ? `historical/balances/evm/${normalizedAddress}` : "",
    { ...params },
    options,
  );

  // Handle different response formats
  let formattedData: TokenBalanceHistory[] = [];

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
