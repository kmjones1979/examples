import { BigInt, Bytes, EntityOp, store } from "@graphprotocol/graph-ts";
import { Block, BlockDataSource } from "../generated/schema";
import { BlockTime } from "../generated/subgraph-QmYDoyoDpMKu7kqpNw3Fb7293u55MP89vgNFMT9nMdX2iN";
import { BlockCost } from "../generated/subgraph-Qmb4GGhWYVxj1146y9LCPaHtL9oD8gfvdksBnVZ4UoTmGd";
import { BlockSize } from "../generated/subgraph-QmVg4x7wFYAuUaeCrN9FdY4NUk7QpcvpgvBiqyNvZr3xjN";

export function handleBlockTime(blockTime: BlockTime): void {
  let blockData = loadOrCreateBlockData(blockTime.id, blockTime.number);

  blockData.blockTime = blockTime.blockTime;
  blockData.save();

  maybeCreateBlock(blockData);
}

export function handleBlockCost(blockCost: BlockCost): void {
  let blockData = loadOrCreateBlockData(blockCost.id, blockCost.number);

  blockData.gasUsed = blockCost.gasUsed;
  blockData.save();

  maybeCreateBlock(blockData);
}

export function handleBlockSize(blockSize: BlockSize): void {
  let blockData = loadOrCreateBlockData(blockSize.id, blockSize.number);

  blockData.size = blockSize.size;
  blockData.save();

  maybeCreateBlock(blockData);
}

function loadOrCreateBlockData(id: string, number: BigInt): BlockDataSource {
  let blockData = BlockDataSource.load(id);

  if (!blockData) {
    blockData = new BlockDataSource(id);
    blockData.number = number;
  }

  return blockData;
}

function maybeCreateBlock(blockData: BlockDataSource): void {
  if (
    blockData.blockTime === null ||
    blockData.gasUsed === null ||
    blockData.size === null
  ) {
    return;
  }

  let block = new Block("auto");

  block.hash = Bytes.fromHexString(blockData.id);
  block.number = blockData.number;
  block.blockTime = blockData.blockTime!;
  block.gasUsed = blockData.gasUsed!;
  block.size = blockData.size!;
  block.save();

  store.remove("BlockDataSource", blockData.id);
}
