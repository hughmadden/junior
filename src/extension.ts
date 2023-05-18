// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import * as aiService from "./AIService";
import * as diff from "diff";

const JUNIOR_VERSION = "0.0.1";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "junior" is now activating!');
  let config = vscode.workspace.getConfiguration("junior");
  let OPENAI_API_KEY = config.get("openAIKey");
  if (!OPENAI_API_KEY) {
    vscode.window.showInformationMessage(
      "Please set your OpenAI API key in the settings and reload workspace."
    );
    return;
  }

  console.log('Congratulations, your extension "junior" is now active!');

  let disposable = vscode.commands.registerCommand("junior.help", () => {
    vscode.window.showInformationMessage(
      `Hello from junior! ${JUNIOR_VERSION}}`
    );
  });
  context.subscriptions.push(disposable);

  const registerAiCommand = (
    commandId: string,
    fastOnly: boolean,
    calculateDiff: boolean
  ) => {
    return vscode.commands.registerCommand(commandId, async () => {
      let editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No open text editor");
        return;
      }

      let document = editor.document;
      let selection = editor.selection;
      const text = selection.isEmpty
        ? document.getText()
        : document.getText(selection);

      let tokenCount = aiService.calculateTokenCount(text);
      let fileName = path.basename(document.uri.fsPath);

      const inputBoxOptions: vscode.InputBoxOptions = {
        prompt: `File: ${fileName}, Token Count: ${tokenCount}`,
        placeHolder: "AI change prompt",
      };

      let userInput = await vscode.window.showInputBox(inputBoxOptions);

      if (userInput !== undefined) {
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(
          tempDir,
          "vscode_temp_" + uuidv4() + ".txt"
        );
        fs.writeFileSync(tempFilePath, document.getText());
        const originalDoc = await vscode.workspace.openTextDocument(
          tempFilePath
        );

        const cancellationTokenSource = new vscode.CancellationTokenSource();
        const progressOptions: vscode.ProgressOptions = {
          location: vscode.ProgressLocation.Notification,
          title: "Go fetch coffee, junior is coding....",
          cancellable: true,
        };

        vscode.window.withProgress(progressOptions, async (progress, token) => {
          token.onCancellationRequested(() => {
            cancellationTokenSource.cancel();
            vscode.window.showInformationMessage("Cancelled.");
            return;
          });

          progress.report({ increment: 0 });

          let response: any = "";

          if (userInput !== undefined) {
            let runFastOnly = fastOnly;
            response = await aiService.generateChanges(
              text,
              userInput,
              fileName,
              runFastOnly,
              calculateDiff,
              (progressNumber) => {
                if (!token.isCancellationRequested) {
                  progress.report({ increment: progressNumber });
                }
              }
            );
          } else {
            vscode.window.showInformationMessage("Cancelled.");
            return;
          }

          if (response.status === "ERROR") {
            vscode.window.showInformationMessage(
              `Error generating changes: ${response.errorMessage}`
            );
            return;
          }

          let proposedText: string = "";
          if (calculateDiff) {
            let proposedPatch = response.proposedChanges;
            let patches = diff.parsePatch(proposedPatch);
            proposedText = text;

            for (let patch of patches) {
              let patchedText = diff.applyPatch(proposedText, patch);

              if (typeof patchedText !== "string") {
                vscode.window.showInformationMessage(
                  `FAILED APPLYING PATCH: ${proposedPatch}`
                );
                throw new Error("Failed to apply patch");
              }

              proposedText = patchedText;
            }
          } else {
            proposedText = response.proposedChanges;
          }

          let editor = vscode.window.activeTextEditor;
          if (!editor) {
            vscode.window.showInformationMessage("No open text editor");
            return;
          }
          await editor.edit((editBuilder) => {
            if (selection.isEmpty) {
              const lastLine = document.lineAt(document.lineCount - 1);
              const entireRange = new vscode.Range(
                0,
                0,
                document.lineCount - 1,
                lastLine.range.end.character
              );
              editBuilder.replace(entireRange, proposedText);
            } else {
              editBuilder.replace(selection, proposedText);
            }
          });

          await vscode.commands.executeCommand(
            "vscode.diff",
            originalDoc.uri,
            document.uri,
            `Changes for ${fileName}`
          );
        });
      } else {
        vscode.window.showInformationMessage("Cancelled.");
      }
    });
  };

  // context.subscriptions.push(disposable);
  context.subscriptions.push(registerAiCommand("junior.slowmo", false, false));
  context.subscriptions.push(
    registerAiCommand("junior.turboslowmo", false, false)
  );
  context.subscriptions.push(
    registerAiCommand("junior.diffchange", false, true)
  );
  context.subscriptions.push(
    registerAiCommand("junior.turbodiffchange", true, true)
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
