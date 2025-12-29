import { describe, it, expect } from 'vitest'
import useGallery, { ITEMS_PER_PAGE } from './useGallery'
import { models } from '../../wailsjs/go/models'

describe('useGallery', () => {
  it('initializes with default values', () => {
    const gallery = useGallery()

    expect(gallery.searchBox.value).toBe('')
    expect(gallery.searchResults.value).toEqual(new models.SearchResult({
      Media: [],
      TotalCount: 0,
      FirstID: 0,
      LastID: 0,
      HasMore: false
    }))
    expect(gallery.pageAmount.value).toBe(0)
    expect(gallery.pageIndex.value).toBe(0)
  })

  it('computes hasResults correctly', () => {
    const gallery = useGallery()

    expect(gallery.hasResults.value).toBe(false)

    const mockedResult = new models.SearchResult()
    mockedResult.Media = [new models.Media({ ID: 1, MD5: 'abc123' })]
    gallery.searchResults.value = mockedResult

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

    // pageAmount = 5 -> TotalCount = 5 * ITEMS_PER_PAGE
    const mockedResult = new models.SearchResult()
    mockedResult.TotalCount = 5 * ITEMS_PER_PAGE
    gallery.searchResults.value = mockedResult

    gallery.pageIndex.value = 0
    expect(gallery.isLastPage.value).toBe(false)

    gallery.pageIndex.value = 4
    expect(gallery.isLastPage.value).toBe(true)
    
    // Page index >= pageAmount - 1
    gallery.pageIndex.value = 5
    expect(gallery.isLastPage.value).toBe(true)
  })

  it('prevents changing to invalid pages', async () => {
    const gallery = useGallery()
    // pageAmount = 3 -> TotalCount = 3 * ITEMS_PER_PAGE
    const mockedResult = new models.SearchResult()
    mockedResult.TotalCount = 3 * ITEMS_PER_PAGE
    gallery.searchResults.value = mockedResult
    
    gallery.pageIndex.value = 1

    await gallery.jumpToPage(-1)
    expect(gallery.pageIndex.value).toBe(1)

    await gallery.jumpToPage(5)
    expect(gallery.pageIndex.value).toBe(1)
  })
})