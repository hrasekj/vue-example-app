import { effectScope, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import {
  loadGitHubProfile,
  useGitHubProfile,
  type GitHubProfileAdapter,
  type Profile,
} from './useGitHubProfile'

const rawUser = {
  avatar_url: 'https://example.com/avatar.png',
  bio: 'Test profile',
  blog: 'example.com',
  company: 'Example Org',
  email: null,
  followers: 10,
  following: 2,
  html_url: 'https://github.com/octocat',
  location: 'Internet',
  login: 'octocat',
  name: 'The Octocat',
}

const rawRepositories = [
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
]

const profile: Profile = {
  avatarUrl: 'https://example.com/avatar.png',
  bio: 'Test profile',
  company: 'Example Org',
  email: null,
  followerCount: 10,
  followingCount: 2,
  location: 'Internet',
  login: 'octocat',
  name: 'The Octocat',
  profileUrl: 'https://github.com/octocat',
  repositories: [
    {
      description: 'A friendly repository',
      forkCount: 3,
      isFork: false,
      language: 'TypeScript',
      name: 'hello-world',
      starCount: 12,
      url: 'https://github.com/octocat/hello-world',
    },
  ],
  websiteUrl: 'https://example.com/',
}

const ready = (login: string) => ({
  status: 'ready' as const,
  profile: { ...profile, login, name: login },
})

describe('loadGitHubProfile', () => {
  it('loads and converts a GitHub profile', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(rawUser), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(rawRepositories), { status: 200 }))
    const controller = new AbortController()

    await expect(loadGitHubProfile('octo cat', controller.signal, request)).resolves.toEqual({
      status: 'ready',
      profile,
    })
    expect(request).toHaveBeenNthCalledWith(1, 'https://api.github.com/users/octo%20cat', {
      signal: controller.signal,
    })
    expect(request).toHaveBeenNthCalledWith(
      2,
      'https://api.github.com/users/octo%20cat/repos?per_page=100&sort=updated',
      { signal: controller.signal },
    )
  })

  it('maps missing users and rate limits to explicit outcomes', async () => {
    const missingRequest = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 404 }))
    const rateLimitedRequest = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 403,
        headers: { 'X-RateLimit-Remaining': '0' },
      }),
    )

    await expect(
      loadGitHubProfile('missing', new AbortController().signal, missingRequest),
    ).resolves.toEqual({ status: 'not-found' })
    await expect(
      loadGitHubProfile('octocat', new AbortController().signal, rateLimitedRequest),
    ).resolves.toEqual({ status: 'rate-limited' })
  })
})

describe('useGitHubProfile', () => {
  it('cancels the previous load and keeps the latest profile', async () => {
    let resolveOld!: (result: Awaited<ReturnType<GitHubProfileAdapter>>) => void
    const oldResult = new Promise<Awaited<ReturnType<GitHubProfileAdapter>>>((resolve) => {
      resolveOld = resolve
    })
    const adapter = vi
      .fn<GitHubProfileAdapter>()
      .mockReturnValueOnce(oldResult)
      .mockResolvedValueOnce(ready('new-user'))
    const username = ref('old-user')
    const scope = effectScope()
    const composable = scope.run(() => useGitHubProfile(() => username.value, adapter))!

    await nextTick()
    expect(adapter).toHaveBeenCalledTimes(1)
    username.value = 'new-user'
    await nextTick()
    await vi.waitFor(() => expect(composable.profileState.value).toEqual(ready('new-user')))

    expect(adapter.mock.calls[0]![1].aborted).toBe(true)
    resolveOld(ready('old-user'))
    await nextTick()
    expect(composable.profileState.value).toEqual(ready('new-user'))

    const currentSignal = adapter.mock.calls[1]![1]
    scope.stop()
    expect(currentSignal.aborted).toBe(true)
  })

  it('exposes errors and retries manually', async () => {
    const adapter = vi
      .fn<GitHubProfileAdapter>()
      .mockRejectedValueOnce(new Error('network failed'))
      .mockResolvedValueOnce(ready('octocat'))
    const scope = effectScope()
    const composable = scope.run(() => useGitHubProfile(() => 'octocat', adapter))!

    await vi.waitFor(() => expect(composable.profileState.value).toEqual({ status: 'error' }))
    await composable.retry()

    expect(composable.profileState.value).toEqual(ready('octocat'))
    expect(adapter).toHaveBeenCalledTimes(2)
    scope.stop()
  })
})
