
import { Node, Edge } from 'reactflow';

interface NodeWithLevel extends Node {
  level?: number;
  visited?: boolean;
}

export class AutoLayoutService {
  /**
   * Automatically layout nodes based on flow direction
   */
  static autoLayout(nodes: Node[], edges: Edge[], direction: 'horizontal' | 'vertical' = 'horizontal'): Node[] {
    if (nodes.length === 0) return nodes;

    // Create a deep copy of nodes to manipulate
    const layoutNodes: NodeWithLevel[] = JSON.parse(JSON.stringify(nodes));
    
    // Find root nodes (nodes with no incoming edges)
    const rootNodes = this.findRootNodes(layoutNodes, edges);
    
    // If no root nodes found, use the first node as root
    if (rootNodes.length === 0 && layoutNodes.length > 0) {
      rootNodes.push(layoutNodes[0]);
    }
    
    // Reset all nodes as unvisited
    layoutNodes.forEach(node => {
      node.visited = false;
      node.level = undefined;
    });
    
    // Assign levels to nodes using depth-first search
    rootNodes.forEach(rootNode => {
      this.assignNodeLevels(rootNode, edges, layoutNodes, 0);
    });
    
    // Group nodes by level
    const nodesByLevel: { [level: number]: NodeWithLevel[] } = {};
    
    layoutNodes.forEach(node => {
      const level = node.level !== undefined ? node.level : 0;
      if (!nodesByLevel[level]) {
        nodesByLevel[level] = [];
      }
      nodesByLevel[level].push(node);
    });
    
    // Position nodes based on their level
    const levels = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b);
    const baseSpacing = 200;
    const nodeSpacing = 150;
    
    levels.forEach((level, levelIndex) => {
      const nodesInLevel = nodesByLevel[level];
      const levelNodeCount = nodesInLevel.length;
      
      nodesInLevel.forEach((node, nodeIndex) => {
        if (direction === 'horizontal') {
          // Horizontal layout (levels from left to right)
          node.position = {
            x: level * baseSpacing + 100,
            y: (nodeIndex - (levelNodeCount - 1) / 2) * nodeSpacing + 300
          };
        } else {
          // Vertical layout (levels from top to bottom)
          node.position = {
            x: (nodeIndex - (levelNodeCount - 1) / 2) * nodeSpacing + 400,
            y: level * baseSpacing + 100
          };
        }
      });
    });
    
    // Special case handling for parallel nodes (System Prompt, Configuration)
    this.handleParallelNodes(layoutNodes, edges);
    
    // Clean up temporary properties
    layoutNodes.forEach(node => {
      delete node.level;
      delete node.visited;
    });
    
    return layoutNodes;
  }
  
  /**
   * Find all root nodes in the graph (nodes with no incoming edges)
   */
  private static findRootNodes(nodes: NodeWithLevel[], edges: Edge[]): NodeWithLevel[] {
    const rootNodes: NodeWithLevel[] = [];
    
    // Create map of all target nodes
    const targetNodeIds = new Set(edges.map(edge => edge.target));
    
    // Find nodes that are not targets (they are sources only or isolated)
    nodes.forEach(node => {
      if (!targetNodeIds.has(node.id)) {
        rootNodes.push(node);
      }
    });
    
    return rootNodes;
  }
  
  /**
   * Assign levels to nodes based on their distance from root
   */
  private static assignNodeLevels(
    currentNode: NodeWithLevel,
    edges: Edge[],
    allNodes: NodeWithLevel[],
    level: number
  ): void {
    if (currentNode.visited) {
      if ((currentNode.level || 0) <= level) {
        currentNode.level = level;
      }
      return;
    }
    
    currentNode.visited = true;
    currentNode.level = level;
    
    // Find all outgoing edges from this node
    const outgoingEdges = edges.filter(edge => edge.source === currentNode.id);
    
    // Process each target node
    outgoingEdges.forEach(edge => {
      const targetNode = allNodes.find(node => node.id === edge.target);
      if (targetNode) {
        this.assignNodeLevels(targetNode, edges, allNodes, level + 1);
      }
    });
  }
  
  /**
   * Handle special positioning for parallel nodes
   */
  private static handleParallelNodes(nodes: NodeWithLevel[], edges: Edge[]): void {
    // Find system prompt and configuration nodes
    const systemPromptNodes = nodes.filter(node => 
      node.data?.type === 'systemPrompt'
    );
    
    const configNodes = nodes.filter(node => 
      node.data?.type === 'configuration'
    );
    
    // For each system prompt, position it slightly above its target node
    systemPromptNodes.forEach(promptNode => {
      const outgoingEdges = edges.filter(edge => edge.source === promptNode.id);
      if (outgoingEdges.length > 0) {
        const targetNodeId = outgoingEdges[0].target;
        const targetNode = nodes.find(node => node.id === targetNodeId);
        
        if (targetNode) {
          promptNode.position = {
            x: targetNode.position.x - 150,
            y: targetNode.position.y - 100
          };
        }
      }
    });
    
    // For each config node, position it slightly above its target node
    configNodes.forEach(configNode => {
      const outgoingEdges = edges.filter(edge => edge.source === configNode.id);
      if (outgoingEdges.length > 0) {
        const targetNodeId = outgoingEdges[0].target;
        const targetNode = nodes.find(node => node.id === targetNodeId);
        
        if (targetNode) {
          configNode.position = {
            x: targetNode.position.x + 150,
            y: targetNode.position.y - 100
          };
        }
      }
    });
  }
}
