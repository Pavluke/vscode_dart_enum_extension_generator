# Dart Enum Extensions Generator

An extension for Visual Studio Code that automatically generates useful
extension methods for Dart enums, enhancing productivity and code consistency.

![Generated Extension](https://github.com/Pavluke/vscode_dart_enum_extensions_generator/blob/main/assets/gifs/generated.gif?raw=true)
![Regenerated Extension](https://github.com/Pavluke/vscode_dart_enum_extensions_generator/blob/main/assets/gifs/regenerated.gif?raw=true)

## Features

Effortlessly generate the following extension methods for your Dart enums:

- **`is` Getters**: Automatically create getter methods to check enum values.
- **`map`**: Execute functions based on enum values.
- **`maybeMap`**: Execute optional functions based on enum values.
- **`when`**: Execute a function based on the enum value.
- **`maybeWhen`**: Execute a function with a fallback for enum values.
- **`whenOrNull`**: Execute a function that can return null based on the enum
  value.
