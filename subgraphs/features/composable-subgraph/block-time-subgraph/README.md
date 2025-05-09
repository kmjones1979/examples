> **Last updated:** GIT_WILL_REPLACE_THIS

# Block Time Subgraph

This is a subgraph that calculates the block time for each block.

## Local Deployment

### Requirements

These are minimal requirements to deploy this subgraph locally:

- A [graph-node][0] instance running locally
- An [IPFS][1] instance running locally
- [Node.js][2] and npm

### Deployment

To deploy this subgraph locally, run the following commands:

```bash
npm install
npm run codegen
npm run build
npm run create-local
npm run deploy-local
```

[0]: https://github.com/graphprotocol/graph-node
[1]: https://docs.ipfs.tech/
[2]: https://nodejs.org/
