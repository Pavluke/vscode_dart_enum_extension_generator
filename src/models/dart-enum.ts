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

  private switchItemSpace: string = '\n    ';
  private paramItemSpace: string = '\n    ';

  /**
   * Parses a string and creates a DartEnum object.
   * @param input - The string containing the enum definition.
   * @returns A DartEnum object or `null` if the enum is not found.
   */
  static fromString(input: string): DartEnum | null {
    try {

      const enumPattern = /enum\s+([A-Z][a-zA-Z0-9]*)\s*\{([\s\S]*?)\}/
      const match = input.match(enumPattern)

      if (!match) {
        console.error("No enum found in the input.")
        return null
      }

      const name = match[1].trim()
      const valuesPart = match[2].trim()

      const values = this.extractValues(valuesPart)
      if (values.length === 0) {
        console.error("No valid enum values found.")
        return null
      }

      return new DartEnum(name, values, new Range(new Position(0, 0), new Position(0, 0)))
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
    var valuesPart = input.replace(/ /g, '').trim()
    valuesPart = valuesPart.replace(/\([^)]*\)/g, '')
    let values
    if (valuesPart.includes('{')) {
      valuesPart = valuesPart.split('{')[1]
    }
    if (valuesPart.includes(';')) {
      values = valuesPart.split(';')[0].split(',')
    } else {
      values = valuesPart.split('}')[0].split(',')
    }
    return values.map(value => value.trim()).filter(value => value !== '')
  }

  /**
   * Generates the extension.
   * @returns A string containing the extension code.
   */
  public createExtension(): string {
    return `${this.toGetterMethods()}

  ${this.toWhenMethod()}

  ${this.toMaybeWhenMethod()}

  ${this.toWhenOrNullMethod()}`
  }

  /**
   * Generates the `when` method with documentation.
   * @returns A string containing the method code.
   */
  private toWhenMethod(): string {
    const args = this.values
      .map((e) => `required R Function() ${e},`)
      .join(this.paramItemSpace)
    const cases = this.values
      .map((e) => `${this.name}.${e} => ${e}(),`)
      .join(this.switchItemSpace)

    return `
  /// Executes a function based on the enum value.
  ///
  /// [R] is the return type of the functions.
  /// Each function corresponds to an enum value.
  R when<R>({
    ${args}
  }) => switch (this) {
    ${cases}
  };`.trim()
  }

  /**
   * Generates the `maybeWhen` method with documentation.
   * @returns A string containing the method code.
   */
  private toMaybeWhenMethod(): string {
    const args = this.values
      .map((e) => `R Function()? ${e},`)
      .join(this.paramItemSpace)
    const cases = this.values
      .map((e) => `${this.name}.${e} => ${e}?.call() ?? orElse(),`)
      .join(this.switchItemSpace)

    return `
  /// Executes a function based on the enum value, with a fallback.
  ///
  /// [R] is the return type of the functions.
  /// Each function corresponds to an enum value and can be null.
  /// [orElse] is called if the corresponding function is null.
  R maybeWhen<R>({
    ${args}
    required R Function() orElse,
  }) => switch (this) {
    ${cases}
  };`.trim()
  }

  /**
   * Generates the `whenOrNull` method with documentation.
   * @returns A string containing the method code.
   */
  private toWhenOrNullMethod(): string {
    const args = this.values
      .map((e) => `R? Function()? ${e},`)
      .join(this.paramItemSpace)
    const cases = this.values
      .map((e) => `${this.name}.${e} => ${e}?.call(),`)
      .join(this.switchItemSpace)

    return `
  /// Executes a function based on the enum value, returning null if no function is provided.
  ///
  /// [R] is the return type of the functions.
  /// Each function corresponds to an enum value and can be null.
  R? whenOrNull<R>({
    ${args}
  }) => switch (this) {
    ${cases}
  };`.trim()
  }

  /**
   * Generates the `map` method with documentation.
   * @returns A string containing the method code.
   */
  private toMapMethod(): string {
    const args = this.values
      .map((e) => `required void Function() ${e},`)
      .join(this.paramItemSpace)
    const cases = this.values
      .map((e) => `${this.name}.${e} => ${e}(),`)
      .join(this.switchItemSpace)

    return `
  /// Executes a void function based on the enum value.
  ///
  /// Each function corresponds to an enum value.
  void map({
    ${args}
  }) => switch (this) {
    ${cases}
  };`.trim()
  }

  /**
   * Generates the `maybeMap` method with documentation.
   * @returns A string containing the method code.
   */
  private toMaybeMapMethod(): string {
    const args = this.values
      .map((e) => `void Function()? ${e},`)
      .join(this.paramItemSpace)
    const cases = this.values
      .map((e) => `${this.name}.${e} => ${e}?.call() ?? orElse(),`)
      .join(this.switchItemSpace)

    return `
  /// Executes a void function based on the enum value, with optional functions.
  ///
  /// Each function corresponds to an enum value and can be null.
  void maybeMap({
    ${args}
    required R Function() orElse,
  }) => switch (this) {
    ${cases}
  };`.trim()
  }

  /**
   * Generates the `maybeMap` method with documentation.
   * @returns A string containing the method code.
   */
  private toMapOrNullMethod(): string {
    const args = this.values
      .map((e) => `void Function()? ${e},`)
      .join(this.paramItemSpace)
    const cases = this.values
      .map((e) => `${this.name}.${e} => ${e}?.call(),`)
      .join(this.switchItemSpace)

    return `
  /// Executes a void function based on the enum value, with optional functions.
  ///
  /// Each function corresponds to an enum value and can be null.
  void mapOrNull({
    ${args}
  }) => switch (this) {
    ${cases}
  };`.trim()
  }

  /**
   * Generates getters for enum values with documentation.
   * @returns A string containing the getters code.
   */
  private toGetterMethods(): string {
    return this.values
      .map((e) => `
  /// Returns \`true\` if the enum value is [${this.name}.${e}].
  bool get is${capitalize(e)} => this == ${this.name}.${e};`.trim())
      .join('\n\n  ')
  }
}
