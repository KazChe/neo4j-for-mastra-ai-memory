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
}
