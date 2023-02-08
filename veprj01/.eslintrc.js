module.exports = {
  /*
    https://feynubrick.github.io/2019/05/20/eslint-prettier.html
    ESLint 규칙:
        https://eslint.org/docs/rules/
        https://eslint.org/docs/user-guide/configuring/
    Prettier 옵션:
        https://prettier.io/docs/en/options.html
    */
  root: true,
  env: {
    browser: false,
    node: true,
    mocha: true,
  },
  plugins: ["prettier"],
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  parserOptions: {
    parser: "babel-eslint",
  },
  ignorePatterns: ["node_modules/"],
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto",
      },
    ],
  },
};
