import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readonly, ref } from 'vue'
import { useGitHubProfile, type Profile, type ProfileLoadState } from '@/github/useGitHubProfile'
import RepositoryPage from './RepositoryPage.vue'

vi.mock('@/github/useGitHubProfile', () => ({
  useGitHubProfile: vi.fn<typeof useGitHubProfile>(),
}))

const profile: Profile = {
  avatarUrl: '',
  bio: null,
  company: null,
  email: null,
  followerCount: 0,
  followingCount: 0,
  location: null,
  login: 'octocat',
  name: null,
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
  websiteUrl: null,
}

const useGitHubProfileMock = vi.mocked(useGitHubProfile)

function mountRepository(state: ProfileLoadState, repositoryName = 'hello-world') {
  useGitHubProfileMock.mockReturnValue({
    profileState: readonly(ref(state)),
    retry: vi.fn<() => Promise<void>>(async () => {}),
  })

  return mount(RepositoryPage, {
    props: { repositoryName, username: 'octocat' },
    global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } },
  })
}

beforeEach(() => useGitHubProfileMock.mockReset())

describe('RepositoryPage', () => {
  it('renders the selected repository', () => {
    const wrapper = mountRepository({ status: 'ready', profile })

    expect(wrapper.get('h1').text()).toBe('hello-world')
    expect(wrapper.text()).toContain('A friendly repository')
    expect(wrapper.get('a[target="_blank"]').attributes('href')).toBe(
      'https://github.com/octocat/hello-world',
    )
  })

  it('renders a missing repository state', () => {
    const wrapper = mountRepository(
      { status: 'ready', profile: { ...profile, repositories: [] } },
      'missing',
    )

    expect(wrapper.get('[role="alert"]').text()).toContain('Repository not found')
  })
})
