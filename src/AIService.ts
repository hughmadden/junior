import { queryConversation,queryConversationOneHit,countTokens } from './openai';

export async function generateChanges(text: string, userInput: string, fileName: string,fast:true): Promise<any> {
  try {
    // Call queryConversation to get proposed changes
    const systemRole = `You are an expert programmer. You are reviewing a selection of code from a file named ${fileName}
                      You are going to be asked to review some code - return only the refactored code. Do not provide any other text or explanations as your code will be placed straight into the file without modifications.`;
    const userInstructions = `Your instructions are: ${userInput} \nThe code to be changed is:\n${text}`;
    const proposedChanges = await queryConversation([userInstructions], [systemRole], [], 3500, false);

    return { status: "OK", proposedChanges: proposedChanges };
  } catch (error: any) {
    return { status: "ERROR", errorMessage: error.message };
  }
}


export function calculateTokenCount(text: string): number {
    return  countTokens(text);
}