import { describe, it, expect } from 'vitest'
import useGallery from './useGallery'

describe('useGallery', () => {
  it('initializes with default values', () => {
    const gallery = useGallery()

    expect(gallery.searchBox.value).toBe('')
    expect(gallery.searchResults.value).toEqual([])
    expect(gallery.pageAmount.value).toBe(0)
    expect(gallery.pageIndex.value).toBe(0)
  })

  it('computes hasResults correctly', () => {
    const gallery = useGallery()

    expect(gallery.hasResults.value).toBe(false)

    gallery.searchResults.value = [
      {
        id: 1,
        hash: 'abc123',
        type: 'image',
      } as any,
    ]

    expect(gallery.hasResults.value).toBe(true)
  })

  it('computes isFirstPage correctly', () => {
    const gallery = useGallery()

    expect(gallery.isFirstPage.value).toBe(true)

    gallery.pageIndex.value = 1
    expect(gallery.isFirstPage.value).toBe(false)

    gallery.pageIndex.value = 0
    expect(gallery.isFirstPage.value).toBe(true)
  })

  it('computes isLastPage correctly', () => {
    const gallery = useGallery()

    gallery.pageAmount.value = 5
    gallery.pageIndex.value = 0
    expect(gallery.isLastPage.value).toBe(false)

    gallery.pageIndex.value = 4
    expect(gallery.isLastPage.value).toBe(true)

    gallery.pageIndex.value = 5
    expect(gallery.isLastPage.value).toBe(true)
  })

  it('prevents changing to invalid pages', async () => {
    const gallery = useGallery()
    gallery.pageAmount.value = 3
    gallery.pageIndex.value = 1

    await gallery.jumpToPage(-1)
    expect(gallery.pageIndex.value).toBe(1)

    await gallery.jumpToPage(5)
    expect(gallery.pageIndex.value).toBe(1)
  })
})