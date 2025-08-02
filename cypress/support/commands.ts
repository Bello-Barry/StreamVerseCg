/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to simulate mobile viewport
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667)
})

// Custom command to simulate tablet viewport
Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024)
})

// Custom command to simulate desktop viewport
Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720)
})

// Custom command to check if element is in viewport
Cypress.Commands.add('isInViewport', { prevSubject: true }, (subject) => {
  const bottom = Cypress.$(cy.state('window')).height()
  const right = Cypress.$(cy.state('window')).width()
  const rect = subject[0].getBoundingClientRect()

  expect(rect.top).to.be.lessThan(bottom)
  expect(rect.bottom).to.be.greaterThan(0)
  expect(rect.right).to.be.greaterThan(0)
  expect(rect.left).to.be.lessThan(right)

  return subject
})

declare global {
  namespace Cypress {
    interface Chainable {
      setMobileViewport(): Chainable<void>
      setTabletViewport(): Chainable<void>
      setDesktopViewport(): Chainable<void>
      isInViewport(): Chainable<JQuery<HTMLElement>>
    }
  }
}

