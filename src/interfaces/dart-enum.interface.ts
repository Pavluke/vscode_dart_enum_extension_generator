import { Range } from 'vscode'

/**
 * Interface representing a Dart enum.
 */
export abstract class IDartEnum {
	name: string
	values: string[]
	range: Range

	constructor(name: string, values: string[], range: Range) {
		this.name = name
		this.values = values
		this.range = range
	}

	abstract createExtension(): string

}

/**
 * Interface for DartEnum factory.
 */
export interface IDartEnumFactory {
	fromString(input: string): IDartEnum | null
}