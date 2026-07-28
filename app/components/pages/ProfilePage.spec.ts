import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readonly, ref } from 'vue'
import { useGitHubProfile, type Profile, type ProfileLoadState } from '@/github/useGitHubProfile'
import ProfilePage from './ProfilePage.vue'

vi.mock('@/github/useGitHubProfile', () => ({
  useGitHubProfile: vi.fn<typeof useGitHubProfile>(),
}))

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
    {
      description: 'Something else',
      forkCount: 0,
      isFork: false,
      language: null,
      name: 'other',
      starCount: 1,
      url: 'https://github.com/octocat/other',
    },
  ],
  websiteUrl: null,
}

const retry = vi.fn<() => Promise<void>>(async () => {})
const useGitHubProfileMock = vi.mocked(useGitHubProfile)

function show(state: ProfileLoadState) {
  useGitHubProfileMock.mockReturnValue({
    profileState: readonly(ref(state)),
    retry,
  })
}

function mountProfile() {
  return mount(ProfilePage, {
    props: { username: 'octocat' },
    global: {
      stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } },
    },
  })
}

beforeEach(() => {
  retry.mockClear()
  useGitHubProfileMock.mockReset()
})

describe('ProfilePage', () => {
  it('renders a profile and filters repositories by name or description', async () => {
    show({ status: 'ready', profile })
    const wrapper = await mountProfile()

    expect(wrapper.text()).toContain('The Octocat')
    expect(wrapper.get('a[href="/octocat/hello-world"]').text()).toBe('hello-world')
    expect(wrapper.text()).toContain('other')

    await wrapper.get('#repo-search').setValue('friendly')
    expect(wrapper.text()).toContain('hello-world')
    expect(wrapper.text()).not.toContain('Something else')
  })

  it.each([
    [{ status: 'loading' } satisfies ProfileLoadState, 'Loading octocat'],
    [{ status: 'not-found' } satisfies ProfileLoadState, 'User not found'],
    [{ status: 'rate-limited' } satisfies ProfileLoadState, 'GitHub rate limit reached'],
  ])('renders the %s state', async (state, text) => {
    show(state)
    const wrapper = await mountProfile()

    expect(wrapper.text()).toContain(text)
  })

  it('retries a failed load', async () => {
    show({ status: 'error' })
    const wrapper = await mountProfile()

    expect(wrapper.get('[role="alert"]').text()).toContain('Could not load this profile')
    await wrapper.get('button').trigger('click')
    expect(retry).toHaveBeenCalledOnce()
  })
})
