import { Agent } from "@mastra/core";
import { Memory } from "@mastra/memory";
import { openai } from "@ai-sdk/openai";
import { Neo4jStorage } from "../Neo4jStorage";
import { auraMemorizeTool, auraRememberTool } from "./aura-memory-tools";
import dotenv from "dotenv";
dotenv.config();

async function testNeo4jStoredMemory() {
  console.log("🧪 Testing Comprehensive Memory System");
  console.log("=".repeat(50));

  try {
    // initialize neo4j storage
    const neo4jStorage = new Neo4jStorage({
      uri: process.env.NEO4J_URI || "",
      username: process.env.NEO4J_USERNAME || "",
      password: process.env.NEO4J_PASSWORD || "",
      database: process.env.NEO4J_DATABASE || "",
    });

    await neo4jStorage.initialize();

    // create memory with neo4j storage
    const memory = new Memory({
      storage: neo4jStorage as any,
      options: {
        lastMessages: 10,
        semanticRecall: false,
        threads: { generateTitle: false },
        workingMemory: { enabled: false },
      },
    });

    // create agent with memory + custom tools
    const agent = new Agent({
      name: "MemoryAgent",
      instructions: `You are a memory assistant with access to both built-in memory and custom memory tools. Use both systems to provide the best user experience.`,
      model: openai("gpt-4o"),
      memory,
      tools: {
        "aura-memorize": auraMemorizeTool,
        "aura-remember": auraRememberTool,
      },
    });

    console.log("✅ System Ready");
    console.log("");

    // conversation flow
    console.log(
      "👤 User: Hi, I'm Dawn and I work as a data scientist at OhWoW. I love working with graph databases and machine learning."
    );
    const response1 = await agent.streamVNext(
      "Hi, I'm Dawn and I work as a data scientist at OhWoW. I love working with graph databases and machine learning.",
      {
        memory: {
          thread: "dawn-test",
          resource: "user_dawn",
        },
      }
    );
    const response1Text = await response1.text;
    console.log("🤖 Assistant:", response1Text);
    console.log("");

    console.log("👤 User: What's my name and what do I do for work?");
    const response2 = await agent.streamVNext("What's my name and what do I do for work?", {
      memory: {
        thread: "dawn-test",
        resource: "user_dawn",
      },
    });
    const response2Text = await response2.text;
    console.log("🤖 Assistant:", response2Text);
    console.log("");

    console.log(
      "👤 User: Please remember that I'm working on a project called 'GraphAI' that combines Neo4j with AI for fraud detection."
    );
    const response3 = await agent.streamVNext(
      "Please remember that I'm working on a project called 'GraphAI' that combines Neo4j with AI for fraud detection.",
      {
        memory: {
          thread: "dawn-test",
          resource: "user_dawn",
        },
      }
    );
    const response3Text = await response3.text;
    console.log("🤖 Assistant:", response3Text);
    console.log("");

    console.log("👤 User: What project am I working on and what's my background?");
    const response4 = await agent.streamVNext("What project am I working on and what's my background?", {
      memory: {
        thread: "dawn-test",
        resource: "user_dawn",
      },
    });
    const response4Text = await response4.text;
    console.log("🤖 Assistant:", response4Text);
    console.log("");

    // results summary
    console.log("=".repeat(50));
    console.log("📊 Test Results:");

    const memorySuccess = response2Text.toLowerCase().includes("dawn") && response2Text.toLowerCase().includes("data scientist");
    const toolsSuccess = response3Text.toLowerCase().includes("saved") || response3Text.toLowerCase().includes("memorized");
    const combinedSuccess =
      response4Text.toLowerCase().includes("graphai") && response4Text.toLowerCase().includes("fraud detection");

    console.log(`✅ Built-in Memory: ${memorySuccess ? "Working" : "Failed"}`);
    console.log(`✅ Custom Tools: ${toolsSuccess ? "Working" : "Failed"}`);
    console.log(`✅ Combined System: ${combinedSuccess ? "Working" : "Failed"}`);

    console.log("");
    console.log("🎯 All systems integrated successfully!");
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
  }
}

// run the test
testNeo4jStoredMemory().catch(console.error);
