"use client";

import { useState } from "react";
import type { NetworkId } from "./useTokenApi";
import { ApiResponse } from "./useTokenApi";
import { UseQueryResult } from "@tanstack/react-query";
import { useTokenApi } from "~~/app/token-api/_hooks/useTokenApi";
import { cleanContractAddress } from "~~/app/token-api/_utils/utils";

/**
 * OHLC data point
 */
export interface OHLCDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  volume_usd?: number;
}

/**
 * Contract OHLC API response
 */
export interface ContractOHLCResponse {
  // Legacy format fields
  contract_address?: string;
  token_name?: string;
  token_symbol?: string;
  token_decimals?: number;
  network_id?: NetworkId;
  resolution?: string;
  ohlc?: OHLCDataPoint[];

  // New API response format matching OpenAPI spec
  data?: Array<{
    datetime: string;
    ticker: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    uaw?: number;
    transactions?: number;
  }>;
  statistics?: {
    elapsed: number;
    rows_read: number;
    bytes_read: number;
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
 * Parameters for contract OHLC API call
 */
export interface ContractOHLCParams {
  network_id?: NetworkId;
  from_timestamp?: number;
  to_timestamp?: number;
  resolution?: "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "1d" | "1w";
}

export interface TokenOHLCByContractResponse {
  /**
   * Token OHLC prices recorded in timestamp
   */
  time: number;
  /**
   * Opening price for the time period.
   */
  open: number;
  /**
   * Highest price for the time period.
   */
  high: number;
  /**
   * Lowest price for the time period.
   */
  low: number;
  /**
   * Closing price for the time period.
   */
  close: number;
  /**
   * Volume for the time period.
   */
  volume: number;
}

export interface UseTokenOHLCByContractOptions {
  /**
   * The contract address of the token to get OHLC prices for.
   */
  contract?: string;
  /**
   * The network to get OHLC price data for.
   */
  network?: NetworkId;
  /**
   * The timeframe in seconds to get OHLC prices for.
   * Defaults to 86400 (1 day).
   */
  timeframe?: number;
  /**
   * Start timestamp for the OHLC data (Unix seconds).
   */
  startTime?: number;
  /**
   * End timestamp for the OHLC data (Unix seconds).
   */
  endTime?: number;
  /**
   * The number of results to return.
   * Defaults to 100.
   */
  limit?: number;
  /**
   * Enable the query
   */
  enabled?: boolean;
}

/**
 * React hook to get OHLC price data for a token contract.
 */
export function useTokenOHLCByContract(options: UseTokenOHLCByContractOptions = {}) {
  const { contract, network, timeframe = 86400, limit = 100, enabled = true, startTime, endTime } = options;

  const normalizedContract = contract?.toLowerCase();

  // Create a valid endpoint path string
  const endpoint = normalizedContract ? `ohlc/prices/evm/${normalizedContract}` : "";

  return useTokenApi<ContractOHLCResponse>(
    endpoint,
    {
      network_id: network,
      // Use the correct parameter names from OpenAPI spec
      interval: timeframe === 86400 ? "1d" : "1h", // Map timeframe to an interval
      limit,
      startTime,
      endTime,
    },
    {
      skip: !normalizedContract || !enabled,
    },
  );
}
