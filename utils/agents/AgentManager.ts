// ============================================================================
// AGENT MANAGER - Handles inter-agent communication and agent lifecycle
// ============================================================================

import { AgentMessage, BaseAgent, AgentConfig } from './BaseAgent';

class AgentManagerClass {
  private agents: Map<string, BaseAgent> = new Map();
  private messageQueue: AgentMessage[] = [];
  private isInitialized: boolean = false;

  // ============================================================================
  // AGENT LIFECYCLE MANAGEMENT
  // ============================================================================

  /**
   * Register an agent with the manager
   */
  registerAgent(agent: BaseAgent): void {
    const config = (agent as any).config;
    this.agents.set(config.id, agent);
    console.log(`🤖 AgentManager: Registered ${config.name} (${config.id})`);
  }

  /**
   * Start all registered agents
   */
  async startAllAgents(): Promise<void> {
    console.log(`🤖 AgentManager: Starting ${this.agents.size} agents`);
    
    for (const [id, agent] of this.agents) {
      try {
        await agent.startAutonomousOperation();
      } catch (error) {
        console.error(`🤖 AgentManager: Failed to start agent ${id}:`, error);
      }
    }
    
    this.isInitialized = true;
  }

  /**
   * Stop all agents
   */
  async stopAllAgents(): Promise<void> {
    console.log(`🤖 AgentManager: Stopping all agents`);
    
    for (const [id, agent] of this.agents) {
      try {
        agent.stopAutonomousOperation();
      } catch (error) {
        console.error(`🤖 AgentManager: Failed to stop agent ${id}:`, error);
      }
    }
    
    this.isInitialized = false;
  }

  /**
   * Get status of all agents
   */
  getAllAgentStatus(): Array<{
    id: string;
    name: string;
    isRunning: boolean;
    lastRun: Date | null;
    nextRun: Date | null;
    totalCost: number;
    runCount: number;
  }> {
    return Array.from(this.agents.values()).map(agent => agent.getStatus());
  }

  // ============================================================================
  // INTER-AGENT COMMUNICATION
  // ============================================================================

  /**
   * Send message between agents
   */
  async sendMessage(message: AgentMessage): Promise<void> {
    // Add to message queue
    this.messageQueue.push(message);
    
    // Keep only recent messages (last 1000)
    if (this.messageQueue.length > 1000) {
      this.messageQueue = this.messageQueue.slice(-1000);
    }
    
    console.log(`🤖 AgentManager: Message sent from ${message.from} to ${message.to}: ${message.type}`);
  }

  /**
   * Get messages for a specific agent
   */
  async getMessagesForAgent(agentId: string): Promise<AgentMessage[]> {
    const messages = this.messageQueue.filter(msg => msg.to === agentId);
    
    // Remove processed messages
    this.messageQueue = this.messageQueue.filter(msg => msg.to !== agentId);
    
    return messages;
  }

  /**
   * Get all pending messages
   */
  getAllMessages(): AgentMessage[] {
    return [...this.messageQueue];
  }

  // ============================================================================
  // AGENT DISCOVERY & COMMUNICATION
  // ============================================================================

  /**
   * Get list of all agent IDs
   */
  getAgentIds(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Check if an agent exists
   */
  hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  // ============================================================================
  // SYSTEM STATUS
  // ============================================================================

  /**
   * Get overall system status
   */
  getSystemStatus(): {
    totalAgents: number;
    runningAgents: number;
    totalCost: number;
    pendingMessages: number;
    isInitialized: boolean;
  } {
    const statuses = this.getAllAgentStatus();
    const runningAgents = statuses.filter(s => s.isRunning).length;
    const totalCost = statuses.reduce((sum, s) => sum + s.totalCost, 0);
    
    return {
      totalAgents: this.agents.size,
      runningAgents,
      totalCost,
      pendingMessages: this.messageQueue.length,
      isInitialized: this.isInitialized
    };
  }
}

// Export singleton instance
export const AgentManager = new AgentManagerClass(); 