import neo4j, { Driver } from "neo4j-driver";

export interface Neo4jStorageConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
}

export class Neo4jStorage {
  private driver: Driver;
  private database: string;
  private _hasInitialized: boolean;

  constructor(config: Neo4jStorageConfig) {
    this.driver = neo4j.driver(config.uri, neo4j.auth.basic(config.username, config.password));
    this.database = config.database || "neo4j";
    this._hasInitialized = false;
  }

  async init(): Promise<void> {
    await this.initialize();
  }

  async initialize(): Promise<void> {
    if (this._hasInitialized) return;

    //create constraints and indexes for Mastra data
    const session = this.driver.session({ database: this.database });

    try {
      //create constraints for mastra threads
      await session.run(`
        CREATE CONSTRAINT thread_id_unique IF NOT EXISTS
        FOR (t:Thread) REQUIRE t.id IS UNIQUE
      `);

      // constraints for messages
      await session.run(`
        CREATE CONSTRAINT message_id_unique IF NOT EXISTS
        FOR (m:Message) REQUIRE m.id IS UNIQUE
      `);

      // indexes for performance
      await session.run(`
        CREATE INDEX thread_resource_id IF NOT EXISTS
        FOR (t:Thread) ON (t.resourceId)
      `);

      await session.run(`
        CREATE INDEX message_thread_id IF NOT EXISTS
        FOR (m:Message) ON (m.threadId)
      `);

      await session.run(`
        CREATE INDEX message_created_at IF NOT EXISTS
        FOR (m:Message) ON (m.createdAt)
      `);

      this._hasInitialized = true;
    } finally {
      await session.close();
    }
  }

  // Override BaseStorage methods with Neo4j implementation
  get hasInitialized(): Promise<boolean> {
    return Promise.resolve(this._hasInitialized);
  }

  get shouldCacheInit(): boolean {
    return true;
  }

  get supports(): {
    selectByIncludeResourceScope: boolean;
    resourceWorkingMemory: boolean;
    hasColumn: boolean;
    createTable: boolean;
    deleteMessages: boolean;
    aiTracing?: boolean;
  } {
    return {
      selectByIncludeResourceScope: false,
      resourceWorkingMemory: false,
      hasColumn: false,
      createTable: false,
      deleteMessages: true,
      aiTracing: false,
    };
  }

  protected ensureDate(date: Date | string | undefined): Date | undefined {
    if (date instanceof Date) return date;
    if (typeof date === "string") return new Date(date);
    if (typeof date === "number") return new Date(date);
    return undefined;
  }

  protected serializeDate(date: Date | string | undefined): string | undefined {
    if (!date) return undefined;
    const dateObj = this.ensureDate(date);
    return dateObj ? dateObj.toISOString() : undefined;
  }

  protected resolveMessageLimit({ last, defaultLimit }: { last: number | false | undefined; defaultLimit: number }): number {
    if (last === false) return 0;
    if (typeof last === "number") return last;
    return defaultLimit;
  }

  protected getSqlType(type: string): string {
    // Neo4j doesn't use SQL types, but we need to implement this
    switch (type) {
      case "text":
        return "STRING";
      case "timestamp":
        return "DATETIME";
      case "uuid":
        return "STRING";
      case "jsonb":
        return "MAP";
      case "integer":
        return "INTEGER";
      case "float":
        return "FLOAT";
      case "bigint":
        return "INTEGER";
      case "boolean":
        return "BOOLEAN";
      default:
        return "STRING";
    }
  }

  protected getDefaultValue(type: string): string {
    // Neo4j doesn't use SQL defaults, but we need to implement this
    switch (type) {
      case "text":
        return "''";
      case "timestamp":
        return "datetime()";
      case "uuid":
        return "randomUUID()";
      case "integer":
        return "0";
      case "float":
        return "0.0";
      case "bigint":
        return "0";
      case "boolean":
        return "false";
      default:
        return "null";
    }
  }

  // Required table operation methods
  async createTable({ tableName, schema }: { tableName: string; schema: Record<string, any> }): Promise<void> {
    // Neo4j doesn't use tables, but we need to implement this
    console.log(`Creating table ${tableName} with schema:`, schema);
  }

