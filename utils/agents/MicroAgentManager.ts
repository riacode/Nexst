// ============================================================================
// MICRO AGENT MANAGER - Event-Driven Agent Orchestration
// ============================================================================

import { MicroAgent, AgentState, AgentResult } from './MicroAgent';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AgentEvent {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AgentRegistry {
  [agentId: string]: {
    agent: MicroAgent;
    eventTypes: string[];
    isActive: boolean;
  };
}

class MicroAgentManagerClass {
  private agents: AgentRegistry = {};
  private eventQueue: AgentEvent[] = [];
  private isInitialized: boolean = false;
  private processingQueue: boolean = false;

  // ============================================================================
  // AGENT REGISTRATION
  // ============================================================================

  registerAgent(agent: MicroAgent, eventTypes: string[]): void {
    this.agents[agent.getAgentId()] = {
      agent,
      eventTypes,
      isActive: true
    };
    console.log(`🤖 MicroAgentManager: Registered ${agent.getAgentName()} for events: ${eventTypes.join(', ')}`);
  }

  unregisterAgent(agentId: string): void {
    if (this.agents[agentId]) {
      this.agents[agentId].isActive = false;
      delete this.agents[agentId];
      console.log(`🤖 MicroAgentManager: Unregistered agent ${agentId}`);
    }
  }

  // ============================================================================
  // EVENT-DRIVEN EXECUTION
  // ============================================================================

  async triggerEvent(event: AgentEvent): Promise<void> {
    // Add event to queue
    this.eventQueue.push(event);
    
    // Keep queue size manageable
    if (this.eventQueue.length > 100) {
      this.eventQueue = this.eventQueue.slice(-50);
    }

    console.log(`🤖 MicroAgentManager: Event triggered: ${event.type} (priority: ${event.priority})`);
    
    // Process queue if not already processing
    if (!this.processingQueue) {
      await this.processEventQueue();
    }
  }

  private async processEventQueue(): Promise<void> {
    if (this.processingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.processingQueue = true;
    console.log(`🤖 MicroAgentManager: Processing ${this.eventQueue.length} events`);

    try {
      // Sort events by priority
      const sortedEvents = this.eventQueue.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // Process events
      for (const event of sortedEvents) {
        await this.processEvent(event);
      }

      // Clear processed events
      this.eventQueue = [];
      
    } catch (error) {
      console.error('🤖 MicroAgentManager: Error processing event queue:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  private async processEvent(event: AgentEvent): Promise<void> {
    // Find agents that handle this event type
    const relevantAgents = Object.values(this.agents).filter(
      agentInfo => agentInfo.isActive && agentInfo.eventTypes.includes(event.type)
    );

    if (relevantAgents.length === 0) {
      console.log(`🤖 MicroAgentManager: No agents registered for event type: ${event.type}`);
      return;
    }

    // Execute relevant agents
    const executionPromises = relevantAgents.map(async (agentInfo) => {
      const agent = agentInfo.agent;
      
      if (!agent.isIdle()) {
        console.log(`🤖 MicroAgentManager: Agent ${agent.getAgentName()} is busy, skipping event`);
        return;
      }

      try {
        console.log(`🤖 MicroAgentManager: Executing ${agent.getAgentName()} for event: ${event.type}`);
        const result = await agent.execute();
        
        if (result.success) {
          console.log(`🤖 MicroAgentManager: ${agent.getAgentName()} completed successfully`);
          // Store result for potential use by other agents
          await this.storeAgentResult(agent.getAgentId(), result);
        } else {
          console.error(`🤖 MicroAgentManager: ${agent.getAgentName()} failed: ${result.error}`);
        }
      } catch (error) {
        console.error(`🤖 MicroAgentManager: Error executing ${agent.getAgentName()}:`, error);
      }
    });

    await Promise.allSettled(executionPromises);
  }

  // ============================================================================
  // MANUAL AGENT EXECUTION
  // ============================================================================

  async executeAgent(agentId: string): Promise<AgentResult | null> {
    const agentInfo = this.agents[agentId];
    
    if (!agentInfo || !agentInfo.isActive) {
      console.log(`🤖 MicroAgentManager: Agent ${agentId} not found or inactive`);
      return null;
    }

    const agent = agentInfo.agent;
    
    if (!agent.isIdle()) {
      console.log(`🤖 MicroAgentManager: Agent ${agent.getAgentName()} is already processing`);
      return null;
    }

    try {
      console.log(`🤖 MicroAgentManager: Manually executing ${agent.getAgentName()}`);
      return await agent.execute();
    } catch (error) {
      console.error(`🤖 MicroAgentManager: Error manually executing ${agent.getAgentName()}:`, error);
      return null;
    }
  }

  // ============================================================================
  // BACKGROUND TASK SUPPORT
  // ============================================================================

  async executeBackgroundTask(): Promise<void> {
    console.log('🤖 MicroAgentManager: Executing background task');
    
    // Find agents that can run in background
    const backgroundAgents = Object.values(this.agents).filter(
      agentInfo => agentInfo.isActive && agentInfo.agent.getState() === AgentState.IDLE
    );

    if (backgroundAgents.length === 0) {
      console.log('🤖 MicroAgentManager: No idle agents available for background execution');
      return;
    }

    // Execute one agent at a time to respect iOS background time limits
    for (const agentInfo of backgroundAgents) {
      const agent = agentInfo.agent;
      
      try {
        console.log(`🤖 MicroAgentManager: Background execution of ${agent.getAgentName()}`);
        await agent.execute();
        
        // Check if we're running out of background time
        // iOS typically gives 25-30 seconds for background tasks
        const elapsed = Date.now() - (this.lastBackgroundStart || Date.now());
        if (elapsed > 20000) { // 20 seconds safety margin
          console.log('🤖 MicroAgentManager: Background time limit approaching, stopping execution');
          break;
        }
      } catch (error) {
        console.error(`🤖 MicroAgentManager: Background execution error for ${agent.getAgentName()}:`, error);
      }
    }
  }

  private lastBackgroundStart: number | null = null;

  startBackgroundTask(): void {
    this.lastBackgroundStart = Date.now();
  }

  // ============================================================================
  // DATA STORAGE
  // ============================================================================

  private async storeAgentResult(agentId: string, result: AgentResult): Promise<void> {
    try {
      const key = `agent_result_${agentId}`;
      const data = {
        result,
        timestamp: new Date().toISOString(),
        agentId
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('🤖 MicroAgentManager: Error storing agent result:', error);
    }
  }

  async getAgentResult(agentId: string): Promise<AgentResult | null> {
    try {
      const key = `agent_result_${agentId}`;
      const dataJson = await AsyncStorage.getItem(key);
      
      if (!dataJson) return null;
      
      const data = JSON.parse(dataJson);
      return data.result;
    } catch (error) {
      console.error('🤖 MicroAgentManager: Error retrieving agent result:', error);
      return null;
    }
  }

  // ============================================================================
  // STATUS & METRICS
  // ============================================================================

  getSystemStatus(): {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    processingAgents: number;
    pendingEvents: number;
    isInitialized: boolean;
  } {
    const agentStatuses = Object.values(this.agents).map(info => info.agent.getState());
    
    return {
      totalAgents: Object.keys(this.agents).length,
      activeAgents: Object.values(this.agents).filter(info => info.isActive).length,
      idleAgents: agentStatuses.filter(state => state === AgentState.IDLE).length,
      processingAgents: agentStatuses.filter(state => state === AgentState.PROCESSING).length,
      pendingEvents: this.eventQueue.length,
      isInitialized: this.isInitialized
    };
  }

  getAllAgentStatus(): Array<{
    id: string;
    name: string;
    state: AgentState;
    lastRun: Date | null;
    totalCost: number;
    runCount: number;
    isActive: boolean;
  }> {
    return Object.values(this.agents).map(info => ({
      ...info.agent.getStatus(),
      isActive: info.isActive
    }));
  }

  getTotalCost(): number {
    return Object.values(this.agents).reduce((total, info) => {
      return total + info.agent.getTotalCost();
    }, 0);
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🤖 MicroAgentManager: Already initialized');
      return;
    }

    console.log('🤖 MicroAgentManager: Initializing');
    this.isInitialized = true;
    console.log('🤖 MicroAgentManager: Initialized successfully');
  }

  async shutdown(): Promise<void> {
    console.log('🤖 MicroAgentManager: Shutting down');
    
    // Stop processing
    this.processingQueue = false;
    
    // Clear event queue
    this.eventQueue = [];
    
    // Deactivate all agents
    Object.values(this.agents).forEach(agentInfo => {
      agentInfo.isActive = false;
    });
    
    this.isInitialized = false;
    console.log('🤖 MicroAgentManager: Shutdown complete');
  }
}

// Export singleton instance
export const MicroAgentManager = new MicroAgentManagerClass(); 