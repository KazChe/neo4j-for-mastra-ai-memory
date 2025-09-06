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

    const session = this.driver.session({ database: this.database });

    try {
      await session.run(`
        CREATE CONSTRAINT thread_id_unique IF NOT EXISTS
        FOR (t:Thread) REQUIRE t.id IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT message_id_unique IF NOT EXISTS
        FOR (m:Message) REQUIRE m.id IS UNIQUE
      `);

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

  async createTable({ tableName, schema }: { tableName: string; schema: Record<string, any> }): Promise<void> {
    console.log(`Creating table ${tableName} with schema:`, schema);
  }

  async clearTable({ tableName }: { tableName: string }): Promise<void> {
    console.log(`Clearing table ${tableName}`);
  }

  async dropTable({ tableName }: { tableName: string }): Promise<void> {
    console.log(`Dropping table ${tableName}`);
  }

  async alterTable(args: { tableName: string; schema: Record<string, any>; ifNotExists: string[] }): Promise<void> {
    console.log(`Altering table ${args.tableName}`);
  }

  async insert({ tableName, record }: { tableName: string; record: Record<string, any> }): Promise<void> {
    console.log(`Inserting into table ${tableName}:`, record);
  }

  async batchInsert({ tableName, records }: { tableName: string; records: Record<string, any>[] }): Promise<void> {
    console.log(`Batch inserting into table ${tableName}:`, records.length, "records");
  }

  async load<R>({ tableName, keys }: { tableName: string; keys: Record<string, any> }): Promise<R | null> {
    console.log(`Loading from table ${tableName} with keys:`, keys);
    return null;
  }

  async persistWorkflowSnapshot({
    workflowName,
    runId,
    snapshot,
  }: {
    workflowName: string;
    runId: string;
    snapshot: any;
  }): Promise<void> {
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
    console.log(`Updating workflow state for ${workflowName}:${runId}`);
    return undefined;
  }

  async loadWorkflowSnapshot({ workflowName, runId }: { workflowName: string; runId: string }): Promise<any | null> {
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
    console.log(`Getting workflow runs with args:`, args);
    return { runs: [] };
  }
  async getWorkflowRunById(args: { runId: string; workflowName?: string }): Promise<any | null> {
    console.log(`Getting workflow run by ID:`, args);
    return null;
  }

  async getScoreById({ id }: { id: string }): Promise<any | null> {
    console.log(`Getting score by ID:`, id);
    return null;
  }

  async saveScore(score: any): Promise<{ score: any }> {
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
    console.log(`Getting scores by scorer ID:`, scorerId);
    return { pagination, scores: [] };
  }

  async getScoresByRunId({ runId, pagination }: { runId: string; pagination: any }): Promise<{
    pagination: any;
    scores: any[];
  }> {
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
    console.log(`Getting scores by entity ID:`, entityId);
    return { pagination, scores: [] };
  }

  async getEvals(options: any): Promise<any> {
    console.log(`Getting evals with options:`, options);
    return { evals: [] };
  }

  async getEvalsByAgentName(agentName: string, type?: string): Promise<any[]> {
    console.log(`Getting evals by agent name:`, agentName);
    return [];
  }

  async createAISpan(span: any): Promise<void> {
    console.log(`Creating AI span:`, span);
  }

  async updateAISpan(params: { spanId: string; traceId: string; updates: any }): Promise<void> {
    console.log(`Updating AI span:`, params);
  }

  async getAITrace(traceId: string): Promise<any | null> {
    console.log(`Getting AI trace:`, traceId);
    return null;
  }

  async getAITracesPaginated(args: any): Promise<{
    pagination: any;
    spans: any[];
  }> {
    console.log(`Getting AI traces paginated:`, args);
    return { pagination: {}, spans: [] };
  }

  async batchCreateAISpans(args: { records: any[] }): Promise<void> {
    console.log(`Batch creating AI spans:`, args.records.length, "records");
  }

  async batchUpdateAISpans(args: { records: any[] }): Promise<void> {
    console.log(`Batch updating AI spans:`, args.records.length, "records");
  }

  async batchDeleteAITraces(args: { traceIds: string[] }): Promise<void> {
    console.log(`Batch deleting AI traces:`, args.traceIds.length, "traces");
  }

  async getTraces(args: any): Promise<any[]> {
    console.log(`Getting traces with args:`, args);
    return [];
  }

  async getTracesPaginated(args: any): Promise<any> {
    console.log(`Getting traces paginated with args:`, args);
    return { traces: [] };
  }

  async batchTraceInsert({ records }: { records: any[] }): Promise<void> {
    console.log(`Batch inserting traces:`, records.length, "records");
  }

  get component(): string {
    return "Neo4jStorage";
  }

  get logger(): any {
    return console;
  }

  __setLogger(logger: any): void {}

  __setTelemetry(telemetry: any): void {}

  __setStorage(storage: any): void {}

  __setAgents(agents: any): void {}

  __setTTS(tts: any): void {}

  __setVectors(vectors: any): void {}

  __setMemory(memory: any): void {}

  get __getTelemetry(): any {
    return undefined;
  }

  get experimental_telemetry(): any {
    return undefined;
  }

  async close(): Promise<void> {
    await this.driver.close();
  }

  async saveThread(thread: any): Promise<any> {
    return this.createThread(thread);
  }

  async getThread(threadId: string): Promise<any | null> {
    return this.getThreadById({ threadId });
  }

  async deleteThread({ threadId }: { threadId: string }): Promise<void> {
    return this.deleteThreadById(threadId);
  }

  async saveMessages(args: { messages: any[]; format?: "v1" | "v2" }): Promise<any[]> {
    let messageArray: any[] = [];

    if (args.messages && Array.isArray(args.messages)) {
      messageArray = args.messages;
    } else {
      messageArray = [args.messages];
    }

    const results = [];
    for (const message of messageArray) {
      const result = await this.createMessage(message);
      results.push(result);
    }
    return results;
  }

  async getMessages(args: {
    threadId: string;
    resourceId?: string;
    selectBy?: {
      vectorSearchString?: string;
      last?: number | false;
      include?: {
        id: string;
        threadId?: string;
        withPreviousMessages?: number;
        withNextMessages?: number;
      }[];
      pagination?: {
        page?: number;
        perPage?: number;
        dateRange?: {
          start?: Date;
          end?: Date;
        };
      };
    };
    threadConfig?: any;
    format?: "v1" | "v2";
  }): Promise<any[]> {
    console.log("🔍 Neo4jStorage.getMessages called with:", JSON.stringify(args, null, 2));

    const last = args.selectBy?.last;
    const limit = typeof last === "number" ? last : 100;

    console.log("🔍 getMessages: threadId =", args.threadId, "limit =", limit);

    const messages = await this.getMessagesByThreadId(args.threadId, { limit });
    console.log("🔍 getMessages: retrieved", messages.length, "messages");

    return messages;
  }
  async getMessagesPaginated(args: {
    threadId: string;
    resourceId?: string;
    selectBy?: {
      vectorSearchString?: string;
      last?: number | false;
      include?: {
        id: string;
        threadId?: string;
        withPreviousMessages?: number;
        withNextMessages?: number;
      }[];
      pagination?: {
        page?: number;
        perPage?: number;
        dateRange?: {
          start?: Date;
          end?: Date;
        };
      };
    };
    threadConfig?: any;
    format?: "v1" | "v2";
  }): Promise<{
    messages: any[];
    total: number;
    page: number;
    perPage: number;
    hasMore: boolean;
  }> {
    const page = args.selectBy?.pagination?.page || 0;
    const perPage = args.selectBy?.pagination?.perPage || 10;
    const offset = page * perPage;

    // Get total count
    const session = this.driver.session({ database: this.database });
    try {
      const countResult = await session.run(
        `
          MATCH (t:Thread {id: $threadId})-[r:CONTAINS]->(m:Message)
          RETURN count(m) as total
        `,
        { threadId: args.threadId }
      );
      const total = countResult.records[0]?.get("total").toNumber() || 0;

      // Get paginated messages
      const messages = await this.getMessagesByThreadId(args.threadId, {
        limit: perPage,
        offset,
      });

      const hasMore = (page + 1) * perPage < total;

      return {
        messages,
        total,
        page,
        perPage,
        hasMore,
      };
    } finally {
      await session.close();
    }
  }

  async getMessagesById({ messageIds, format }: { messageIds: string[]; format?: "v1" | "v2" }): Promise<any[]> {
    if (messageIds.length === 0) return [];

    const session = this.driver.session({ database: this.database });
    try {
      const result = await session.run(
        `
        MATCH (m:Message)
        WHERE m.id IN $messageIds
        RETURN m
        ORDER BY m.createdAt ASC
      `,
        { messageIds }
      );

      return result.records.map((record) => this.mapNeo4jNodeToMessage(record.get("m")));
    } finally {
      await session.close();
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    return this.deleteMessageById(messageId);
  }

  async createThread(thread: any): Promise<any> {
    const session = this.driver.session({ database: this.database });

    try {
      const now = new Date();
      const threadData = {
        id: thread.id || `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        resourceId: thread.resourceId || "default",
        title: thread.title || "Untitled Thread",
        createdAt: thread.createdAt || now,
        updatedAt: thread.updatedAt || now,
        metadata: thread.metadata || {},
      };

      const result = await session.run(
        `
        CREATE (t:Thread {
          id: $id,
          resourceId: $resourceId,
          title: $title,
          createdAt: datetime($createdAt),
          updatedAt: datetime($updatedAt),
          metadata: $metadata
        })
        RETURN t
      `,
        {
          id: threadData.id,
          resourceId: threadData.resourceId,
          title: threadData.title,
          createdAt: threadData.createdAt.toISOString(),
          updatedAt: threadData.updatedAt.toISOString(),
          metadata: JSON.stringify(threadData.metadata),
        }
      );

      return this.mapNeo4jNodeToThread(result.records[0]?.get("t"));
    } finally {
      await session.close();
    }
  }

  async getThreadById({ threadId }: { threadId: string }): Promise<any | null> {
    const session = this.driver.session({ database: this.database });

    try {
      const result = await session.run(
        `
        MATCH (t:Thread {id: $threadId})
        RETURN t
      `,
        { threadId }
      );

      if (result.records.length === 0) {
        return null;
      }

      return this.mapNeo4jNodeToThread(result.records[0].get("t"));
    } finally {
      await session.close();
    }
  }

  async getThreadsByResourceId({
    resourceId,
    orderBy,
    sortDirection,
  }: {
    resourceId: string;
    orderBy?: string;
    sortDirection?: string;
  }): Promise<any[]> {
    const session = this.driver.session({ database: this.database });

    try {
      const finalOrderBy = orderBy || "createdAt";
      const finalSortDirection = sortDirection || "DESC";

      const result = await session.run(
        `
        MATCH (t:Thread {resourceId: $resourceId})
        RETURN t
        ORDER BY t.${finalOrderBy} ${finalSortDirection}
      `,
        { resourceId }
      );

      return result.records.map((record) => this.mapNeo4jNodeToThread(record.get("t")));
    } finally {
      await session.close();
    }
  }

  async getThreadsByResourceIdPaginated(args: {
    resourceId: string;
    page: number;
    perPage: number;
    orderBy?: string;
    sortDirection?: string;
  }): Promise<{
    threads: any[];
    total: number;
    page: number;
    perPage: number;
    hasMore: boolean;
  }> {
    const session = this.driver.session({ database: this.database });

    try {
      const orderBy = args.orderBy || "createdAt";
      const sortDirection = args.sortDirection || "DESC";
      const offset = args.page * args.perPage;

      const countResult = await session.run(
        `
        MATCH (t:Thread {resourceId: $resourceId})
        RETURN count(t) as total
      `,
        { resourceId: args.resourceId }
      );
      const total = countResult.records[0]?.get("total").toNumber() || 0;

      const result = await session.run(
        `
        MATCH (t:Thread {resourceId: $resourceId})
        RETURN t
        ORDER BY t.${orderBy} ${sortDirection}
        SKIP $offset
        LIMIT $perPage
      `,
        {
          resourceId: args.resourceId,
          offset,
          perPage: args.perPage,
        }
      );

      const threads = result.records.map((record) => this.mapNeo4jNodeToThread(record.get("t")));
      const hasMore = (args.page + 1) * args.perPage < total;

      return {
        threads,
        total,
        page: args.page,
        perPage: args.perPage,
        hasMore,
      };
    } finally {
      await session.close();
    }
  }

  async updateThread(threadId: string, updates: any): Promise<any> {
    const session = this.driver.session({ database: this.database });

    try {
      const setClause = Object.keys(updates)
        .filter((key) => key !== "id")
        .map((key) => `t.${key} = $${key}`)
        .join(", ");

      const result = await session.run(
        `
        MATCH (t:Thread {id: $threadId})
        SET ${setClause}, t.updatedAt = datetime()
        RETURN t
      `,
        { threadId, ...updates }
      );

      if (result.records.length === 0) {
        return null;
      }

      return this.mapNeo4jNodeToThread(result.records[0].get("t"));
    } finally {
      await session.close();
    }
  }

  async deleteThreadById(threadId: string): Promise<void> {
    const session = this.driver.session({ database: this.database });

    try {
      await session.run(
        `
        MATCH (t:Thread {id: $threadId})
        DETACH DELETE t
      `,
        { threadId }
      );
    } finally {
      await session.close();
    }
  }

  async createMessage(message: any): Promise<any> {
    const session = this.driver.session({ database: this.database });

    try {
      const now = new Date();

      let content = "";
      if (message.content) {
        if (typeof message.content === "string") {
          content = message.content;
        } else if (message.content.content) {
          content = message.content.content;
        } else if (message.content.parts && message.content.parts[0] && message.content.parts[0].text) {
          content = message.content.parts[0].text;
        }
      }

      const messageData = {
        id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threadId: message.threadId || "default",
        role: message.role || "user",
        content: content,
        createdAt: message.createdAt || now,
        metadata: message.metadata || {},
      };

      await session.run(
        `
        MERGE (t:Thread {id: $threadId})
        ON CREATE SET t.resourceId = $resourceId,
                      t.title = $title,
                      t.createdAt = datetime($createdAt),
                      t.updatedAt = datetime($updatedAt),
                      t.metadata = $metadata
      `,
        {
          threadId: messageData.threadId,
          resourceId: message.resourceId || "default",
          title: message.title || "Auto-created Thread",
          createdAt: messageData.createdAt.toISOString(),
          updatedAt: messageData.createdAt.toISOString(),
          metadata: JSON.stringify({}),
        }
      );

      const result = await session.run(
        `
        MATCH (t:Thread {id: $threadId})
        CREATE (m:Message {
          id: $id,
          threadId: $threadId,
          role: $role,
          content: $content,
          createdAt: datetime($createdAt),
          metadata: $metadata
        })
        CREATE (t)-[:CONTAINS]->(m)
        RETURN m
      `,
        {
          id: messageData.id,
          threadId: messageData.threadId,
          role: messageData.role,
          content: messageData.content,
          createdAt: messageData.createdAt.toISOString(),
          metadata: JSON.stringify(messageData.metadata),
        }
      );

      const messageNode = result.records[0]?.get("m");
      if (!messageNode) {
        throw new Error(`Failed to create message with id: ${messageData.id}`);
      }

      await this.createMessageEntities(session, messageData);

      return this.mapNeo4jNodeToMessage(messageNode);
    } finally {
      await session.close();
    }
  }

  async getMessagesByThreadId(threadId: string, options?: any): Promise<any[]> {
    const session = this.driver.session({ database: this.database });

    try {
      const limit = Math.floor(options?.limit || 100);
      const offset = Math.floor(options?.offset || 0);

      const result = await session.run(
        `
        MATCH (t:Thread {id: $threadId})-[r:CONTAINS]->(m:Message)
        RETURN t, r, m
        ORDER BY m.createdAt ASC
        SKIP toInteger($offset)
        LIMIT toInteger($limit)
      `,
        { threadId, offset, limit }
      );

      return result.records.map((record) => this.mapNeo4jNodeToMessage(record.get("m")));
    } finally {
      await session.close();
    }
  }

  async updateMessage(messageId: string, updates: any): Promise<any> {
    const session = this.driver.session({ database: this.database });

    try {
      const setClause = Object.keys(updates)
        .filter((key) => key !== "id")
        .map((key) => `m.${key} = $${key}`)
        .join(", ");

      const result = await session.run(
        `
        MATCH (m:Message {id: $messageId})
        SET ${setClause}
        RETURN m
      `,
        { messageId, ...updates }
      );

      if (result.records.length === 0) {
        return null;
      }

      return this.mapNeo4jNodeToMessage(result.records[0].get("m"));
    } finally {
      await session.close();
    }
  }

  async updateMessages(args: {
    messages: Partial<{
      id: string;
      content?: {
        metadata?: any;
        content?: any;
      };
    }>[];
  }): Promise<any[]> {
    const results = [];
    for (const message of args.messages) {
      if (message.id) {
        const result = await this.updateMessage(message.id, message);
        if (result) results.push(result);
      }
    }
    return results;
  }

  async deleteMessages(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;

    const session = this.driver.session({ database: this.database });
    try {
      await session.run(
        `
        MATCH (m:Message)
        WHERE m.id IN $messageIds
        DETACH DELETE m
      `,
        { messageIds }
      );
    } finally {
      await session.close();
    }
  }

  async deleteMessageById(messageId: string): Promise<void> {
    const session = this.driver.session({ database: this.database });

    try {
      await session.run(
        `
        MATCH (m:Message {id: $messageId})
        DETACH DELETE m
      `,
        { messageId }
      );
    } finally {
      await session.close();
    }
  }

  private async createMessageEntities(session: any, messageData: any): Promise<void> {
    const content = messageData.content;
    if (!content || content.length < 3) return;

    const entities = this.extractEntities(content);

    for (const entity of entities) {
      await this.createEntityNode(session, entity, messageData);
    }

    await this.createEntityRelationships(session, entities, messageData);
  }

  private extractEntities(text: string): Array<{ type: string; value: string; confidence: number }> {
    const entities: Array<{ type: string; value: string; confidence: number }> = [];

    // extract names (capitalized words that could be names)
    const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const names = text.match(namePattern) || [];
    names.forEach((name) => {
      if (name.length > 2 && !this.isCommonWord(name) && !this.isPronoun(name)) {
        // only extract names that appear in context of introduction or reference
        if (text.includes(`name is ${name}`) || text.includes(`I'm ${name}`) || text.includes(`call me ${name}`)) {
          entities.push({ type: "Person", value: name, confidence: 0.9 });
        }
      }
    });

    // extract topics/interests (words after "love", "like", "interested in", etc.)
    const interestPattern = /(?:love|like|enjoy|interested in|passionate about)\s+([^.!?]+)/gi;
    const interests = text.match(interestPattern) || [];
    interests.forEach((interest) => {
      const topic = interest.replace(/(?:love|like|enjoy|interested in|passionate about)\s+/gi, "").trim();
      // only extract meaningful topics (not too long or vague)
      if (topic.length > 2 && topic.length < 50 && !topic.includes("to discuss") && !topic.includes("about them")) {
        entities.push({ type: "Topic", value: topic, confidence: 0.8 });
      }
    });

    // extract technologies (common tech terms)
    const techPattern =
      /\b(?:graph database|neo4j|database|AI|machine learning|python|javascript|typescript|react|node\.?js)\b/gi;
    const techs = text.match(techPattern) || [];
    techs.forEach((tech) => {
      entities.push({ type: "Technology", value: tech.toLowerCase(), confidence: 0.9 });
    });

    // extract questions
    if (text.includes("?")) {
      const questionWords = ["what", "how", "why", "when", "where", "who"];
      const hasQuestionWord = questionWords.some((word) => text.toLowerCase().includes(word));
      if (hasQuestionWord) {
        entities.push({ type: "Question", value: text.substring(0, 50) + "...", confidence: 0.6 });
      }
    }

    return entities;
  }

  // check if a word is too common to be a meaningful entity
  private isCommonWord(word: string): boolean {
    const commonWords = ["The", "This", "That", "There", "Here", "Hello", "Hi", "Yes", "No", "Thank", "Please"];
    return commonWords.includes(word);
  }

  // check if a word is a pronoun or common word that shouldn't be treated as a person
  private isPronoun(word: string): boolean {
    const pronouns = ["They", "What", "Could", "Would", "Should", "Will", "Can", "May", "Might", "Must", "Shall"];
    return pronouns.includes(word);
  }

  // create entity nodes and relationships
  private async createEntityNode(
    session: any,
    entity: { type: string; value: string; confidence: number },
    messageData: any
  ): Promise<void> {
    try {
      await session.run(
        `
        MATCH (m:Message {id: $messageId})
        MERGE (e:Entity {type: $type, value: $value})
        ON CREATE SET e.confidence = $confidence, e.createdAt = datetime()
        ON MATCH SET e.confidence = CASE 
          WHEN e.confidence < $confidence THEN $confidence 
          ELSE e.confidence 
        END
        CREATE (m)-[:MENTIONS {confidence: $confidence}]->(e)
        `,
        {
          messageId: messageData.id,
          type: entity.type,
          value: entity.value,
          confidence: entity.confidence,
        }
      );
    } catch (error) {
      // silently continue if entity creation fails
      console.warn(`Failed to create entity: ${entity.type}:${entity.value}`, error);
    }
  }

  // create relationships between entities mentioned in the same message
  private async createEntityRelationships(
    session: any,
    entities: Array<{ type: string; value: string; confidence: number }>,
    messageData: any
  ): Promise<void> {
    if (entities.length < 2) return;

    try {
      // create relationships between different entity types
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const entity1 = entities[i];
          const entity2 = entities[j];

          // create meaningful relationships based on entity types
          let relationshipType = "RELATED_TO";
          if (entity1.type === "Person" && entity2.type === "Topic") {
            relationshipType = "INTERESTED_IN";
          } else if (entity1.type === "Person" && entity2.type === "Technology") {
            relationshipType = "USES";
          } else if (entity1.type === "Topic" && entity2.type === "Technology") {
            relationshipType = "IMPLEMENTS";
          }

          await session.run(
            `
            MATCH (e1:Entity {type: $type1, value: $value1})
            MATCH (e2:Entity {type: $type2, value: $value2})
            MERGE (e1)-[r:${relationshipType}]->(e2)
            ON CREATE SET r.confidence = $confidence, r.createdAt = datetime()
            ON MATCH SET r.confidence = CASE 
              WHEN r.confidence < $confidence THEN $confidence 
              ELSE r.confidence 
            END
            `,
            {
              type1: entity1.type,
              value1: entity1.value,
              type2: entity2.type,
              value2: entity2.value,
              confidence: Math.min(entity1.confidence, entity2.confidence),
            }
          );
        }
      }
    } catch (error) {
      console.warn("Failed to create entity relationships", error);
    }
  }

  // helper methods to map neo4j nodes to mastra objects
  private mapNeo4jNodeToThread(node: any): any {
    if (!node) return null;

    return {
      id: node.properties.id,
      resourceId: node.properties.resourceId,
      title: node.properties.title,
      createdAt: new Date(node.properties.createdAt.toString()),
      updatedAt: new Date(node.properties.updatedAt.toString()),
      metadata: node.properties.metadata ? JSON.parse(node.properties.metadata) : {},
    };
  }

  private mapNeo4jNodeToMessage(node: any): any {
    if (!node) return null;

    return {
      id: node.properties.id,
      threadId: node.properties.threadId,
      role: node.properties.role,
      content: node.properties.content,
      createdAt: new Date(node.properties.createdAt.toString()),
      metadata: node.properties.metadata ? JSON.parse(node.properties.metadata) : {},
    };
  }

  // additional methods that might be required by mastrastorage interface
  async query(query: string, parameters?: any): Promise<any[]> {
    const session = this.driver.session({ database: this.database });

    try {
      const result = await session.run(query, parameters || {});
      return result.records.map((record) => record.toObject());
    } finally {
      await session.close();
    }
  }

  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    const session = this.driver.session({ database: this.database });

    try {
      return await session.executeWrite(callback);
    } finally {
      await session.close();
    }
  }

  // additional required methods for mastrastorage compatibility
  async saveResource(resource: any): Promise<any> {
    const session = this.driver.session({ database: this.database });

    try {
      const result = await session.run(
        `
        MERGE (r:Resource {id: $id})
        SET r.metadata = $metadata,
            r.updatedAt = datetime()
        RETURN r
      `,
        {
          id: resource.id,
          metadata: JSON.stringify(resource.metadata || {}),
        }
      );

      return this.mapNeo4jNodeToResource(result.records[0]?.get("r"));
    } finally {
      await session.close();
    }
  }

  async getResourceById({ resourceId }: { resourceId: string }): Promise<any | null> {
    const session = this.driver.session({ database: this.database });

    try {
      const result = await session.run(
        `
        MATCH (r:Resource {id: $resourceId})
        RETURN r
      `,
        { resourceId }
      );

      if (result.records.length === 0) {
        return null;
      }

      return this.mapNeo4jNodeToResource(result.records[0].get("r"));
    } finally {
      await session.close();
    }
  }

  async updateResource(resourceId: string, updates: any): Promise<any> {
    const session = this.driver.session({ database: this.database });

    try {
      const setClause = Object.keys(updates)
        .filter((key) => key !== "id")
        .map((key) => `r.${key} = $${key}`)
        .join(", ");

      const result = await session.run(
        `
        MATCH (r:Resource {id: $resourceId})
        SET ${setClause}, r.updatedAt = datetime()
        RETURN r
      `,
        { resourceId, ...updates }
      );

      if (result.records.length === 0) {
        return null;
      }

      return this.mapNeo4jNodeToResource(result.records[0].get("r"));
    } finally {
      await session.close();
    }
  }

  private mapNeo4jNodeToResource(node: any): any {
    if (!node) return null;

    return {
      id: node.properties.id,
      metadata: node.properties.metadata ? JSON.parse(node.properties.metadata) : {},
      updatedAt: new Date(node.properties.updatedAt.toString()),
    };
  }

  // batch operations
  async batch(operations: any[]): Promise<any[]> {
    const session = this.driver.session({ database: this.database });

    try {
      const results = [];
      for (const operation of operations) {
        const result = await session.run(operation.query, operation.parameters || {});
        results.push(result.records.map((record) => record.toObject()));
      }
      return results;
    } finally {
      await session.close();
    }
  }

  // health check
  async healthCheck(): Promise<boolean> {
    try {
      const session = this.driver.session({ database: this.database });
      await session.run("RETURN 1");
      await session.close();
      return true;
    } catch (error) {
      return false;
    }
  }
}
