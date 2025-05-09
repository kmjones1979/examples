import { BigInt, ethereum  } from "@graphprotocol/graph-ts";
import { BlockTime } from "../generated/schema";

export function handleBlock(block: ethereum.Block): void {
  let blockTime = new BlockTime(block.hash.toHex());

  blockTime.parentId = block.parentHash.toHex();
  blockTime.number = block.number;
  blockTime.timestamp = block.timestamp;

  let parentBlockTime = BlockTime.load(block.parentHash.toHex());

  if (parentBlockTime) {
    blockTime.blockTime = blockTime.timestamp.minus(parentBlockTime.timestamp);
  } else {
    blockTime.blockTime = BigInt.fromU64(0);
  }

  blockTime.save();
}
