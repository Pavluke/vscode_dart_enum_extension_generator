/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1)
}