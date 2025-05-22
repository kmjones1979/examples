"use client";

import { GetBalances } from "./_components/GetBalances";
import { GetHistorical } from "./_components/GetHistorical";
import { GetHolders } from "./_components/GetHolders";
import { GetMetadata } from "./_components/GetMetadata";
import { GetNFTActivities } from "./_components/GetNFTActivities";
import { GetNFTCollections } from "./_components/GetNFTCollections";
import { GetNFTItems } from "./_components/GetNFTItems";
import { GetNFTOwnerships } from "./_components/GetNFTOwnerships";
import { GetNFTSales } from "./_components/GetNFTSales";
import { GetOHLCByContract } from "./_components/GetOHLCByContract";
import { GetOHLCByPool } from "./_components/GetOHLCByPool";
import { GetPools } from "./_components/GetPools";
import { GetSwaps } from "./_components/GetSwaps";
import { GetTransfers } from "./_components/GetTransfers";

const ApiUpdateNotification = () => (
  <div className="alert alert-info mb-4">
    <div className="flex items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className="stroke-current shrink-0 w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
      <span>
        The API paths have been updated to match the official token API specification. The OHLC components now use the
        correct endpoint paths.
      </span>
    </div>
  </div>
);

export default function TokenAPI() {
  return (
    <div className="flex flex-col gap-6 py-8 px-4 lg:px-8">
      <h1 className="text-4xl font-bold text-center mb-8">Token API Explorer</h1>
      <ApiUpdateNotification />
      <GetBalances />
      <GetHolders />
      <GetTransfers />
      <GetMetadata />
      <GetHistorical />
      <GetOHLCByPool />
      <GetOHLCByContract />
      <GetPools />
      <GetSwaps />
      {/* Spacing for NFT components */}
      <div className="mt-12">
        <h2 className="text-3xl font-bold text-center mb-6">NFT API Showcase</h2>
      </div>
      <GetNFTCollections isOpen={false} />
      <GetNFTItems isOpen={false} />
      <GetNFTOwnerships isOpen={false} />
      <GetNFTActivities isOpen={false} />
      <GetNFTSales isOpen={false} />
    </div>
  );
}
