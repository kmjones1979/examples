import { ethereum } from "@graphprotocol/graph-ts";
import { BlockCost } from "../generated/schema";

export function handleBlock(block: ethereum.Block): void {
    let blockCost = new BlockCost(block.hash.toHex());

    blockCost.number = block.number;
    blockCost.gasUsed = block.gasUsed;
    blockCost.save();
}
