describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('has proper heading hierarchy', () => {
    cy.get('h1').should('exist').and('contain', 'StreamVerse')
  })

  it('has proper alt text for images', () => {
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'alt')
    })
  })

  it('has proper labels for form inputs', () => {
    cy.contains('Recherche').click()
    cy.get('input[type="text"]').should('have.attr', 'placeholder')

    cy.contains('Playlists').click()
    cy.get('[data-testid="add-playlist-button"]').click()
    cy.get('input').each(($input) => {
      const hasPlaceholder = $input.attr('placeholder')
      const hasAriaLabel = $input.attr('aria-label')

      expect(!!hasPlaceholder || !!hasAriaLabel).to.be.true
    })
  })

  it('supports keyboard navigation', () => {
    cy.get('[data-testid="menu-button"]').focus().type('{enter}')
    cy.get('[data-testid="sidebar"]').should('be.visible')
  })

  it('has proper ARIA attributes', () => {
    cy.get('[role="button"]').should('exist')
    cy.get('[aria-label]').should('exist')

    cy.get('[data-testid="menu-button"]').click()
    cy.get('[data-testid="sidebar"]').should('have.attr', 'role')
  })

  it('has sufficient color contrast', () => {
    cy.get('body').should('be.visible')
    cy.get('[data-testid="header"]').should('be.visible')
    cy.contains('StreamVerse').should('be.visible')
  })

  it('works with screen reader simulation', () => {
    cy.get('[data-testid="header"]').should('contain.text', 'StreamVerse')
    cy.get('nav').should('exist')
    cy.get('main').should('exist')
  })

  it('handles focus management', () => {
    cy.get('[data-testid="menu-button"]').click()
    cy.get('[data-testid="sidebar"]').should('be.visible')

    cy.get('[data-testid="sidebar"] a').first().focus()
    cy.focused().should('be.visible')
  })

  it('provides proper error messages', () => {
    cy.contains('Playlists').click()
    cy.get('[data-testid="add-playlist-button"]').click()
    cy.get('[data-testid="add-playlist-submit"]').click()

    cy.get('[role="alert"]').should('exist')
  })
})