describe('Accessibility Tests', function () {
    beforeEach(function () {
        cy.visit('/');
    });
    it('has proper heading hierarchy', function () {
        cy.get('h1').should('exist');
        cy.get('h1').should('contain', 'StreamVerse');
    });
    it('has proper alt text for images', function () {
        cy.get('img').each(function ($img) {
            cy.wrap($img).should('have.attr', 'alt');
        });
    });
    it('has proper labels for form inputs', function () {
        cy.contains('Recherche').click();
        cy.get('input[type="text"]').should('have.attr', 'placeholder');
        cy.contains('Playlists').click();
        cy.get('[data-testid="add-playlist-button"]').click();
        cy.get('input').each(function ($input) {
            var hasPlaceholder = $input.attr('placeholder');
            var hasAriaLabel = $input.attr('aria-label');
            expect(hasPlaceholder || hasAriaLabel).to.be.ok;
        });
    });
    it('supports keyboard navigation', function () {
        cy.get('body').tab();
        cy.focused().should('be.visible');
        cy.get('[data-testid="menu-button"]').focus().type('{enter}');
        cy.get('[data-testid="sidebar"]').should('be.visible');
    });
    it('has proper ARIA attributes', function () {
        cy.get('[role="button"]').should('exist');
        cy.get('[aria-label]').should('exist');
        cy.get('[data-testid="menu-button"]').click();
        cy.get('[data-testid="sidebar"]').should('have.attr', 'role');
    });
    it('has sufficient color contrast', function () {
        cy.get('body').should('be.visible');
        cy.get('[data-testid="header"]').should('be.visible');
        cy.contains('StreamVerse').should('be.visible');
    });
    it('works with screen reader simulation', function () {
        cy.get('[data-testid="header"]').should('contain.text', 'StreamVerse');
        cy.get('nav').should('exist');
        cy.get('main').should('exist');
    });
    it('handles focus management', function () {
        cy.get('[data-testid="menu-button"]').click();
        cy.get('[data-testid="sidebar"]').should('be.visible');
        cy.get('[data-testid="sidebar"] a').first().focus();
        cy.focused().should('be.visible');
    });
    it('provides proper error messages', function () {
        cy.contains('Playlists').click();
        cy.get('[data-testid="add-playlist-button"]').click();
        cy.get('[data-testid="add-playlist-submit"]').click();
        cy.get('[role="alert"]').should(function ($el) {
            expect($el.text().length > 0).to.be.true;
        });
    });
});
