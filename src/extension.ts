import * as vscode from 'vscode'
import { EnumCodeActionsProvider } from './providers'

export function activate(context: vscode.ExtensionContext) {
  const actions = vscode.languages.registerCodeActionsProvider(
    {
      language: 'dart',
      scheme: 'file',
    },
    new EnumCodeActionsProvider(),
    {
      providedCodeActionKinds:
        EnumCodeActionsProvider.providedCodeActionKinds,
    }
  )

  context.subscriptions.push(actions)
}

// this method is called when your extension is deactivated
export function deactivate() { }