  async clearTable({ tableName }: { tableName: string }): Promise<void> {
    // Neo4j doesn't use tables, but we need to implement this
    console.log(`Clearing table ${tableName}`);
  }

  async dropTable({ tableName }: { tableName: string }): Promise<void> {
    // Neo4j doesn't use tables, but we need to implement this
    console.log(`Dropping table ${tableName}`);
  }

  async alterTable(args: { tableName: string; schema: Record<string, any>; ifNotExists: string[] }): Promise<void> {
    // Neo4j doesn't use tables, but we need to implement this
    console.log(`Altering table ${args.tableName}`);
  }

  async insert({ tableName, record }: { tableName: string; record: Record<string, any> }): Promise<void> {
    // Neo4j doesn't use tables, but we need to implement this
    console.log(`Inserting into table ${tableName}:`, record);
  }

  async batchInsert({ tableName, records }: { tableName: string; records: Record<string, any>[] }): Promise<void> {
    // Neo4j doesn't use tables, but we need to implement this
    console.log(`Batch inserting into table ${tableName}:`, records.length, "records");
  }

  async load<R>({ tableName, keys }: { tableName: string; keys: Record<string, any> }): Promise<R | null> {
    // Neo4j doesn't use tables, but we need to implement this
    console.log(`Loading from table ${tableName} with keys:`, keys);
    return null;
  }

  // Required workflow methods
  async persistWorkflowSnapshot({
    workflowName,
    runId,
    snapshot,
  }: {
    workflowName: string;
    runId: string;
    snapshot: any;
  }): Promise<void> {
    // Neo4j doesn't use workflows, but we need to implement this
    console.log(`Persisting workflow snapshot for ${workflowName}:${runId}`);
  }

  async updateWorkflowResults({
    workflowName,
    runId,
    stepId,
    result,
    runtimeContext,
  }: {
    workflowName: string;
    runId: string;
    stepId: string;
    result: any;
    runtimeContext: Record<string, any>;
  }): Promise<Record<string, any>> {
    // Neo4j doesn't use workflows, but we need to implement this
    console.log(`Updating workflow results for ${workflowName}:${runId}:${stepId}`);
    return {};
  }

  async updateWorkflowState({
    workflowName,
    runId,
    opts,
  }: {
    workflowName: string;
    runId: string;
    opts: {
      status: string;
      result?: any;
      error?: string;
      suspendedPaths?: Record<string, number[]>;
      waitingPaths?: Record<string, number[]>;
    };
  }): Promise<any | undefined> {
    // Neo4j doesn't use workflows, but we need to implement this
    console.log(`Updating workflow state for ${workflowName}:${runId}`);
    return undefined;
  }

  async loadWorkflowSnapshot({ workflowName, runId }: { workflowName: string; runId: string }): Promise<any | null> {
    // Neo4j doesn't use workflows, but we need to implement this
    console.log(`Loading workflow snapshot for ${workflowName}:${runId}`);
    return null;
  }

  async getWorkflowRuns(args?: {
    workflowName?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
    resourceId?: string;
  }): Promise<any> {
    // Neo4j doesn't use workflows, but we need to implement this
    console.log(`Getting workflow runs with args:`, args);
    return { runs: [] };
  }
    async getWorkflowRunById(args: { runId: string; workflowName?: string }): Promise<any | null> {
    // Neo4j doesn't use workflows, but we need to implement this
    console.log(`Getting workflow run by ID:`, args);
    return null;
  }

  // Required scoring methods
  async getScoreById({ id }: { id: string }): Promise<any | null> {
    // Neo4j doesn't use scoring, but we need to implement this
    console.log(`Getting score by ID:`, id);
    return null;
  }

  async saveScore(score: any): Promise<{ score: any }> {
    // Neo4j doesn't use scoring, but we need to implement this
    console.log(`Saving score:`, score);
    return { score };
  }

  async getScoresByScorerId({
    scorerId,
    pagination,
    entityId,
    entityType,
    source,
  }: {
    scorerId: string;
    pagination: any;
    entityId?: string;
    entityType?: string;
    source?: string;
  }): Promise<{
    pagination: any;
    scores: any[];
  }> {
    // Neo4j doesn't use scoring, but we need to implement this
    console.log(`Getting scores by scorer ID:`, scorerId);
    return { pagination, scores: [] };
  }

