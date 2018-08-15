module.exports = {
  "extends": "airbnb-base",
  "env": {
    "browser": true,
    "node": true
  },
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "warn",
    "prefer-destructuring": "warn",
    "max-len": "warn",
    "no-use-before-define": "warn",
    "eqeqeq": "warn",
    "no-prototype-builtins": "warn",
    "consistent-return": "warn",
    "import/order": "warn",
    "no-param-reassign": "warn",
    "no-shadow": "warn",
    "guard-for-in": "warn",
    "no-restricted-syntax": "warn",
    "no-return-assign": "warn",
    "no-plusplus": "warn",
    "global-require": "warn",
    "import/no-extraneous-dependencies": [
      "error", { devDependencies: true }
    ]
  }
};
