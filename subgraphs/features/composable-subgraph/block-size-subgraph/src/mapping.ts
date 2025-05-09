import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { BlockSize } from "../generated/schema";

export function handleBlock(block: ethereum.Block): void {
    let blockSize = new BlockSize(block.hash.toHex());

    blockSize.number = block.number;
    if (block.size !== null) {
        blockSize.size = block.size!;
    } else {
        blockSize.size = BigInt.fromU64(0);
    }
    blockSize.save();
}
