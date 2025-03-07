import { Position, Range } from 'vscode'
import { IDartEnum } from '../interfaces/dart-enum.interface'
import { capitalize } from '../utils'

/**
 * A class representing a Dart enum and providing methods for generating code.
 */
export default class DartEnum extends IDartEnum {


  constructor(name: string, values: string[], range: Range) {
    super(name, values, range)
  }

  /**
   * Parses a string and creates a DartEnum object.
   * @param input - The string containing the enum definition.
   * @returns A DartEnum object or `null` if the enum is not found.
   */
  static fromString(input: String): DartEnum | null {
    try {
      const enumPattern = /(?<=(enum\s))([A-Z][a-zA-Z0-9{,\s\S]*?})/
      const match = input.match(enumPattern)

      if (!match) {
        console.error("No enum found in the input.")
        return null
      }

      const rawEnum = match[0]
      const elements = rawEnum.split(/[{}]/)

      if (elements.length !== 3) {
        console.error("Invalid enum format.")
        return null
      }

      const name = elements[0]
      const values = this.extractValues(elements[1])

      return new DartEnum(name.trim(), values, new Range(new Position(0, 0), new Position(0, 0)))
    } catch (error) {
      console.error("Error parsing enum:", error)
      return null
    }
  }

  /**
   * Extracts enum values from a string, ignoring constructors and parameters.
   * @param input - The string containing enum values.
   * @returns An array of values.
   */
  private static extractValues(input: string): string[] {
    const valuesPart = input.split(';')[0]
    return valuesPart
      .replace(/\([^)]*\)/g, '')
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e !== '')
  }

  /**
     * Generates the extension.
     * @returns A string containing the extension code.
     */
  public createExtension(): string {
    return `
  ${this.toGetterMethods()}

  ${this.toWhenMethod()}

  ${this.toMaybeWhenMethod()}

  ${this.toWhenOrNullMethod()}

  ${this.toMapMethod()}

  ${this.toMaybeMapMethod()}
    `
  }

  /**
   * Generates the `when` method.
   * @returns A string containing the method code.
   */
  private toWhenMethod(): string {
    const args = this.values
      .map((e) => `required R Function() ${e},`)
      .join('\n    ')
    const cases = this.values
      .map((e) => `${this.name}.${e} => ${e}(),`)
      .join('\n        ')

    return `
  R when<R extends Object>({
    ${args}
  }) =>
      switch (this) {
        ${cases}
      };`.trim()
  }

  /**
   * Generates the `maybeWhen` method.
   * @returns A string containing the method code.
   */
  private toMaybeWhenMethod(): string {
    const args = this.values
      .map((e) => `R Function()? ${e},`)
      .join('\n    ')
    const cases = this.values
      .map((e) => `${this.name}.${e} => ${e}?.call() ?? orElse(),`)
      .join('\n        ')

    return `
  R maybeWhen<R extends Object>({
    ${args}
    required R Function() orElse,
  }) =>
      switch (this) {
        ${cases}
      };`.trim()
  }

  /**
     * Generates the `whenOrNull` method.
     */
  private toWhenOrNullMethod(): string {
    const args = this.values
      .map((e) => `R? Function()? ${e},`)
      .join('\n    ')
    const cases = this.values
      .map((e) => `${this.name}.${e} => ${e}?.call(),`)
      .join('\n        ')

    return `
  R? whenOrNull<R extends Object?>({
    ${args}
  }) =>
      switch (this) {
        ${cases}
      };`.trim()
  }

  /**
   * Generates the `map` method.
   * @returns A string containing the method code.
   */
  private toMapMethod(): string {
    const args = this.values
      .map((e) => `required void Function() ${e},`)
      .join('\n    ')
    const cases = this.values
      .map((e) => `${this.name}.${e} => ${e}(),`)
      .join('\n        ')

    return `
  void map({
    ${args}
  }) =>
      switch (this) {
        ${cases}
      };`.trim()
  }

  /**
   * Generates the `maybeMap` method.
   */
  private toMaybeMapMethod(): string {
    const args = this.values
      .map((e) => `void Function()? ${e},`)
      .join('\n    ')
    const cases = this.values
      .map((e) => `${this.name}.${e} => ${e}?.call(),`)
      .join('\n        ')

    return `
  void maybeMap({
    ${args}
  }) =>
      switch (this) {
        ${cases}
      };`.trim()
  }

  /**
   * Generates the `toMapWithValues` method.
   * @returns A string containing the method code.
   */
  private toMapWithValuesMethod(): string {
    const args = this.values
      .map((e) => `required T? ${e},`)
      .join('\n    ')
    const entries = this.values
      .map((e) => `'${e}': ${e},`)
      .join('\n        ')

    return `
  static Map<String, T?> toMapWithValues<T extends Object?>({
    ${args}
  }) =>
      {
        ${entries}
      };`.trim()
  }

  /**
   * Generates getters for enum values.
   * @returns A string containing the getters code.
   */
  private toGetterMethods(): string {
    return this.values
      .map((e) => `bool get is${capitalize(e)} => this == ${this.name}.${e};`)
      .join('\n  ')
  }

}