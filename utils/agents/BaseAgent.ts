// ============================================================================
// BASE AGENT CLASS - Foundation for all autonomous agents
// ============================================================================

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: string;
  data: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  frequency: number; // milliseconds
  isActive: boolean;
  costPerRun: number;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected isRunning: boolean = false;
  protected messageQueue: AgentMessage[] = [];
  protected lastRun: Date | null = null;
  protected nextRun: Date | null = null;
  protected totalCost: number = 0;
  protected runCount: number = 0;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  // ============================================================================
  // AUTONOMOUS OPERATION
  // ============================================================================

  /**
   * Start autonomous operation - each agent runs independently
   */
  async startAutonomousOperation(): Promise<void> {
    if (this.isRunning) {
      console.log(`🤖 ${this.config.name}: Already running`);
      return;
    }

    console.log(`🤖 ${this.config.name}: Starting autonomous operation`);
    this.isRunning = true;
    this.lastRun = new Date();
    this.nextRun = new Date(Date.now() + this.config.frequency);

    // Run initial task
    await this.executeTask();

    // Start autonomous loop
    this.startAutonomousLoop();
  }

  /**
   * Stop autonomous operation
   */
  stopAutonomousOperation(): void {
    console.log(`🤖 ${this.config.name}: Stopping autonomous operation`);
    this.isRunning = false;
  }

  /**
   * Autonomous loop - each agent runs independently
   */
  private async startAutonomousLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Check if it's time to run
        if (this.nextRun && new Date() >= this.nextRun) {
          await this.executeTask();
          this.lastRun = new Date();
          this.nextRun = new Date(Date.now() + this.config.frequency);
        }

        // Process incoming messages
        await this.processMessages();

        // Sleep for a short interval (1 minute)
        await this.sleep(60 * 1000);
      } catch (error) {
        console.error(`🤖 ${this.config.name}: Error in autonomous loop:`, error);
        await this.sleep(5 * 60 * 1000); // Wait 5 minutes on error
      }
    }
  }

  // ============================================================================
  // ABSTRACT METHODS - Each agent must implement
  // ============================================================================

  /**
   * Main task execution - each agent implements its own logic
   */
  protected abstract executeTask(): Promise<void>;

  /**
   * Handle incoming messages from other agents
   */
  protected abstract handleMessage(message: AgentMessage): Promise<void>;

  // ============================================================================
  // INTER-AGENT COMMUNICATION
  // ============================================================================

  /**
   * Send message to another agent
   */
  protected async sendMessage(to: string, type: string, data: any, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'): Promise<void> {
    const message: AgentMessage = {
      id: `${this.config.id}-${Date.now()}`,
      from: this.config.id,
      to,
      type,
      data,
      timestamp: new Date(),
      priority
    };

    // Get the agent manager to route the message
    const { AgentManager } = await import('./AgentManager');
    await AgentManager.sendMessage(message);
  }

  /**
   * Process incoming messages
   */
  private async processMessages(): Promise<void> {
    const { AgentManager } = await import('./AgentManager');
    const messages = await AgentManager.getMessagesForAgent(this.config.id);
    
    for (const message of messages) {
      try {
        await this.handleMessage(message);
      } catch (error) {
        console.error(`🤖 ${this.config.name}: Error handling message:`, error);
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected log(message: string): void {
    console.log(`🤖 ${this.config.name}: ${message}`);
  }

  protected logCost(cost: number): void {
    this.totalCost += cost;
    this.log(`Cost: $${cost.toFixed(4)} (Total: $${this.totalCost.toFixed(4)})`);
  }

  // ============================================================================
  // STATUS & METRICS
  // ============================================================================

  getStatus(): {
    id: string;
    name: string;
    isRunning: boolean;
    lastRun: Date | null;
    nextRun: Date | null;
    totalCost: number;
    runCount: number;
  } {
    return {
      id: this.config.id,
      name: this.config.name,
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.nextRun,
      totalCost: this.totalCost,
      runCount: this.runCount
    };
  }

  /**
   * Get agent ID for external access
   */
  getAgentId(): string {
    return this.config.id;
  }
} 