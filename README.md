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

code --install-extension ./junior-0.0.2.vsix 


## Features

1. **Junior GPT 4.0 Code Refactor**: This feature enables the GPT-4.0 AI to refactor your code. If you've selected a specific block of text, I'll focus on that. If not, no problem! I'll consider the entire open file.

2. **Junior GPT 3.5 Turbo Code Refactor**: When you need a helping hand, this command is there for you. I'll employ GPT-3.5 Turbo to refactor your code, be it a selection or the entire file. Although it might take some time, the quality results will make it worthwhile.

3. **Junior GPT 3.5 New Code Generation**: Need to create some new code? Let GPT-3.5 Turbo assist you. This command generates new code based on the existing context to help you expand or complete your work.

4. **Junior GPT 4.0 New Code Generation**: Just like the GPT 3.5 version, but this command leverages the latest GPT-4.0 model for new code generation. 

Here's the best part: Once I've generated the changes, I won't just sit back and relax. I'll apply the changes automatically for you. But don't worry about losing control. I'll also open a diff window so you can review everything that's changed. If you don't like something, it's easy to roll it back. 

For the best results, use Junior GPT 4.0 Code Refactor and Junior GPT 3.5 Turbo Code Refactor for refactoring tasks. For new code generation, feel free to use either Junior GPT 3.5 New Code Generation or Junior GPT 4.0 New Code Generation depending on your preferences.

To access all these amazing features, simply press `Shift + Command + P` to open the command input, and then search for "Junior".

I strongly suggest watch the "junior" output window as you'll see the work stream past like the matrix, and you can cancel if you don't like what you see.

Let's start coding!
## Requirements

Hello there,

You'll need an OpenAI API key. Here's how you can set it up:

1. First, head over to the OpenAI website and create an account (if you haven't already). Once you're logged in, navigate to the API section to generate your unique API key.

2. Now, let's move over to VS Code. Go to the extension settings by clicking file -> settings -> extensions

3. Search for "Junior." You should see an input field for the OpenAI API key.

4. Paste your OpenAI API key into this field, and voila, you're all set to go!

Remember, your API key is like a password - keep it secret, keep it safe. Enjoy using Junior!

```
 /\_/\  
( o.o )  
 > ^ <
```

## Extension Settings

This extension contributes the following settings:

* `junior.enable`: Enable/disable this extension.
* `junior.openAIKey`: required to run.

## Known Issues

- Doesn't work with multiple files or allow refactoring/ creation of multiple files
- Doesn't have a read-only "explain" style model

## Release Notes



### 0.0.1

- Initial release supports GPT 3.5 and and 4 code refactoring for the currently open file or text selection

---

### 0.0.2

- Added better cancel support and a junior output window with streaming support for the openai library
- Added support for new content, and removed diff mode for now

---

**Enjoy!**
