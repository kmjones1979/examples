> **Last updated:** GIT_WILL_REPLACE_THIS

> **Last updated:** 2025-05-09

This subgraph demonstrates aggregations by aggregating over some easily predictable values, namely
the block numbers of the underlying chain. It's of little value beyond that.

The [schema](./schema.graphql), the [subgraph manifest](./subgraph.yaml) and the
[mappings](./src/mappings/blocks.ts) have comments that explain how to write your own aggregations.

The script `check-data.sh` can be used to check that the aggregations were performed correctly.
