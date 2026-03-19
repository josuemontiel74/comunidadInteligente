const { defineConfig } = require("cypress");

module.exports = defineConfig({
  video: true,
  screenshotOnRunFailure: true,

  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",

    setupNodeEvents(on, config) {
      return config;
    },
  },
});