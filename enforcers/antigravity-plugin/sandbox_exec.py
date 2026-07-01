import sys
import subprocess
import os
from capability_sandbox import PolicyEngine
from rich.console import Console

console = Console()

def main():
    if len(sys.argv) < 2:
        console.print("[bold red]Error: No command provided to sandbox executor.[/bold red]")
        sys.exit(1)
        
    command_str = " ".join(sys.argv[1:])
    
    # Look for a project-specific policy in the current directory
    project_policy_path = os.path.join(os.getcwd(), ".sandbox-policy.yaml")
    
    if os.path.exists(project_policy_path):
        policy_path = project_policy_path
    else:
        # Fallback to the global plugin policy
        script_dir = os.path.dirname(os.path.abspath(__file__))
        policy_path = os.path.join(script_dir, "policy.yaml")
        
    engine = PolicyEngine(policy_path)
    
    # Evaluate the action
    decision, reason = engine.evaluate_action("terminal.run", "local", {"command": command_str})
    
    if decision == "DENY":
        console.print(f"[bold red]🚫 [Capability Sandbox] BLOCKED:[/bold red] {command_str}")
        console.print(f"Reason: {reason}")
        sys.exit(1)
    elif decision == "ASK":
        # In a background execution scenario for an agent, ASK without an interactive TTY means we deny.
        console.print(f"[bold yellow]⚠️ [Capability Sandbox] BLOCKED (Requires Interactive Approval):[/bold yellow] {command_str}")
        console.print(f"Reason: {reason}")
        sys.exit(1)
    else:
        # ALLOW
        console.print(f"[bold green]✅ [Capability Sandbox] ALLOWED:[/bold green] {command_str}")
        # Execute the command
        try:
            result = subprocess.run(command_str, shell=True, check=True, text=True)
            sys.exit(result.returncode)
        except subprocess.CalledProcessError as e:
            sys.exit(e.returncode)

if __name__ == "__main__":
    main()
