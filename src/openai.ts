import * as vscode from "vscode";
const config = vscode.workspace.getConfiguration('junior');
const { Configuration, OpenAIApi } = require("openai");
const openAiApiKey = config.get('openAIKey');
const openAiConfiguration = new Configuration({
    apiKey: openAiApiKey,
});
const openai = new OpenAIApi(openAiConfiguration);
import { encoding_for_model } from 'tiktoken';
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

function trimToMaxTokens(conversation: { role: string; content: string; }[], maxLenTokens: number): { conversation: { role: string; content: string; }[]; length: number; } {
    conversation = conversation.slice().reverse();
    let tokenCount = 0;
    let trimmedConversation: { role: string; content: string; }[] = [];
    for (const obj of conversation) {
        const tokenLen = countTokens(obj.content);
        if (tokenCount + tokenLen < maxLenTokens) {
            trimmedConversation.push(obj);
            tokenCount += tokenLen;
        }
    }
    return { conversation: trimmedConversation.reverse(), length: tokenCount };
}

export async function queryConversationOneHit(prompt: string, fast = false): Promise<string> {
    return await queryConversation([prompt], [], [], 3500, fast);
}

export async function queryConversation(prompt: string[] = [], systemGuide: string[] = [], assistants: string[] = [], maxLen = 3500, fast = false): Promise<string> {
    let conversation: { role: string; content: string; }[] = [];
    for (const c of prompt) {
        conversation.push({ role: 'user', content: c });
    }

    let systemPrompt: { role: string; content: string; }[] = [];
    for (const s of systemGuide) {
        systemPrompt.push({ role: 'system', content: s });
    }

    let assistPrompt: { role: string; content: string; }[] = [];
    for (const a of assistants) {
        assistPrompt.push({ role: 'assistant', content: a });
    }

    let messages = [...conversation, ...assistPrompt, ...systemPrompt];

    const trimmedMessages = trimToMaxTokens(messages, maxLen);
    conversation = trimmedMessages.conversation;
    const tokenCount = trimmedMessages.length;
    const maxTokens = maxLen + tokenCount;
    let response = '';
    let model = 'gpt-4';
    if (fast) {
        model = 'gpt-3.5-turbo';
    }
    try {
        const aiResponse = await openai.createChatCompletion({
            model: model,
            messages: messages,
            max_tokens: maxTokens
        });
        response = aiResponse.data.choices[0].message.content;
    } catch (e) {
        response = `error: ${e}`;
        // throw new exception
        throw new Error(`ai error: ${e}`);
        // console.log(`ai error: ${e}`);
    }
    return response;
}
