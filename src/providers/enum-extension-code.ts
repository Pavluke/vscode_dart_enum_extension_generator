import * as vscode from 'vscode'
import DartEnum from '../models/dart-enum'

/**
 * Provider for generating methods for Dart enums.
 */
export class EnumExtensionCodeProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.Refactor.append('dart-enum'),
  ];

  /**
   * Provides available actions for generating methods.
   */
  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    const actions = [
      this.generateExtension(
        document,
        range,
        (dartEnum) => dartEnum.createExtension(),
        vscode.CodeActionKind.Refactor.append('dart-enum.extension')
      ),
    ].filter((action): action is vscode.CodeAction => action !== null)

    return actions
  }

  /**
   * Creates an action to generate or regenerate a method.
   */
  private generateExtension(
    document: vscode.TextDocument,
    range: vscode.Range,
    extensionGenerator: (dartEnum: DartEnum) => string,
    kind: vscode.CodeActionKind
  ): vscode.CodeAction | null {
    const wordRange = document.getWordRangeAtPosition(range.start)

    if (!wordRange) {
      return null
    }

    const cursorLine = document.lineAt(range.start.line)

    if (!cursorLine || !cursorLine.text.includes('enum')) {
      return null
    }

    let rawInput = cursorLine.text
    let line = range.start.line
    let braceCount = 0

    while (line < document.lineCount) {
      const lineText = document.lineAt(line).text
      rawInput += '\n' + lineText
      braceCount += (lineText.match(/{/g) || []).length
      braceCount -= (lineText.match(/}/g) || []).length
      if (braceCount === 0) {
        break
      }
      line++
    }
    const dartEnum = DartEnum.fromString(rawInput)

    if (!dartEnum) {
      return null
    }

    const extensionName = `${dartEnum.name}X`
    const exists = this.extensionExists(document, extensionName, line)
    const actionTitle = exists
      ? `Regenerate enum extension`
      : `Generate enum extension`

    const fix = new vscode.CodeAction(actionTitle, kind)
    fix.edit = new vscode.WorkspaceEdit()

    let codeToInsert = ''
    codeToInsert = `\nextension ${extensionName} on ${dartEnum.name} {
  ${extensionGenerator(dartEnum)}
}
`
    if (exists) {
      const range = this.findExtensionRange(document, extensionName, line)
      if (range) {
        fix.edit.delete(document.uri, range)
      }
    }
    if (!this.hasNewlineAfterLastBrace(document, line)) {
      fix.edit.insert(document.uri, new vscode.Position(line + 1, 0), '\n')
    }
    fix.edit.insert(document.uri, new vscode.Position(line + 1, 0), codeToInsert)

    return fix
  }


  /**
   * Checks if an extension or class exists in the document.
   */
  private extensionExists(document: vscode.TextDocument, name: string, startLine: number): boolean {
    const pattern = new RegExp(`extension\\s+${name}\\s+on`)
    for (let i = startLine; i < document.lineCount; i++) {
      const lineText = document.lineAt(i).text
      if (pattern.test(lineText)) {
        return true
      }
    }
    return false
  }

  /**
   * Finds the range of an extension or class in the document.
   */
  private findExtensionRange(document: vscode.TextDocument, name: string, startLine: number): vscode.Range | null {
    const pattern = new RegExp(`extension\\s+${name}\\s+on`)
    for (let i = startLine; i < document.lineCount; i++) {
      const lineText = document.lineAt(i).text
      if (pattern.test(lineText)) {
        const start = new vscode.Position(i, 0)
        let endLine = i
        let braceCount = 0
        while (endLine < document.lineCount) {
          const currentLine = document.lineAt(endLine).text
          braceCount += (currentLine.match(/{/g) || []).length
          braceCount -= (currentLine.match(/}/g) || []).length
          if (braceCount === 0) {
            break
          }
          endLine++
        }
        const end = new vscode.Position(endLine, document.lineAt(endLine).text.length)
        return new vscode.Range(start, end)
      }
    }
    return null
  }

  /**
   * Checks if there is a newline after the last `}` in the enum.
   */
  private hasNewlineAfterLastBrace(document: vscode.TextDocument, line: number): boolean {
    let lastBraceLine = line
    while (lastBraceLine < document.lineCount) {
      const lineText = document.lineAt(lastBraceLine).text
      if (lineText.includes('}')) {
        return lastBraceLine + 1 < document.lineCount
      }
      lastBraceLine++
    }
    return false
  }
}