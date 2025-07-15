describe('StreamVerse App', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('loads the homepage successfully', () => {
    cy.contains('StreamVerse').should('be.visible')
    cy.get('[data-testid="app-container"]').should('be.visible')
  })

  it('displays navigation menu', () => {
    cy.get('[data-testid="header"]').should('be.visible')
    cy.contains('Accueil').should('be.visible')
    cy.contains('Catégories').should('be.visible')
    cy.contains('Favoris').should('be.visible')
    cy.contains('Recherche').should('be.visible')
  })

  it('navigates between pages', () => {
    // Navigate to Categories
    cy.contains('Catégories').click()
    cy.url().should('include', '#categories')
    
    // Navigate to Favorites
    cy.contains('Favoris').click()
    cy.url().should('include', '#favorites')
    
    // Navigate to Search
    cy.contains('Recherche').click()
    cy.url().should('include', '#search')
    
    // Navigate back to Home
    cy.contains('Accueil').click()
    cy.url().should('include', '#home')
  })

  it('opens and closes sidebar on mobile', () => {
    cy.setMobileViewport()
    
    // Open sidebar
    cy.get('[data-testid="menu-button"]').click()
    cy.get('[data-testid="sidebar"]').should('be.visible')
    
    // Close sidebar by clicking outside
    cy.get('[data-testid="sidebar-overlay"]').click({ force: true })
    cy.get('[data-testid="sidebar"]').should('not.be.visible')
  })

  it('displays default playlists', () => {
    cy.contains('Playlists').click()
    cy.get('[data-testid="playlist-item"]').should('have.length.at.least', 2)
    cy.contains('Schumijo').should('be.visible')
    cy.contains('IPTV-Org').should('be.visible')
  })

  it('searches for channels', () => {
    cy.contains('Recherche').click()
    cy.get('[data-testid="search-input"]').type('TF1')
    cy.get('[data-testid="search-results"]').should('be.visible')
  })

  it('adds and removes favorites', () => {
    // Go to home and find a channel
    cy.contains('Accueil').click()
    cy.get('[data-testid="channel-card"]').first().within(() => {
      cy.get('[data-testid="favorite-button"]').click()
    })
    
    // Check favorites page
    cy.contains('Favoris').click()
    cy.get('[data-testid="channel-card"]').should('have.length.at.least', 1)
    
    // Remove from favorites
    cy.get('[data-testid="channel-card"]').first().within(() => {
      cy.get('[data-testid="favorite-button"]').click()
    })
    
    cy.get('[data-testid="empty-favorites"]').should('be.visible')
  })

  it('plays a channel', () => {
    cy.get('[data-testid="channel-card"]').first().within(() => {
      cy.get('[data-testid="play-button"]').click()
    })
    
    cy.url().should('include', '#player')
    cy.get('[data-testid="video-player"]').should('be.visible')
    cy.get('[data-testid="player-controls"]').should('be.visible')
  })

  it('handles responsive design', () => {
    // Test mobile
    cy.setMobileViewport()
    cy.get('[data-testid="app-container"]').should('be.visible')
    cy.get('[data-testid="menu-button"]').should('be.visible')
    
    // Test tablet
    cy.setTabletViewport()
    cy.get('[data-testid="app-container"]').should('be.visible')
    
    // Test desktop
    cy.setDesktopViewport()
    cy.get('[data-testid="app-container"]').should('be.visible')
    cy.get('[data-testid="sidebar"]').should('be.visible')
  })

  it('handles playlist management', () => {
    cy.contains('Playlists').click()
    
    // Add new playlist
    cy.get('[data-testid="add-playlist-button"]').click()
    cy.get('[data-testid="playlist-name-input"]').type('Test Playlist')
    cy.get('[data-testid="playlist-url-input"]').type('http://example.com/test.m3u8')
    cy.get('[data-testid="add-playlist-submit"]').click()
    
    // Verify playlist was added
    cy.contains('Test Playlist').should('be.visible')
    
    // Delete playlist (if not default)
    cy.get('[data-testid="playlist-item"]').contains('Test Playlist').within(() => {
      cy.get('[data-testid="delete-playlist-button"]').click()
    })
    
    cy.contains('Test Playlist').should('not.exist')
  })
})

