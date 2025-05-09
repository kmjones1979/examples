> **Last updated:** GIT_WILL_REPLACE_THIS

> **Last updated:** 2025-05-09

# Block Stats Subgraph

This is a composed subgraph that combines and aggregates the information from the 3 source subgraphs.

To keep this example as simple as possible, all source subgraphs use only block handlers, but in a real environment 
each source subgraph will use data from different smart contracts.

> [!NOTE]
> Any change to a source subgraph will most likely generate a new deployment ID. Be sure to update the deployment ID in 
> the data source address of the subgraph manifest to take advantage of the latest changes.

## Local Deployment

### Requirements

These are minimal requirements to deploy this subgraph locally:

- A [graph-node][0] instance running locally
- An [IPFS][1] instance running locally
- [Node.js][2] and npm

### Deployment

> [!IMPORTANT]
> All source subgraphs should be deployed before the composed subgraph is deployed.

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
