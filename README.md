# junior README

Hello there! I'm Junior, your brand new sidekick in the world of coding. 

Imagine me as the eager beaver junior developer, the one who always has an extra cup of coffee and a spirit that never wanes. You know, the one who's always ready to take on the challenging, the mundane, the confusing, and turn them into something neat and manageable.

I'm here to help lighten your load. Got a piece of code that needs tweaking? Pass it my way. Need to refactor that giant function into something more digestible? I've got your back!

As a VS Code extension, I'm always just a click away, ready to spring into action whenever you need me. And the best part? I don't take coffee breaks, and I definitely don't sleep. I'm your 24/7 coding companion, bringing a fresh perspective and diligent assistance to your projects.

So, let's code up a storm together. Ready when you are!

Run: 
in vs code command shift p and shell command - install code in your PATH
npm install -g vsce
vsce package
code --install-extension ./junior-0.0.1.vsix 


## Features

Here's how I can assist you:

1. **Turbo Slow Mo**: When you're not quite sure how to proceed, let me help. I'll call on GPT-3.5 Turbo to generate a full text replacement. If you've selected a specific block of text, I'll focus on that. If not, don't worry! I'll consider the entire open file. This may take a bit of time, but I promise it's worth the wait.

2. **Slow Mo**: Similar to Turbo Slow Mo, but with a twist! I'll use GPT-4.0 to perform the task. Whether it's a selection or the whole file, I'll handle it!

3. **Turbo Diff Mode**: Need some changes but not too many? I got you covered! I'll ask GPT-3.5 Turbo for a diff and apply the patch to your text. This should be faster as it's less generation. Keep in mind, it's still in its alpha stage. 

4. **Diff Mode**: Just like Turbo Diff Mode, but this time, I'll take help from GPT-4.0. 

And here's the best part: Once I've generated the changes, I won't just sit back and relax. I'll apply the changes automatically for you. But don't worry about losing control. I'll also open a diff window so you can review everything that's changed. If you don't like something, it's easy to roll it back. 

For the best results, Slow Mo and Turbo Slow Mo are your friends. But don't hesitate to try out different modes.

To access all these amazing features, simply press `Shift + Command + P` to open the command input, and then search for "Junior". Let's start refactoring!

## Requirements

Hello there,

You'll need an OpenAI API key. Here's how you can set it up:

1. First, head over to the OpenAI website and create an account (if you haven't already). Once you're logged in, navigate to the API section to generate your unique API key.

2. Now, let's move over to VS Code. Go to the extension settings by clicking on the gear icon in the Extensions view, and then select "Settings."

3. In the Settings view, search for "Junior." You should see an input field for the OpenAI API key.

4. Paste your OpenAI API key into this field, and voila, you're all set to go!

Remember, your API key is like a password - keep it secret, keep it safe. Enjoy using Junior!


## Extension Settings

This extension contributes the following settings:

* `junior.enable`: Enable/disable this extension.
* `junior.openAIKey`: required to run.

## Known Issues

- Diff mode is not working well. maybe with better prompting it can be usable ? for now you'll need to use slow mo mode (which means waiting for gpt 3.5/4 to produce the entire replacement text for your selection)
- The openai callout should be switched to streaming so you can spot a silly response and cancel quickly (ui widget needed as well)

## Release Notes



### 0.0.1

Initial release supports GPT 3.5 and and 4 code refactoring for the currently open file or text selection

---

**Enjoy!**
