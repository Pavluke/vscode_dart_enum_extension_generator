import { Range } from 'vscode'

/**
 * Interface representing a Dart enum.
 */
export interface IDartEnum {
	name: string
	values: string[]
	range: Range

	toWhenMethod(): string
	toMaybeWhenMethod(): string
	toWhenOrNullMethod(): string
	toMapMethod(): string
	toMaybeMapMethod(): string
	toMapWithValuesMethod(): string
	toGetterMethods(): string
}

/**
 * Interface for DartEnum factory.
 */
export interface IDartEnumFactory {
	fromString(input: string): IDartEnum | null
}