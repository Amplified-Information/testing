// Network Health Monitoring for Hedera Testnet
export interface NodeHealth {
  nodeId: string
  consecutiveFailures: number
  lastFailure: number
  isHealthy: boolean
  avgResponseTime: number
}

export class NetworkHealthMonitor {
  private nodeHealth = new Map<string, NodeHealth>()
  private readonly maxConsecutiveFailures = 3 // Increased from 2 for testnet tolerance
  private readonly unhealthyTimeoutMs = 120000 // 2 minutes before retry (increased from 1)
  private readonly healthCheckIntervalMs = 300000 // 5 minutes between health checks

  constructor() {
    // Initialize with known Hedera testnet nodes
    const testnetNodes = ['0.0.3', '0.0.4', '0.0.5', '0.0.6', '0.0.7', '0.0.8', '0.0.9']
    testnetNodes.forEach(nodeId => {
      this.nodeHealth.set(nodeId, {
        nodeId,
        consecutiveFailures: 0,
        lastFailure: 0,
        isHealthy: true,
        avgResponseTime: 0
      })
    })
  }

  recordSuccess(nodeId: string, responseTime: number): void {
    const node = this.nodeHealth.get(nodeId)
    if (node) {
      node.consecutiveFailures = 0
      node.isHealthy = true
      node.avgResponseTime = node.avgResponseTime === 0 
        ? responseTime 
        : (node.avgResponseTime + responseTime) / 2
      
      console.log(`✅ Node ${nodeId} success: ${responseTime}ms (avg: ${Math.round(node.avgResponseTime)}ms)`)
    }
  }

  recordFailure(nodeId: string, error: string): void {
    const node = this.nodeHealth.get(nodeId)
    if (node) {
      node.consecutiveFailures++
      node.lastFailure = Date.now()
      
      if (node.consecutiveFailures >= this.maxConsecutiveFailures) {
        node.isHealthy = false
        console.warn(`⚠️ Node ${nodeId} marked unhealthy after ${node.consecutiveFailures} failures: ${error}`)
      } else {
        console.log(`⚠️ Node ${nodeId} failure ${node.consecutiveFailures}/${this.maxConsecutiveFailures}: ${error}`)
      }
    }
  }

  getHealthyNodes(): string[] {
    const now = Date.now()
    return Array.from(this.nodeHealth.values())
      .filter(node => {
        // Re-evaluate unhealthy nodes after timeout
        if (!node.isHealthy && (now - node.lastFailure) > this.unhealthyTimeoutMs) {
          node.isHealthy = true
          node.consecutiveFailures = 0
          console.log(`🔄 Node ${node.nodeId} marked healthy again after timeout`)
        }
        return node.isHealthy
      })
      .sort((a, b) => a.avgResponseTime - b.avgResponseTime) // Prefer faster nodes
      .map(node => node.nodeId)
  }

  getNetworkStatus(): { healthy: number; total: number; avgResponseTime: number } {
    const healthyNodes = this.getHealthyNodes()
    const allNodes = Array.from(this.nodeHealth.values())
    const avgResponseTime = allNodes
      .filter(n => n.avgResponseTime > 0)
      .reduce((sum, n) => sum + n.avgResponseTime, 0) / allNodes.length || 0

    return {
      healthy: healthyNodes.length,
      total: allNodes.length,
      avgResponseTime: Math.round(avgResponseTime)
    }
  }

  shouldSkipTransaction(): boolean {
    const healthyNodes = this.getHealthyNodes()
    const healthRatio = healthyNodes.length / this.nodeHealth.size
    
    // Skip if less than 20% of nodes are healthy (reduced from 30% for testnet tolerance)
    if (healthRatio < 0.2) {
      console.warn(`🚨 Network critically unhealthy: ${healthyNodes.length}/${this.nodeHealth.size} nodes available`)
      return true
    }
    
    return false
  }
}

// Global instance for shared state across function calls
export const networkHealth = new NetworkHealthMonitor()