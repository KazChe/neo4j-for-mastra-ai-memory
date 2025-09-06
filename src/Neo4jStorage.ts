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
  //TODO:create constraints and indexes for Mastra data

  //TODO:create constraints for mastrathreads

  //TODO:create constraints for messages

  //TODO: create indexes for performance

  //TODO: implement MastraStorage interface methods with Neo4j implementation

}