module.exports = {
  "extends": "airbnb-base",
  "env": {
    "browser": true,
  },
  "rules": {
    "eqeqeq": "warn",
    "import/no-extraneous-dependencies": [
      "error", { devDependencies: true }
    ],
    "no-param-reassign": "warn",
    "no-use-before-define": "warn",
  }
};
