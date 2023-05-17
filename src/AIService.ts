import {
  queryConversation,
  queryConversationOneHit,
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

export async function generateChanges(
  text: string,
  userInput: string,
  fileName: string,
  runFastOnly: boolean = false,
  diffOnly: boolean = false,
  onProgress?: (progress: number) => void
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

    let userInstructions = `Rewrite the following code code as per these instructions. The instructions will come first. Only reply with the updated code, no comments, markdown, whitespace or explanations. Don't include the old code just the new.\n
    Here is the original code to be changed, with surrounded by == front and back which you can ignore:\n ==${text}==\nHere are the instructions to change the original code: ${userInput}. `;

    if (diffOnly) {
      userInstructions = `I'm going to give you some code and instructions to change it. Change the code according to the instructions, and tell me the changes as a unified diff patch no extra text, comments, markdown, whitespace or explanations.
                        Here is the code: ${text} and Here is the instructions for how to change the original code: ${userInput}`;
    }
    let proposedChanges = await queryConversationWithProgress(
      [userInstructions],
      [],
      [],
      maxLen,
      runFast,
      onProgress
    );

    if (diffOnly && !isValidUnifiedDiff(proposedChanges)) {
      // lets have another conversation, try again..
      let assistant:string = proposedChanges;
      let feedback:string = "That is not valid unified diff, please try again. remember, no extra text, comments, markdown or explanations, just the valid unified diff patch.";
      proposedChanges = await queryConversationWithProgress([userInstructions, assistant, feedback], [], [], maxLen, runFast, onProgress);
      if (!isValidUnifiedDiff(proposedChanges)) {
        return { status: "ERROR", errorMessage: "AI not producing valid diff, sorry! Please try again."};
      }
    }

    return { status: "OK", proposedChanges: proposedChanges };
  } catch (error: any) {
    return { status: "ERROR", errorMessage: error.message };
  }
}

export function calculateTokenCount(text: string): number {
  return countTokens(text);
}
