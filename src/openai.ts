import * as vscode from "vscode";
import { IncomingMessage } from 'http';
import dotenv from 'dotenv';

dotenv.config();

const openAiApiKey: string = process.env.OPENAI_KEY!;
const { Configuration, OpenAIApi } = require("openai");
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

export function queryConversationStreaming(
  prompt: string[] = [],
  systemGuide: string[] = [],
  assistants: string[] = [],
  maxLen = 3500,
  fast = false,
  onProgress?: (chunk: string) => void,
  cancelToken?: { cancel: boolean }
): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    const messages = prepareConversation(prompt, systemGuide, assistants);
    const trimmedMessages = trimToMaxTokens(messages, maxLen);
    const tokenCount = trimmedMessages.length;
    const maxTokens = maxLen - tokenCount;
    let model = fast ? "gpt-3.5-turbo" : "gpt-4";

    let response = '';

    try {
      const completion = await openai.createChatCompletion({
        model: model,
        messages: trimmedMessages.conversation,
        max_tokens: maxTokens,
        stream: true
      }, { responseType: 'stream' });

      const stream = completion.data as unknown as IncomingMessage;

      stream.on('data', (chunk: Buffer) => {
        if(cancelToken && cancelToken.cancel) {
          stream.destroy(); // Stops reading from stream.
          reject(new Error('Operation cancelled by user.'));
          return;
        }        
        const payloads = chunk.toString().split("\n\n");
        for (const payload of payloads) {
          if (payload.includes('[DONE]')) return;
          if (payload.startsWith("data:")) {
            const data = JSON.parse(payload.replace("data: ", ""));
            try {
              const chunk: undefined | string = data.choices[0].delta?.content;
              if (chunk) {
                // console.log(chunk);
                response += chunk;
                if (onProgress !== undefined) { onProgress(chunk); }
              }
            } catch (error) {
              console.log(`Error with JSON.parse and ${payload}.\n${error}`);
            }
          }
        }
      });

      stream.on('end', () => {
        setTimeout(() => {
          console.log('\nStream done');
          resolve(response);
        }, 10);
      });

      stream.on('error', (e: Error) => {
        console.log(e);
        reject(new Error(`ai error: ${e}`));
      });
    } catch (e) {
      reject(new Error(`ai error: ${e}`));
    }
  });
}

