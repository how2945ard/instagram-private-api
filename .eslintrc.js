module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['airbnb'],
  rules: {
    'consistent-return': 0,
    'max-len': [
      'error',
      {
        code: 120,
        ignoreStrings: true,
        ignoreRegExpLiterals: true,
      },
    ],
    'no-bitwise': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    "operator-linebreak": [2, "after"],
    'no-underscore-dangle': [
      2,
      {
        allow: ['_id', '__express', '__'],
      },
    ],
    'no-undef': 0,
    'no-param-reassign': 0,
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
};