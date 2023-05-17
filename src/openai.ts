import * as vscode from "vscode";
const config = vscode.workspace.getConfiguration("junior");
const { Configuration, OpenAIApi } = require("openai");
const openAiApiKey = config.get("openAIKey");
const openAiConfiguration = new Configuration({
  apiKey: openAiApiKey,
});
const openai = new OpenAIApi(openAiConfiguration);
import { encoding_for_model } from "tiktoken";
const encoding = encoding_for_model("gpt-3.5-turbo");

export function countTokens(text: string): number {
  const tokens = encoding.encode(text).length;
  return tokens;
}

export function countTotalTokens(messages: string[]): number {
  let totalTokens = 0;
  for (const message of messages) {
    totalTokens += countTokens(message);
  }
  return totalTokens;
}

function trimToMaxTokens(
  conversation: { role: string; content: string }[],
  maxLenTokens: number
): { conversation: { role: string; content: string }[]; length: number } {
  conversation = conversation.slice().reverse();
  let tokenCount = 0;
  let trimmedConversation: { role: string; content: string }[] = [];
  for (const obj of conversation) {
    const tokenLen = countTokens(obj.content);
    if (tokenCount + tokenLen < maxLenTokens) {
      trimmedConversation.push(obj);
      tokenCount += tokenLen;
    }
  }
  return { conversation: trimmedConversation.reverse(), length: tokenCount };
}

function prepareConversation(
  prompt: string[],
  systemGuide: string[],
  assistants: string[]
): { role: string; content: string }[] {
  const conversation = prompt.map((c) => ({ role: "user", content: c }));
  const systemPrompt = systemGuide.map((s) => ({ role: "system", content: s }));
  const assistPrompt = assistants.map((a) => ({
    role: "assistant",
    content: a,
  }));
  return [...conversation, ...systemPrompt, ...assistPrompt];
}

export async function queryConversationOneHit(
  prompt: string,
  fast = false
): Promise<string> {
  return await queryConversation([prompt], [], [], 3500, fast);
}

export async function getModels() {
  try {
    const models = await openai.listModels();
    return models.data.data.map((d: { id: any; }) => d.id);
  } catch (e) {
    throw new Error(`ai error: ${e}`);
  }
}

export async function queryConversation(
  prompt: string[] = [],
  systemGuide: string[] = [],
  assistants: string[] = [],
  maxLen = 3500,
  fast = false
): Promise<string> {
  const messages = prepareConversation(prompt, systemGuide, assistants);
  const trimmedMessages = trimToMaxTokens(messages, maxLen);
  const tokenCount = trimmedMessages.length;
  const maxTokens = maxLen - tokenCount;
  let model = fast ? "gpt-3.5-turbo" : "gpt-4";

  try {
    const aiResponse = await openai.createChatCompletion({
      model: model,
      messages: trimmedMessages.conversation,
      max_tokens: maxTokens,
    });
    return aiResponse.data.choices[0].message.content;
  } catch (e) {
    throw new Error(`ai error: ${e}`);
  }
}


export async function queryConversationWithProgress(
  prompt: string[] = [],
  systemGuide: string[] = [],
  assistants: string[] = [],
  maxLen = 3500,
  fast = false,
  onProgress?: (progress: number) => void
): Promise<string> {
  const messages = prepareConversation(prompt, systemGuide, assistants);
  const trimmedMessages = trimToMaxTokens(messages, maxLen);
  const tokenCount = trimmedMessages.length;
  const maxTokens = maxLen - tokenCount;
  let model = fast ? "gpt-3.5-turbo" : "gpt-4";

  try {
    // Start progress at 0
    let progress = 0;
    if (onProgress) {
      onProgress(progress);
    }
    // Start a timer that increases progress every second
    const progressInterval = setInterval(() => {
      if (progress < 0.95) {
        // Make sure progress never quite reaches 1 until it's actually done
        progress += 0.01;
        if (onProgress) {
          onProgress(progress);
        }
      }
    }, 1000);

    const aiResponse = await openai.createChatCompletion({
      model: model,
      messages: trimmedMessages.conversation,
      max_tokens: maxTokens,
    });

    // When the operation is done, clear the timer and set progress to 1
    clearInterval(progressInterval);
    if (onProgress) {
      onProgress(1);
    }

    return aiResponse.data.choices[0].message.content;
  } catch (e) {
    throw new Error(`ai error: ${e}`);
  }
}
