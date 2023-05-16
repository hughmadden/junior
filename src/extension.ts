// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import * as aiService from "./AIService";

const JUNIOR_VERSION = "0.0.1";


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let config = vscode.workspace.getConfiguration('junior');
    let OPENAI_API_KEY = config.get('openAIKey');
    if (!OPENAI_API_KEY) {
        vscode.window.showInformationMessage("Please set your OpenAI API key in the settings and reload workspace.");
        return;
    } 
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "junior" is now active!');
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("junior.help", () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage(
      `Hello from junior! ${JUNIOR_VERSION}}`
    );
  });
  context.subscriptions.push(disposable);
  
  disposable = vscode.commands.registerCommand("junior.aichange", async () => {
    // The code you place here will be executed every time your command is executed
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage("No open text editor");
      return;
    }
  
    let document = editor.document;
    let selection = editor.selection;
    let text = selection.isEmpty ? document.getText() : document.getText(selection);
  
    // Assuming that you have calculated the token count as per OpenAI's specifications.
    let tokenCount = aiService.calculateTokenCount(text);
  
    // Get the file name.
    let fileName = path.basename(document.uri.fsPath);
  
    const inputBoxOptions: vscode.InputBoxOptions = {
      prompt: `File: ${fileName}, Token Count: ${tokenCount}`,
      placeHolder: "AI change prompt",
    };
  
    let userInput = await vscode.window.showInputBox(inputBoxOptions);
  
    if (userInput !== undefined) {
      // Create a temporary file outside of the workspace with the original document's content.
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(
        tempDir,
        "vscode_temp_" + uuidv4() + ".txt"
      );
      fs.writeFileSync(tempFilePath, document.getText());
  
      // Open the temporary file as a document.
      const originalDoc = await vscode.workspace.openTextDocument(tempFilePath);
  
      // Generate changes
      let response = await aiService.generateChanges(text, userInput, fileName);

      if (response.status === "ERROR") {
        vscode.window.showInformationMessage(`Error generating changes: ${response.errorMessage}`);
        return;
      }

      let proposedChanges = response.proposedChanges;

      // Apply the changes to the original document.
      await editor.edit((editBuilder) => {
        if (selection.isEmpty) {
          // Replace whole document
          const lastLine = document.lineAt(document.lineCount - 1);
          const entireRange = new vscode.Range(0, 0, document.lineCount - 1, lastLine.range.end.character);
          editBuilder.replace(entireRange, proposedChanges);
        } else {
          // Replace selected text
          editBuilder.replace(selection, proposedChanges);
        }
      });

  
      // Open the Diff view.
      await vscode.commands.executeCommand(
        "vscode.diff",
        originalDoc.uri,
        document.uri,
        `Changes for ${fileName}`
      );
    }
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
