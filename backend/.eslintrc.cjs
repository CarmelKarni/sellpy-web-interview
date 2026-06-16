module.exports = {
  env: {
    node: true,
    es2020: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  globals: {
    Map: 'readonly',
  },
  overrides: [
    {
      files: ['**/*.test.js'],
      env: {
        jest: true,
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
      },
    },
  ],
  rules: {},
}
