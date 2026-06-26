import * as vscode from 'vscode';
import * as http from 'http';

export function activate(context: vscode.ExtensionContext) {
    console.log('Context Profiler extension is now active!');

    let disposable = vscode.commands.registerCommand('context-profiler.generatePolicy', async () => {
        // Ensure a workspace is open
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('Please open a folder/workspace first to generate a sandbox policy.');
            return;
        }

        // Ask the user for requirements
        const requirements = await vscode.window.showInputBox({
            prompt: "Describe your project requirements to generate a sandbox policy",
            placeHolder: "e.g., A React web app using Next.js and Tailwind CSS"
        });

        if (!requirements) {
            return; // User cancelled
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating Sandbox Policy (Ollama Llama 3.2)...",
            cancellable: false
        }, async (progress) => {
            try {
                const profile = await queryOllama(requirements);
                
                const workspaceFolder = vscode.workspace.workspaceFolders![0].uri;
                const policyUri = vscode.Uri.joinPath(workspaceFolder, '.sandbox-policy.yaml');
                
                // Convert JSON to YAML format manually for simplicity without extra dependencies
                const yamlContent = generateYaml(profile);
                const writeData = Buffer.from(yamlContent, 'utf8');
                
                await vscode.workspace.fs.writeFile(policyUri, writeData);
                
                vscode.window.showInformationMessage('Sandbox Policy generated successfully! Check .sandbox-policy.yaml');
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to generate policy: ${error.message || error}`);
            }
        });
    });

    context.subscriptions.push(disposable);
}

function queryOllama(requirements: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const prompt = `You are a strict security capability profiler for AI agents.
Based on the following project requirements, return a JSON object with strictly required permissions.
Do NOT return markdown formatting. ONLY return raw JSON.

REQUIREMENTS:
${requirements}

JSON FORMAT:
{
  "allowedCommands": ["list", "of", "terminal", "commands", "like", "npm", "git"],
  "allowedDirectories": ["./", "./src"],
  "allowedNetworkDomains": ["registry.npmjs.org"],
  "reasoning": "brief explanation"
}`;

        const postData = JSON.stringify({
            model: "llama3.2",
            prompt: prompt,
            stream: false,
            format: "json"
        });

        const options = {
            hostname: '127.0.0.1',
            port: 11434,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Ollama returned status code ${res.statusCode}`));
                    return;
                }
                try {
                    const jsonRes = JSON.parse(data);
                    const profile = JSON.parse(jsonRes.response);
                    resolve(profile);
                } catch (e) {
                    reject(new Error('Failed to parse JSON response from Ollama. Ensure Ollama is running and Llama 3.2 is installed.'));
                }
            });
        });

        req.on('error', (e) => {
            reject(new Error(`Could not connect to Ollama: ${e.message}`));
        });

        req.write(postData);
        req.end();
    });
}

function generateYaml(profile: any): string {
    let yaml = 'terminal:\n  allow:\n';
    if (profile.allowedCommands && Array.isArray(profile.allowedCommands)) {
        profile.allowedCommands.forEach((cmd: string) => {
            yaml += `    - ${cmd}\n`;
        });
    }

    yaml += 'network:\n  allowed_domains:\n';
    if (profile.allowedNetworkDomains && Array.isArray(profile.allowedNetworkDomains)) {
        profile.allowedNetworkDomains.forEach((domain: string) => {
            yaml += `    - ${domain}\n`;
        });
    }

    yaml += 'fs:\n  allowed_paths:\n';
    if (profile.allowedDirectories && Array.isArray(profile.allowedDirectories)) {
        profile.allowedDirectories.forEach((dir: string) => {
            yaml += `    - ${dir}\n`;
        });
    }

    return yaml;
}

export function deactivate() {}
