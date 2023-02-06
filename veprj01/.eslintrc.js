module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    commonjs: true,
    es6: true,
    es2021: true,
    jest: true,
  },
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "plugin:prettier/recommended",
  ],
  parserOptions: {
    parser: "@babel/eslint-parser",
  },
  plugins: ["prettier"],
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",

    "prettier/prettier": ["error", { endOfLine: "auto" }],
    "linebreak-style": "off",
    "arrow-parens": ["error", "always"],
    "arrow-body-style": "off",
    "consistent-return": "off",
    "func-names": "off",
    "no-shadow": "off",
    "no-alert": "off",
    "no-var": "error",
    "no-unused-vars": "off",
    "no-param-reassign": ["error", { props: false }],
  },
  overrides: [
    {
      files: [
        "**/__tests__/*.{j,t}s?(x)",
        "**/tests/unit/**/*.spec.{j,t}s?(x)",
      ],
      env: {
        jest: true,
      },
    },
  ],
};
