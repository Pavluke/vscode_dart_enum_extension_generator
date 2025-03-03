import * as vscode from 'vscode'
import DartEnum from '../models/dart-enum'

/**
 * Provider for generating methods for Dart enums.
 */
export class EnumCodeActionsProvider implements vscode.CodeActionProvider {
  // Группа для ваших действий
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.Refactor.append('dart-enum'),
  ];

  /**
   * Provides available actions for generating methods.
   */
  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    const actions = [
      this.generateWhenAction(document, range),
      this.generateMaybeWhenAction(document, range),
      this.generateWhenOrNullAction(document, range),
      this.generateMapAction(document, range),
      this.generateMaybeMapAction(document, range),
      this.generateMapWithValuesAction(document, range),
      this.generateGettersAction(document, range),
    ].filter((action): action is vscode.CodeAction => action !== null)

    return actions
  }

  /**
   * Creates an action to generate the `when` method.
   */
  private generateWhenAction(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction | null {
    return this.createCodeAction(
      'when()',
      'WhenMethod',
      document,
      range,
      (dartEnum) => dartEnum.toWhenMethod(),
      vscode.CodeActionKind.Refactor.append('dart-enum.when')
    )
  }

  /**
   * Creates an action to generate the `maybeWhen` method.
   */
  private generateMaybeWhenAction(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction | null {
    return this.createCodeAction(
      'maybeWhen()',
      'MaybeWhenMethod',
      document,
      range,
      (dartEnum) => dartEnum.toMaybeWhenMethod(),
      vscode.CodeActionKind.Refactor.append('dart-enum.maybeWhen')
    )
  }

  /**
   * Creates an action to generate the `whenOrNull` method.
   */
  private generateWhenOrNullAction(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction | null {
    return this.createCodeAction(
      'whenOrNull()',
      'WhenOrNullMethod',
      document,
      range,
      (dartEnum) => dartEnum.toWhenOrNullMethod(),
      vscode.CodeActionKind.Refactor.append('dart-enum.whenOrNull')
    )
  }

  /**
   * Creates an action to generate the `map` method.
   */
  private generateMapAction(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction | null {
    return this.createCodeAction(
      'map()',
      'MapMethod',
      document,
      range,
      (dartEnum) => dartEnum.toMapMethod(),
      vscode.CodeActionKind.Refactor.append('dart-enum.map')
    )
  }

  /**
   * Creates an action to generate the `maybeMap` method.
   */
  private generateMaybeMapAction(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction | null {
    return this.createCodeAction(
      'maybeMap()',
      'MaybeMapMethod',
      document,
      range,
      (dartEnum) => dartEnum.toMaybeMapMethod(),
      vscode.CodeActionKind.Refactor.append('dart-enum.maybeMap')
    )
  }

  /**
   * Creates an action to generate the `mapWithValues` method.
   */
  private generateMapWithValuesAction(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction | null {
    return this.createCodeAction(
      'mapWithValues()',
      'MapWithValuesMethod',
      document,
      range,
      (dartEnum) => dartEnum.toMapWithValuesMethod(),
      vscode.CodeActionKind.Refactor.append('dart-enum.mapWithValues')
    )
  }

  /**
   * Creates an action to generate getters.
   */
  private generateGettersAction(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction | null {
    return this.createCodeAction(
      "getters",
      'Getters',
      document,
      range,
      (dartEnum) => dartEnum.toGetterMethods(),
      vscode.CodeActionKind.Refactor.append('dart-enum.getters')
    )
  }

  /**
   * Creates an action to generate or regenerate a method.
   */
  private createCodeAction(
    title: string,
    suffix: string,
    document: vscode.TextDocument,
    range: vscode.Range,
    methodGenerator: (dartEnum: DartEnum) => string,
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
    while (!rawInput.includes('}')) {
      line++
      rawInput += document.lineAt(line).text
    }

    const dartEnum = DartEnum.fromString(rawInput)

    if (!dartEnum) {
      return null
    }

    const extensionName = `${dartEnum.name}${suffix}`
    const exists = this.extensionOrClassExists(document, extensionName, line)
    const actionTitle = suffix === 'Getters'
      ? exists
        ? `Regenerate 'is' getters`
        : `Generate 'is' getters`
      : exists
        ? `Regenerate ${title}`
        : `Generate ${title}`

    const fix = new vscode.CodeAction(actionTitle, kind)
    fix.edit = new vscode.WorkspaceEdit()

    let codeToInsert = ''
    codeToInsert = `\nextension ${extensionName} on ${dartEnum.name} {\n  ${methodGenerator(dartEnum)}\n}`
    if (exists) {
      const range = this.findExtensionOrClassRange(document, extensionName, line)
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
  private extensionOrClassExists(document: vscode.TextDocument, name: string, startLine: number): boolean {
    const pattern = new RegExp(`(extension|class)\\s+${name}`)
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
  private findExtensionOrClassRange(document: vscode.TextDocument, name: string, startLine: number): vscode.Range | null {
    const pattern = new RegExp(`(extension|class)\\s+${name}`)
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