# Context Profiler: The Universal AI Sandbox

Context Profiler is an offline, context-aware AI Security Sandbox Generator. It protects local development environments from rogue autonomous AI agents by generating strict, least-privilege firewalls tailored to a project's specific needs.

The architecture consists of two halves:
1. **The Manager**: A VS Code Extension that asks you what you are building and uses a local Ollama model to generate a `.sandbox-policy.yaml` rulebook in your project root.
2. **The Bouncer**: A Security Enforcer plugin that physically blocks AI agents from executing commands that aren't on the rulebook.

## Step 1: Install the Manager (VS Code Extension)
1. Download the `.vsix` file from the [Releases](https://github.com/adhyakoul0507/vscode-context-profiler/releases) page.
2. Open **Visual Studio Code** (or Cursor).
3. Go to the Extensions tab (`Cmd + Shift + X`).
4. Click the `...` menu at the top right of the Extensions panel and select **"Install from VSIX..."**.
5. Select the downloaded `.vsix` file.
6. Open any project, press `Cmd + Shift + P`, and run `Context Profiler: Generate Sandbox Policy`.

## Step 2: Install the Bouncer (Antigravity Security Enforcer)
For the generated policies to actually block the AI, you must install the Security Enforcer into your agent's configuration. This repository currently includes the Enforcer for the **Google Antigravity SDK**.

1. Locate your Antigravity global configuration folder (usually `~/.gemini/config/plugins/`).
2. Copy the `enforcers/antigravity-plugin/` folder from this repository into your plugins directory.
3. Name the folder `capability-sandbox-plugin`.
4. The Antigravity IDE will automatically detect the plugin. From now on, all terminal commands the agent tries to run will be routed through `sandbox_exec.py`, which will strictly enforce the `.sandbox-policy.yaml` in your workspace!
