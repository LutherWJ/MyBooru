import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import useUploadStore from './uploadStore'

vi.mock('../../wailsjs/go/app/App', () => ({
  StartUpload: vi.fn(() => Promise.resolve('session-123')),
  UploadChunk: vi.fn(() => Promise.resolve()),
  FinalizeUpload: vi.fn(() => Promise.resolve(1)),
}))

describe('Upload Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with empty state', () => {
    const store = useUploadStore()

    expect(store.mediaList).toEqual([])
    expect(store.mediaTagList).toEqual([])
    expect(store.selectedIndex).toBe(0)
    expect(store.uploadProgress).toBe(0)
  })

  it('calculates buffer size correctly', () => {
    const store = useUploadStore()

    const blob1 = new Blob(['test'], { type: 'text/plain' })
    const blob2 = new Blob(['hello world'], { type: 'text/plain' })

    store.mediaList.push(blob1)
    store.mediaList.push(blob2)

    expect(store.bufferSize).toBe(blob1.size + blob2.size)
  })

  it('queues media', () => {
    const store = useUploadStore()
    const blob = new Blob(['test'], { type: 'image/jpeg' })

    store.queueMedia(blob)

    expect(store.mediaList).toHaveLength(1)
    expect(store.mediaList[0]).toBe(blob)
  })

  it('clears queue', () => {
    const store = useUploadStore()

    store.mediaList = [
      new Blob(['1']),
      new Blob(['2']),
      new Blob(['3']),
    ]

    store.clearQueue()

    expect(store.mediaList).toEqual([])
  })

  it('unqueues media by index', () => {
    const store = useUploadStore()
    const blob1 = new Blob(['1'])
    const blob2 = new Blob(['2'])
    const blob3 = new Blob(['3'])

    store.mediaList = [blob1, blob2, blob3]

    store.unqueueMedia(1)

    expect(store.mediaList).toHaveLength(2)
    expect(store.mediaList[0]).toBe(blob1)
    expect(store.mediaList[1]).toBe(blob3)
  })

  it('prevents unqueuing invalid index', () => {
    const store = useUploadStore()
    store.mediaList = [new Blob(['1']), new Blob(['2'])]

    store.unqueueMedia(-1)
    expect(store.mediaList).toHaveLength(2)

    store.unqueueMedia(5)
    expect(store.mediaList).toHaveLength(2)
  })

  it('resets selected index when unqueuing selected media', () => {
    const store = useUploadStore()
    store.mediaList = [new Blob(['1']), new Blob(['2']), new Blob(['3'])]
    store.selectedIndex = 2

    store.unqueueMedia(2)

    expect(store.selectedIndex).toBe(0)
  })

  it('changes selected index', () => {
    const store = useUploadStore()
    store.mediaList = [new Blob(['1']), new Blob(['2']), new Blob(['3'])]

    store.setselectedIndex(1)
    expect(store.selectedIndex).toBe(1)

    store.setselectedIndex(2)
    expect(store.selectedIndex).toBe(2)
  })

  it('prevents setting invalid selected index', () => {
    const store = useUploadStore()
    store.mediaList = [new Blob(['1']), new Blob(['2'])]
    store.selectedIndex = 0

    store.setselectedIndex(-1)
    expect(store.selectedIndex).toBe(0)

    store.setselectedIndex(5)
    expect(store.selectedIndex).toBe(0)
  })

  it('gets selected media', () => {
    const store = useUploadStore()
    const blob1 = new Blob(['1'])
    const blob2 = new Blob(['2'])

    store.mediaList = [blob1, blob2]
    store.selectedIndex = 1

    expect(store.selectedMedia).toBe(blob2)
  })

  it('gets selected tag box', () => {
    const store = useUploadStore()

    store.mediaTagList = ['tag1 tag2', 'tag3 tag4']
    store.selectedIndex = 1

    expect(store.selectedTagBox).toBe('tag3 tag4')
  })
})