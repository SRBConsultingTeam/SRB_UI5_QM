module.exports = {
  languageOptions: {
    parserOptions: {
      ecmaVersion: 12,
    },
    globals: {
      sap: true,
      $: true,
      jQuery: true,
      SRBLib: true,
      AppConfig: true,
      HierarchyGenerator: true,
      GroupGenerator: true,
      SettingsHandler: true,
      RouteHandler: true,
      StyleAndAdoptionHandler: true,
      SRBJSLogger: true,
      ViewGenerator: true,
      TileGenerator: true,
      DataHandler: true,
      TreeGenerator: true,
      TechObjectSearchHelps: true,
      StyleHandler: true,
      MetaTables: true,
    }
  },

  rules: {
    // Possible errors
    "no-unused-vars": "off", // disallow unused variables
    "default-case": "error", // require `default` cases in `switch` statements
    "default-case-last": "error", // enforce default clauses in switch statements to be last
    eqeqeq: "error", // require the use of `===` and `!==`
    "no-alert": "error", // disallow the use of `alert`, `confirm`, and `prompt`
    "no-empty-function": "error", // disallow empty functions
    "no-floating-decimal": "error", // disallow leading or trailing decimal points in numeric literals
    "no-constant-condition": "warn", // disallow constant expressions in conditions
    "no-useless-escape": "warn", // disallow unnecessary escapes
    "no-undef": "warn", // variables must be defined
    "no-unreachable": "warn", // unreachable code after return, throw, continue, and break statements

    // Styling conventions
    "no-sequences": "error", // disallow comma operators
    camelcase: "error", // enforce camelcase naming convention
    "comma-dangle": "error", // require or disallow trailing commas
    "linebreak-style": "error", // enforce consistent linebreak style
  },
};
