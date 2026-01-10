# GEMINI.md - Dispatch

This document provides a comprehensive overview of the `dispatch` repository for AI agents. It covers the project's purpose, technologies, structure, and development conventions.

## Project Overview

`dispatch` is a lightweight, type-safe state machine library for TypeScript. It offers a simple API for creating state machines with features like IDE autocomplete for events, runtime validation, and optional schema validation using Zod. The library is designed to be easy to learn and use, providing a flexible way to manage state in TypeScript applications, including seamless integration with React.

## Tech Stacks

- **Language**: TypeScript
- **Bundler**: [rolldown](https://rolldown.rs/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Linting**: [ESLint](https://eslint.org/)
- **Code Formatting**: [Prettier](https://prettier.io/)
- **State Management**: [Immer](https://immerjs.github.io/immer/) for immutable updates.
- **Frameworks**: The library is framework-agnostic but has a specific integration for [React](https://reactjs.org/).

## Directory and File Structure

The repository has a clear and organized structure:

```
/
├─── .github/           # GitHub Actions and other configurations
├─── dist/              # Compiled output files (not in the repo)
├─── examples/          # Usage examples for different scenarios
│   ├─── advanced-example.ts
│   ├─── example.ts
│   ├─── react-example.tsx
│   └─── zod-example.ts
├─── src/               # Source code
│   ├─── __tests__/     # Test files
│   │   ├─── builder.test.ts
│   │   ├─── react.test.tsx
│   │   └─── vanilla.test.ts
│   ├─── react/         # React-specific integration
│   │   └─── index.ts
│   ├─── vanilla/       # Core vanilla TypeScript implementation
│   │   ├─── builder.ts
│   │   └─── index.ts
│   └─── index.ts       # Main entry point
├─── package.json       # Project metadata and dependencies
├─── tsconfig.json      # TypeScript configuration
└─── vitest.config.ts   # Vitest configuration
```

- **`src/`**: Contains the core logic of the library, separated into `vanilla` for the core implementation and `react` for the React hooks.
- **`src/__tests__/`**: Houses all the tests, mirroring the structure of the `src` directory.
- **`examples/`**: Provides practical examples of how to use the library in different contexts.
- **`dist/`**: The directory where the compiled and bundled code is placed after the build process.

## Building and Running

The project uses `rolldown` for bundling and `tsc` for emitting TypeScript declarations.

- **Build the project**:
  ```bash
  bun run build
  ```
  This command runs `rolldown -c` to bundle the code and `tsc --emitDeclarationOnly` to generate the type definitions.

## Testing

The project uses [Vitest](https.vitest.dev) for running tests. The test suite includes unit tests for the core logic and the React integration.

- **Run all tests**:
  ```bash
  bun run test
  ```
  This command executes a series of checks:
  1.  `prettier . --list-different`: Checks for formatting issues.
  2.  `tsc --noEmit`: Verifies TypeScript types.
  3.  `eslint .`: Lints the codebase.
  4.  `vitest run`: Runs the spec tests.

## Development Conventions

- **Type Safety**: The library is written entirely in TypeScript and emphasizes strong type safety.
- **Immutability**: State updates are handled using `immer`, ensuring that state is never mutated directly.
- **Testing**: All new features and bug fixes should be accompanied by tests.
- **Linting and Formatting**: The project uses ESLint and Prettier to maintain a consistent code style. All code should be formatted and linted before committing.

## Available Scripts

Here are the most relevant scripts from `package.json`:

- `bun run build`: Bundles the library for production.
- `bun run test`: Runs all tests, including linting and type-checking.
- `bun run test:spec`: Runs only the spec tests with Vitest.
- `bun run prepublishOnly`: A pre-publish script that ensures the project is built and tested before being published to npm.
