const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
    },
    pageLoadTimeout: 120000,
    chromeWebSecurity: false
  }
});
