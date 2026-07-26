import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import ProfileView from '../ProfileView.vue'

const user = {
  avatar_url: 'https://example.com/avatar.png',
  bio: 'Test profile',
  blog: null,
  company: 'Example Org',
  email: null,
  followers: 10,
  following: 2,
  html_url: 'https://github.com/octocat',
  location: 'Internet',
  login: 'octocat',
  name: 'The Octocat',
}

const repos = [
  {
    description: 'A friendly repository',
    fork: false,
    forks_count: 3,
    html_url: 'https://github.com/octocat/hello-world',
    language: 'TypeScript',
    name: 'hello-world',
    stargazers_count: 12,
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    description: 'Something else',
    fork: false,
    forks_count: 0,
    html_url: 'https://github.com/octocat/other',
    language: null,
    name: 'other',
    stargazers_count: 1,
    updated_at: '2026-01-01T00:00:00Z',
  },
]

async function mountProfile() {
  const router = createRouter({ history: createMemoryHistory(), routes: [] })
  return mount(ProfileView, { props: { username: 'octocat' }, global: { plugins: [router] } })
}

afterEach(() => vi.unstubAllGlobals())

describe('ProfileView', () => {
  it('loads a profile and filters repositories by name or description', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(user), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(repos), { status: 200 })),
    )

    const wrapper = await mountProfile()
    expect(wrapper.text()).toContain('Loading octocat')
    await flushPromises()
    expect(wrapper.text()).toContain('The Octocat')
    expect(wrapper.text()).toContain('hello-world')
    expect(wrapper.text()).toContain('other')

    await wrapper.get('#repo-search').setValue('friendly')
    expect(wrapper.text()).toContain('hello-world')
    expect(wrapper.text()).not.toContain('Something else')
  })

  it('does not let an aborted profile response overwrite a newer profile', async () => {
    let resolveOldUser!: (value: typeof user) => void
    const oldUserJson = new Promise<typeof user>((resolve) => {
      resolveOldUser = resolve
    })
    const oldResponse = new Response(null, { status: 200 })
    vi.spyOn(oldResponse, 'json').mockReturnValue(oldUserJson)
    const newUser = { ...user, login: 'new-user', name: 'New User' }
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(oldResponse)
      .mockResolvedValueOnce(new Response(JSON.stringify(newUser), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(repos), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = await mountProfile()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    await wrapper.setProps({ username: 'new-user' })
    await vi.waitFor(() => expect(wrapper.text()).toContain('New User'))

    resolveOldUser(user)
    await flushPromises()
    expect(wrapper.text()).toContain('New User')
    expect(wrapper.text()).not.toContain('The Octocat')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('shows the not-found state for a missing user', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })))
    const wrapper = await mountProfile()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('User not found')
  })

  it('shows the rate-limit state when GitHub reports no requests remaining', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, { status: 403, headers: { 'X-RateLimit-Remaining': '0' } }),
      ),
    )
    const wrapper = await mountProfile()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('GitHub rate limit reached')
  })
})