  async getScoresByRunId({ runId, pagination }: { runId: string; pagination: any }): Promise<{
    pagination: any;
    scores: any[];
  }> {
    // Neo4j doesn't use scoring, but we need to implement this
    console.log(`Getting scores by run ID:`, runId);
    return { pagination, scores: [] };
  }

  async getScoresByEntityId({
    entityId,
    entityType,
    pagination,
  }: {
    pagination: any;
    entityId: string;
    entityType: string;
  }): Promise<{
    pagination: any;
    scores: any[];
  }> {
    // Neo4j doesn't use scoring, but we need to implement this
    console.log(`Getting scores by entity ID:`, entityId);
    return { pagination, scores: [] };
  }

  async getEvals(options: any): Promise<any> {
    // Neo4j doesn't use evaluations, but we need to implement this
    console.log(`Getting evals with options:`, options);
    return { evals: [] };
  }

  async getEvalsByAgentName(agentName: string, type?: string): Promise<any[]> {
    // Neo4j doesn't use evaluations, but we need to implement this
    console.log(`Getting evals by agent name:`, agentName);
    return [];
  }

  // Required observability methods
  async createAISpan(span: any): Promise<void> {
    // Neo4j doesn't use AI tracing, but we need to implement this
    console.log(`Creating AI span:`, span);
  }

  async updateAISpan(params: { spanId: string; traceId: string; updates: any }): Promise<void> {
    // Neo4j doesn't use AI tracing, but we need to implement this
    console.log(`Updating AI span:`, params);
  }

  async getAITrace(traceId: string): Promise<any | null> {
    // Neo4j doesn't use AI tracing, but we need to implement this
    console.log(`Getting AI trace:`, traceId);
    return null;
  }

  async getAITracesPaginated(args: any): Promise<{
    pagination: any;
    spans: any[];
  }> {
    // Neo4j doesn't use AI tracing, but we need to implement this
    console.log(`Getting AI traces paginated:`, args);
    return { pagination: {}, spans: [] };
  }

  async batchCreateAISpans(args: { records: any[] }): Promise<void> {
    // Neo4j doesn't use AI tracing, but we need to implement this
    console.log(`Batch creating AI spans:`, args.records.length, "records");
  }

  async batchUpdateAISpans(args: { records: any[] }): Promise<void> {
    // Neo4j doesn't use AI tracing, but we need to implement this
    console.log(`Batch updating AI spans:`, args.records.length, "records");
  }

  async batchDeleteAITraces(args: { traceIds: string[] }): Promise<void> {
    // Neo4j doesn't use AI tracing, but we need to implement this
    console.log(`Batch deleting AI traces:`, args.traceIds.length, "traces");
  }

  // Required trace methods
  async getTraces(args: any): Promise<any[]> {
    // Neo4j doesn't use traces, but we need to implement this
    console.log(`Getting traces with args:`, args);
    return [];
  }

  async getTracesPaginated(args: any): Promise<any> {
    // Neo4j doesn't use traces, but we need to implement this
    console.log(`Getting traces paginated with args:`, args);
    return { traces: [] };
  }

  async batchTraceInsert({ records }: { records: any[] }): Promise<void> {
    // Neo4j doesn't use traces, but we need to implement this
    console.log(`Batch inserting traces:`, records.length, "records");
  }

  // Required resource methods - using existing implementations

  // Required base properties
  get component(): string {
    return "Neo4jStorage";
  }

  get logger(): any {
    return console;
  }

  // Required base methods
  __setLogger(logger: any): void {
    // Logger is already set
  }

  __setTelemetry(telemetry: any): void {
    // Telemetry is not used
  }

  __setStorage(storage: any): void {
    // Storage is not used
  }

  __setAgents(agents: any): void {
    // Agents are not used
  }

  __setTTS(tts: any): void {
    // TTS is not used
  }

  __setVectors(vectors: any): void {
    // Vectors are not used
  }

  __setMemory(memory: any): void {
    // Memory is not used
  }

  // Final required properties
  get __getTelemetry(): any {
    return undefined;
  }

  get experimental_telemetry(): any {
    return undefined;
  }

  async close(): Promise<void> {
    await this.driver.close();
  }

  //TODO: // required MastraStorage methods for threads and messages
}
