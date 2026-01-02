import type {
  LGraph,
  LGraphNode,
  Subgraph
} from '@/lib/litegraph/src/litegraph'

function parseExecutionId(executionId: string): string[] | null {
  if (!executionId || typeof executionId !== 'string') return null
  return executionId.split(':').filter((part) => part.length > 0)
}

function getLocalNodeIdFromExecutionId(executionId: string): string | null {
  const parts = parseExecutionId(executionId)
  return parts ? parts[parts.length - 1] : null
}

function getSubgraphPathFromExecutionId(executionId: string): string[] {
  const parts = parseExecutionId(executionId)
  return parts ? parts.slice(0, -1) : []
}

function traverseSubgraphPath(
  startGraph: LGraph | Subgraph,
  path: string[]
): LGraph | Subgraph | null {
  let currentGraph: LGraph | Subgraph = startGraph

  for (const nodeId of path) {
    const node = currentGraph.getNodeById(nodeId)
    if (!node?.isSubgraphNode?.() || !node.subgraph) return null
    currentGraph = node.subgraph
  }

  return currentGraph
}

function getNodeByExecutionId(
  rootGraph: LGraph,
  executionId: string
): LGraphNode | null {
  if (!rootGraph) return null

  const localNodeId = getLocalNodeIdFromExecutionId(executionId)
  if (!localNodeId) return null

  const subgraphPath = getSubgraphPathFromExecutionId(executionId)

  // If no subgraph path, it's in the root graph
  if (subgraphPath.length === 0) {
    return rootGraph.getNodeById(localNodeId) || null
  }

  // Traverse to the target subgraph
  const targetGraph = traverseSubgraphPath(rootGraph, subgraphPath)
  if (!targetGraph) return null

  // Get the node from the target graph
  return targetGraph.getNodeById(localNodeId) || null
}

export { getNodeByExecutionId }
