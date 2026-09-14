import { OllamaDesignProvider } from "../src/providers/ollama-provider.js";

async function test() {
  const provider = new OllamaDesignProvider({ baseDir: process.cwd() });
  console.log("Generating screen on Ollama GPU...");
  const prompt = "A social feed for a neighborhood dog walking app where owners share photos and rate parks, with a warm friendly color palette";
  const screen = await provider.generateScreen("test-proj", prompt);
  console.log("Generated screenId:", screen.screenId);
  console.log("HTML length:", screen.htmlContent.length);
  console.log("HTML snippet:", screen.htmlContent.slice(0, 300));
}

test().catch(console.error);
