import * as vscode from 'vscode'

/**
 * Interface for CodeAction provider.
 */
export interface ICodeActionProvider {
	provideCodeActions(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection,
		context: vscode.CodeActionContext,
		token: vscode.CancellationToken
	): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]>
}