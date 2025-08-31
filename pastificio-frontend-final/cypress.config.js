const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
        clearDownloads() {
          const fs = require('fs')
          const path = require('path')
          const downloadsFolder = path.join(__dirname, 'cypress', 'downloads')
          
          if (fs.existsSync(downloadsFolder)) {
            fs.readdirSync(downloadsFolder).forEach(file => {
              fs.unlinkSync(path.join(downloadsFolder, file))
            })
          }
          return null
        }
      })
      
      return config
    },
    
    env: {
      apiUrl: 'http://localhost:5000/api',
      coverage: false
    },
    
    experimentalStudio: true,
    experimentalMemoryManagement: true,
    
    retries: {
      runMode: 2,
      openMode: 0
    }
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  }
})