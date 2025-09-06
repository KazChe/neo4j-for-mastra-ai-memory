import { Neo4jStorage } from "../Neo4jStorage";
import { createTool } from "@mastra/core/tools";
import z from "zod";
import dotenv from "dotenv";
dotenv.config();

const AGENT_ID = "aura-instance-agent";

// create a neo4j storage instance for the tools
const neo4jStorage = new Neo4jStorage({
  uri: process.env.NEO4J_URI || "",
  username: process.env.NEO4J_USERNAME || "",
  password: process.env.NEO4J_PASSWORD || "",
  database: process.env.NEO4J_DATABASE || "",
});

export const auraMemorizeTool = createTool({
  id: "Aura-memorize",
  description: "Save important information about questions and information that user provides you.",
  inputSchema: z.object({
    statement: z.string().describe("Information about Aura instances, instance IDs, or any data that the user gives you."),
    thread: z.string().describe("Thread ID to save the information to"),
    resource: z.string().describe("Resource ID (usually user ID)"),
  }),
  execute: async ({ context }) => {
    try {
      // ensure storage is initialized
      await ensureStorageInitialized();

      // create a memory message
      const memoryMessage = {
        id: `memory-${Date.now()}`,
        threadId: context.thread,
        resourceId: context.resource,
        role: "assistant",
        content: context.statement,
        type: "text",
        createdAt: new Date(),
        metadata: {
          agent_id: AGENT_ID,
          memory_type: "aura_information",
          source: "user_input",
        },
      };

      // save to neo4j
      await neo4jStorage.saveMessages({
        messages: [memoryMessage],
        format: "v2",
      });

      return {
        success: true,
        message: `"${context.statement}" saved to Neo4j memory.`,
      };
    } catch (error) {
      console.error("Error saving to memory:", error);
      return {
        success: false,
        message: `Failed to save: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

export const auraRememberTool = createTool({
  id: "Aura-remember",
  description: "Recall previously saved information about the user, and or details about aura instances",
  inputSchema: z.object({
    question: z.string().describe("Question about Aura instances, preferences, or past interactions to look up."),
    thread: z.string().describe("Thread ID to search in"),
    resource: z.string().describe("Resource ID (usually user ID)"),
  }),
  outputSchema: z.object({
    answer: z.string().describe("The recalled information about previous interactions."),
    memoriesFound: z.number().describe("Number of relevant memories found"),
  }),
  execute: async ({ context }) => {
    try {
      // ensure storage is initialized
      await ensureStorageInitialized();

      // get recent messages from the thread
      const messages = await neo4jStorage.getMessages({
        threadId: context.thread,
        resourceId: context.resource,
        selectBy: { last: 20 }, // get last 20 messages
      });

      // filter for memory messages
      const memoryMessages = messages.filter(
        (msg) => msg.metadata?.memory_type === "aura_information" && msg.metadata?.agent_id === AGENT_ID
      );

      if (memoryMessages.length === 0) {
        return {
          answer: "No relevant Aura instance information found in memory.",
          memoriesFound: 0,
        };
      }

      // create a summary of memories
      const memorySummary = memoryMessages.map((msg) => msg.content).join("\n- ");

      return {
        answer: `Found ${memoryMessages.length} relevant memories:\n- ${memorySummary}`,
        memoriesFound: memoryMessages.length,
      };
    } catch (error) {
      console.error("Error retrieving from memory:", error);
      return {
        answer: `Error retrieving memories: ${error instanceof Error ? error.message : String(error)}`,
        memoriesFound: 0,
      };
    }
  },
});

// initialize storage lazily when first tool is used
let storageInitialized = false;

async function ensureStorageInitialized() {
  if (!storageInitialized) {
    try {
      await neo4jStorage.initialize();
      storageInitialized = true;
      console.log("✅ Neo4j storage initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Neo4j storage:", error);
      throw error;
    }
  }
}
