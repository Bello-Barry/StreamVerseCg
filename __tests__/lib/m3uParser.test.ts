import { parseM3U } from '@/lib/m3uParser'

describe('M3U Parser', () => {
  const sampleM3U = `#EXTM3U
#EXTINF:-1 tvg-id="tf1.fr" tvg-name="TF1" tvg-logo="http://example.com/tf1.png" group-title="France",TF1
http://example.com/tf1.m3u8
#EXTINF:-1 tvg-id="france2.fr" tvg-name="France 2" tvg-logo="http://example.com/france2.png" group-title="France",France 2
http://example.com/france2.m3u8
#EXTINF:-1 tvg-id="cnn.us" tvg-name="CNN" tvg-logo="http://example.com/cnn.png" group-title="News",CNN International
http://example.com/cnn.m3u8`

  it('parses M3U content correctly', () => {
    const channels = parseM3U(sampleM3U)
    
    expect(channels).toHaveLength(3)
    
    expect(channels[0]).toEqual({
      id: 'tf1.fr',
      name: 'TF1',
      url: 'http://example.com/tf1.m3u8',
      logo: 'http://example.com/tf1.png',
      group: 'France',
      country: '',
      language: ''
    })
    
    expect(channels[1]).toEqual({
      id: 'france2.fr',
      name: 'France 2',
      url: 'http://example.com/france2.m3u8',
      logo: 'http://example.com/france2.png',
      group: 'France',
      country: '',
      language: ''
    })
    
    expect(channels[2]).toEqual({
      id: 'cnn.us',
      name: 'CNN International',
      url: 'http://example.com/cnn.m3u8',
      logo: 'http://example.com/cnn.png',
      group: 'News',
      country: '',
      language: ''
    })
  })

  it('handles empty M3U content', () => {
    const channels = parseM3U('')
    expect(channels).toHaveLength(0)
  })

  it('handles malformed M3U content', () => {
    const malformedM3U = `#EXTM3U
#EXTINF:-1,Test Channel
# This is not a valid URL
#EXTINF:-1,Another Channel
http://example.com/valid.m3u8`

    const channels = parseM3U(malformedM3U)
    expect(channels).toHaveLength(1)
    expect(channels[0].name).toBe('Another Channel')
    expect(channels[0].url).toBe('http://example.com/valid.m3u8')
  })

  it('generates unique IDs when tvg-id is missing', () => {
    const m3uWithoutIds = `#EXTM3U
#EXTINF:-1 tvg-name="Channel 1" group-title="Test",Channel 1
http://example.com/channel1.m3u8
#EXTINF:-1 tvg-name="Channel 2" group-title="Test",Channel 2
http://example.com/channel2.m3u8`

    const channels = parseM3U(m3uWithoutIds)
    
    expect(channels).toHaveLength(2)
    expect(channels[0].id).toBeTruthy()
    expect(channels[1].id).toBeTruthy()
    expect(channels[0].id).not.toBe(channels[1].id)
  })

  it('handles channels without logos', () => {
    const m3uWithoutLogos = `#EXTM3U
#EXTINF:-1 tvg-id="test.tv" tvg-name="Test TV" group-title="Test",Test TV
http://example.com/test.m3u8`

    const channels = parseM3U(m3uWithoutLogos)
    
    expect(channels).toHaveLength(1)
    expect(channels[0].logo).toBe('')
  })

  it('handles special characters in channel names', () => {
    const m3uWithSpecialChars = `#EXTM3U
#EXTINF:-1 tvg-id="special.tv" tvg-name="Chaîne Spéciale" group-title="Français",Chaîne Spéciale & Co
http://example.com/special.m3u8`

    const channels = parseM3U(m3uWithSpecialChars)
    
    expect(channels).toHaveLength(1)
    expect(channels[0].name).toBe('Chaîne Spéciale & Co')
    expect(channels[0].group).toBe('Français')
  })
})

