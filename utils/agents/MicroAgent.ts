// ============================================================================
// MICRO AGENT BASE CLASS - iOS-Optimized Agentic Framework
// ============================================================================

export enum AgentState {
  IDLE = 'idle',
  PROCESSING = 'processing',
  WAITING_FOR_DATA = 'waiting_for_data',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  maxRuntime: number; // milliseconds (iOS background task limit: 25 seconds)
  costPerRun: number;
  isActive: boolean;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  cost: number;
  runtime: number;
}

export abstract class MicroAgent {
  protected config: AgentConfig;
  protected state: AgentState = AgentState.IDLE;
  protected lastRun: Date | null = null;
  protected totalCost: number = 0;
  protected runCount: number = 0;
  protected timeoutId: NodeJS.Timeout | null = null;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  protected setState(newState: AgentState): void {
    this.state = newState;
    console.log(`🤖 ${this.config.name}: State changed to ${newState}`);
  }

  getState(): AgentState {
    return this.state;
  }

  isIdle(): boolean {
    return this.state === AgentState.IDLE;
  }

  isProcessing(): boolean {
    return this.state === AgentState.PROCESSING;
  }

  // ============================================================================
  // EXECUTION WITH TIMEOUT
  // ============================================================================

  async execute(): Promise<AgentResult> {
    if (this.isProcessing()) {
      return {
        success: false,
        error: 'Agent is already processing',
        cost: 0,
        runtime: 0
      };
    }

    const startTime = Date.now();
    this.setState(AgentState.PROCESSING);
    this.runCount++;

    try {
      // Set timeout for iOS background task compliance
      const timeoutPromise = new Promise<AgentResult>((_, reject) => {
        this.timeoutId = setTimeout(() => {
          reject(new Error(`Agent ${this.config.name} exceeded max runtime of ${this.config.maxRuntime}ms`));
        }, this.config.maxRuntime);
      });

      // Execute the agent's main task
      const taskPromise = this.executeTask();

      // Race between task completion and timeout
      const result = await Promise.race([taskPromise, timeoutPromise]);

      const runtime = Date.now() - startTime;
      this.lastRun = new Date();
      this.totalCost += result.cost;
      this.setState(AgentState.COMPLETED);

      console.log(`🤖 ${this.config.name}: Completed in ${runtime}ms, cost: $${result.cost.toFixed(4)}`);
      return { ...result, runtime };

    } catch (error) {
      const runtime = Date.now() - startTime;
      this.setState(AgentState.ERROR);
      
      console.error(`🤖 ${this.config.name}: Error after ${runtime}ms:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        cost: 0,
        runtime
      };
    } finally {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    }
  }

  // ============================================================================
  // ABSTRACT METHODS - Each agent must implement
  // ============================================================================

  protected abstract executeTask(): Promise<AgentResult>;

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  protected log(message: string): void {
    console.log(`🤖 ${this.config.name}: ${message}`);
  }

  protected logCost(cost: number): void {
    this.totalCost += cost;
    this.log(`Cost: $${cost.toFixed(4)} (Total: $${this.totalCost.toFixed(4)})`);
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // STATUS & METRICS
  // ============================================================================

  getStatus(): {
    id: string;
    name: string;
    state: AgentState;
    lastRun: Date | null;
    totalCost: number;
    runCount: number;
    isActive: boolean;
  } {
    return {
      id: this.config.id,
      name: this.config.name,
      state: this.state,
      lastRun: this.lastRun,
      totalCost: this.totalCost,
      runCount: this.runCount,
      isActive: this.config.isActive
    };
  }

  getAgentId(): string {
    return this.config.id;
  }

  getAgentName(): string {
    return this.config.name;
  }

  // ============================================================================
  // COST TRACKING
  // ============================================================================

  getTotalCost(): number {
    return this.totalCost;
  }

  getRunCount(): number {
    return this.runCount;
  }

  resetCosts(): void {
    this.totalCost = 0;
    this.runCount = 0;
  }
} 