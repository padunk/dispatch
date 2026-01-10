export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        document: "readonly",
        console: "readonly",
        Bun: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "error",
      "no-undef": "error",
    },
  },
];
