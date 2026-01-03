import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import useGallery, { COLS } from './useGallery'
import { models } from '../../wailsjs/go/models'

describe('useGallery Keyboard Navigation', () => {
  let gallery: ReturnType<typeof useGallery>

  // Helper to simulate key press
  const pressKey = (key: string) => {
    const event = new KeyboardEvent('keydown', { key })
    document.dispatchEvent(event)
  }

  beforeEach(() => {
    gallery = useGallery()
    gallery.enableKeyboard()
    
    // Setup mock data
    const mediaList = []
    for (let i = 1; i <= 20; i++) {
        mediaList.push(new models.Media({ ID: i, MD5: `hash${i}` }))
    }
    
    gallery.searchResults.value = new models.SearchResult({
        Media: mediaList,
        TotalCount: 20,
        FirstID: 1,
        LastID: 20,
        HasMore: false
    })
    
    // Start at 0 (Search Box)
    gallery.selectedIdx.value = 0
  })

  afterEach(() => {
    gallery.disableKeyboard()
  })

  it('navigates Down from SearchBox to First Item', () => {
    pressKey('ArrowDown')
    expect(gallery.selectedIdx.value).toBe(1)
  })

  it('navigates Right from SearchBox to First Item', () => {
    pressKey('ArrowRight')
    expect(gallery.selectedIdx.value).toBe(1)
  })

  it('navigates Right correctly within row', () => {
    gallery.selectedIdx.value = 1
    pressKey('ArrowRight')
    expect(gallery.selectedIdx.value).toBe(2)
  })

  it('stops at Right edge of row', () => {
    gallery.selectedIdx.value = 5 // End of Row 1
    pressKey('ArrowRight')
    expect(gallery.selectedIdx.value).toBe(5) // Should not wrap to 6
  })

  it('navigates Left correctly within row', () => {
    gallery.selectedIdx.value = 2
    pressKey('ArrowLeft')
    expect(gallery.selectedIdx.value).toBe(1)
  })

  it('navigates Left from Start of Row 1 to SearchBox', () => {
    gallery.selectedIdx.value = 1
    pressKey('ArrowLeft')
    expect(gallery.selectedIdx.value).toBe(0)
  })

  it('stops at Left edge of other rows', () => {
    gallery.selectedIdx.value = 6 // Start of Row 2
    pressKey('ArrowLeft')
    expect(gallery.selectedIdx.value).toBe(6) // Should not wrap to 5
  })

  it('navigates Down correctly', () => {
    gallery.selectedIdx.value = 1
    pressKey('ArrowDown')
    expect(gallery.selectedIdx.value).toBe(1 + COLS) // 6
  })

  it('stops Down at last available row item', () => {
    // If we have 20 items. Row 4 is 16..20.
    gallery.selectedIdx.value = 16
    pressKey('ArrowDown')
    expect(gallery.selectedIdx.value).toBe(16) // Cannot go to 21
  })

  it('navigates Up correctly', () => {
    gallery.selectedIdx.value = 6
    pressKey('ArrowUp')
    expect(gallery.selectedIdx.value).toBe(1)
  })

  it('navigates Up to SearchBox from Row 1', () => {
    gallery.selectedIdx.value = 1
    pressKey('ArrowUp')
    expect(gallery.selectedIdx.value).toBe(0)
    
    gallery.selectedIdx.value = 5
    pressKey('ArrowUp')
    expect(gallery.selectedIdx.value).toBe(0)
  })

  it('supports WASD keys', () => {
    // W (Up)
    gallery.selectedIdx.value = 6
    pressKey('W')
    expect(gallery.selectedIdx.value).toBe(1)

    // A (Left)
    gallery.selectedIdx.value = 2
    pressKey('A')
    expect(gallery.selectedIdx.value).toBe(1)

    // S (Down)
    gallery.selectedIdx.value = 1
    pressKey('S')
    expect(gallery.selectedIdx.value).toBe(6)

    // D (Right)
    gallery.selectedIdx.value = 1
    pressKey('D')
    expect(gallery.selectedIdx.value).toBe(2)
  })
})
