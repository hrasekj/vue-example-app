import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HomePage from './index.vue'

const push = vi.fn<(path: string) => void>()

beforeEach(() => vi.stubGlobal('useRouter', () => ({ push })))
afterEach(() => {
  push.mockClear()
  vi.unstubAllGlobals()
})

describe('HomePage', () => {
  it('opens the entered profile', async () => {
    const wrapper = mount(HomePage)

    await wrapper.get('#username').setValue(' octo cat ')
    await wrapper.get('form').trigger('submit')

    expect(push).toHaveBeenCalledWith('/octo%20cat')
  })
})
