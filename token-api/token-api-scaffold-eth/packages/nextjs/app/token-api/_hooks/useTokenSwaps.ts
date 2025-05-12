"use client";

import { NetworkId, useTokenApi } from "./useTokenApi";

/**
 * Swap information
 */
export interface Swap {
  block_num: number;
  datetime: string;
  transaction_id: string;
  caller: string;
  pool: string;
  factory?: string;
  sender: string;
  recipient: string;
  network_id: string;
  amount0: string;
  amount1: string;
  token0?:
    | {
        address: string;
        symbol: string;
        decimals: number;
      }
    | string;
  token1?:
    | {
        address: string;
        symbol: string;
        decimals: number;
      }
    | string;
  token0_symbol?: string;
  token1_symbol?: string;
  amount0_usd?: number;
  amount1_usd?: number;
  value0?: number;
  value1?: number;
  price0?: number;
  price1?: number;
  protocol?: string;
}

/**
 * Swaps API response
 */
export interface SwapsResponse {
  swaps: Swap[];
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
  };
  total: number;
}

/**
 * Parameters for swaps API call
 */
export interface SwapsParams {
  network_id: NetworkId;
  pool?: string;
  caller?: string;
  sender?: string;
  recipient?: string;
  tx_hash?: string;
  protocol?: string;
  page?: number;
  page_size?: number;
}

/**
 * Hook to fetch swaps data
 *
 * @param params - Optional parameters
 * @param options - Hook options
 * @returns Swaps data and functions
 */
export const useTokenSwaps = (params: SwapsParams, options: { skip?: boolean } = {}) => {
  return useTokenApi<Swap[]>("swaps/evm", params, options);
};
