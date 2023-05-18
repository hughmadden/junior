import {
  queryConversation,
  queryConversationStreaming,
  countTokens,
  queryConversationWithProgress,
  getModels,
} from "./openai";

import * as diff from 'diff';

function isValidUnifiedDiff(unifiedDiff: string): boolean {
  try {
    diff.parsePatch(unifiedDiff);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function isUnifiedDiffFormat(diff: string): boolean {
  // A unified diff should start with a "---" line and contain at least one "@@" line
  const lines = diff.split('\n');
  const startsWithThreeDash = lines[0].startsWith('---');
  const hasAtLeastOneDoubleAt = lines.some(line => line.includes('@@'));

  return startsWithThreeDash && hasAtLeastOneDoubleAt;
}


function extractDiffFromResponse(response: string): string {
  const diffStartIndex = response.indexOf('---');

  if (diffStartIndex !== -1) {
      // Return the text starting from '---'
      return response.substring(diffStartIndex);
  } else {
      // Return the original response if '---' is not found
      return response;
  }
}

function extractCodeFromMarkdown(markdown: string): string {
  const regex = /```([\s\S]*?)```/g;
  const match = regex.exec(markdown);

  if (match) {
    // Return the first matched code block
    return match[1].trim();
  } else {
    // Return the original markdown if no code block is found
    return markdown;
  }
}

function isLikelyCodeFile(filename: string): boolean {
  const codeFileExtensions = [
    '.py', // Python
    '.js', // JavaScript
    '.ts', // TypeScript
    '.java', // Java
    '.c', // C
    '.cpp', // C++
    '.cs', // C#
    '.rb', // Ruby
    '.go', // Go
    '.php', // PHP
    '.rs', // Rust
    '.swift', // Swift
    '.m', // Objective-C
    '.kt', // Kotlin
    '.scala', // Scala
    // Add more extensions as needed...
  ];

  const extension = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
  return codeFileExtensions.includes(`.${extension}`);
}



export async function generateChanges(
  text: string,
  userInput: string,
  fileName: string,
  runFastOnly: boolean = false,
  diffOnly: boolean = false,
  newCode: boolean = false,
  onProgress?: (progress: string) => void,
  cancelToken?: { cancel: boolean }
): Promise<any> {
  try {
    // get available models first.

    let runFast = true;
    let maxLen = 3900;
    if (!runFastOnly) {
      const models = await getModels();
      if (models.includes("gpt-4")) {
        runFast = false;
        maxLen = 7900; // gpt-4 can handle more tokens.
      }
    }

    let userInstructions = `Rewrite the following code as per these instructions. The instructions will come first. Only reply with the updated code, no comments, markdown, whitespace or explanations. Don't include the old code just the new.\n
    Here is the original code to be changed:${text}\nHere are the instructions to change the original code: ${userInput}. `;

    if (!isLikelyCodeFile(fileName)) {
      userInstructions = `Rewrite the following text as per these instructions. The instructions will come first. Only reply with the updated text, no comments, markdown, whitespace or explanations. Don't include the old text just the new.\n Here is the original text to be changed:${text}\nHere are the instructions to change the original text: ${userInput}.`
    }

    if (diffOnly) {
      // userInstructions = `I'm going to give you some code and instructions to change it. Change the code according to the instructions, and tell me the changes as a full unified diff full unified diff with line numbers and modifications patch. ensure there is no extra text, comments, markdown, whitespace or explanations. As i wish to use the output directly to apply the diff.
                        // Here is the code:${text}\n and Here is the instructions for how to change the code: ${userInput}\n Note that a full unified diff A unified diff should start with a "---" line and contain at least one "@@" line`;
      if (isLikelyCodeFile(fileName)) {
        userInstructions = `given the code i provide at this end of this request, ${userInput}. just send unified diff comlete with --- and @@ lines. Ensure you match the whitespace in the original. No explanations or any text outside the diff please. Just the diff in your response! Don't explain it or anything else. Here is the code: ${text}`;
      }
      else {
        userInstructions = `given the text i provide at this end of this request, ${userInput}. just send unified diff comlete with --- and @@ lines. Ensure you match the whitespace in the original. No explanations or any text outside the diff please. Just the diff in your response! Don't explain it or anything else. Here is the original: ${text}`;
      }
    }
    
    if (newCode) {
      if (isLikelyCodeFile(fileName)) {
        userInstructions = `I'm going to give you some instructions to create some code. Infer its type from the filename: ${fileName} Ensure there is no extra text, comments, markdown, whitespace or explanations as i wish to use the code output directly. Here are the instructions:${userInput}`;
      } else {
        userInstructions = `I'm going to give you some instructions to create some content. Ensure there is no extra text, comments, markdown, whitespace or explanations as i wish to use the output directly. Here are the instructions:${userInput}`;
      }
    }

    let proposedChanges = await queryConversationStreaming(
      [userInstructions],
      [],
      [],
      maxLen,
      runFast,
      onProgress
    );
    
    if (diffOnly) { proposedChanges = extractDiffFromResponse(proposedChanges);}
    if (diffOnly && (!isValidUnifiedDiff(proposedChanges) || !isUnifiedDiffFormat(proposedChanges))) {
      // lets have another conversation, try again..
      let assistant:string = proposedChanges;
      let feedback:string = "That is not valid unified diff, please try again. remember, no extra text, comments, markdown or explanations, just the valid unified diff patch.";
      proposedChanges = await queryConversationStreaming([userInstructions, assistant, feedback], [], [], maxLen, runFast); // not streaming!
      proposedChanges = extractDiffFromResponse(proposedChanges);
      if (!isValidUnifiedDiff(proposedChanges) || !isUnifiedDiffFormat(proposedChanges)) {
        return { status: "ERROR", errorMessage: "AI not producing valid diff, sorry! Please try again."};
      }
    }

    if(newCode) {
      proposedChanges = extractCodeFromMarkdown(proposedChanges);
    }

    return { status: "OK", proposedChanges: proposedChanges };
  } catch (error: any) {
    return { status: "ERROR", errorMessage: error.message };
  }
}

export function calculateTokenCount(text: string): number {
  return countTokens(text);
}
