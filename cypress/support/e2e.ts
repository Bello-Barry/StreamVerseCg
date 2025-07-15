// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  const originalFetch = win.fetch
  win.fetch = function (...args) {
    return originalFetch.apply(this, args)
  }
})

// Custom command to wait for app to be ready
Cypress.Commands.add('waitForApp', () => {
  cy.get('[data-testid="app-container"]', { timeout: 10000 }).should('be.visible')
})

// Custom command to add a playlist
Cypress.Commands.add('addPlaylist', (name: string, url: string) => {
  cy.get('[data-testid="add-playlist-button"]').click()
  cy.get('[data-testid="playlist-name-input"]').type(name)
  cy.get('[data-testid="playlist-url-input"]').type(url)
  cy.get('[data-testid="add-playlist-submit"]').click()
})

declare global {
  namespace Cypress {
    interface Chainable {
      waitForApp(): Chainable<void>
      addPlaylist(name: string, url: string): Chainable<void>
    }
  }
}

