import { onScopeDispose, readonly, ref, watch } from 'vue'

interface GitHubUserResponse {
  avatar_url: string
  bio: string | null
  blog: string | null
  company: string | null
  email: string | null
  followers: number
  following: number
  html_url: string
  location: string | null
  login: string
  name: string | null
}

interface GitHubRepositoryResponse {
  description: string | null
  fork: boolean
  forks_count: number
  html_url: string
  language: string | null
  name: string
  stargazers_count: number
}

export interface Repository {
  description: string | null
  forkCount: number
  isFork: boolean
  language: string | null
  name: string
  starCount: number
  url: string
}

export interface Profile {
  avatarUrl: string
  bio: string | null
  company: string | null
  email: string | null
  followerCount: number
  followingCount: number
  location: string | null
  login: string
  name: string | null
  profileUrl: string
  repositories: Repository[]
  websiteUrl: string | null
}

export type ProfileResult =
  { status: 'ready'; profile: Profile } | { status: 'not-found' } | { status: 'rate-limited' }

export type ProfileLoadState = { status: 'loading' } | ProfileResult | { status: 'error' }

export type GitHubProfileAdapter = (username: string, signal: AbortSignal) => Promise<ProfileResult>

function isRateLimited(response: Response) {
  return response.status === 403 && response.headers.get('X-RateLimit-Remaining') === '0'
}

function normalizeWebsite(blog: string | null) {
  if (!blog) return null
  try {
    const url = new URL(blog.startsWith('http') ? blog : `https://${blog}`)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

export async function loadGitHubProfile(
  username: string,
  signal: AbortSignal,
  request: typeof fetch = fetch,
): Promise<ProfileResult> {
  const encodedUsername = encodeURIComponent(username)
  const userResponse = await request(`https://api.github.com/users/${encodedUsername}`, { signal })
  signal.throwIfAborted()

  if (userResponse.status === 404) return { status: 'not-found' }
  if (isRateLimited(userResponse)) return { status: 'rate-limited' }
  if (!userResponse.ok) throw new Error(`GitHub user request failed: ${userResponse.status}`)

  const user = (await userResponse.json()) as GitHubUserResponse
  signal.throwIfAborted()

  // ponytail: GitHub caps this view at 100 repos; add pagination when larger profiles matter.
  const repositoryResponse = await request(
    `https://api.github.com/users/${encodedUsername}/repos?per_page=100&sort=updated`,
    { signal },
  )
  signal.throwIfAborted()

  if (isRateLimited(repositoryResponse)) return { status: 'rate-limited' }
  if (!repositoryResponse.ok) {
    throw new Error(`GitHub repository request failed: ${repositoryResponse.status}`)
  }

  const repositories = (await repositoryResponse.json()) as GitHubRepositoryResponse[]
  signal.throwIfAborted()

  return {
    status: 'ready',
    profile: {
      avatarUrl: user.avatar_url,
      bio: user.bio,
      company: user.company,
      email: user.email,
      followerCount: user.followers,
      followingCount: user.following,
      location: user.location,
      login: user.login,
      name: user.name,
      profileUrl: user.html_url,
      repositories: repositories.map((repository) => ({
        description: repository.description,
        forkCount: repository.forks_count,
        isFork: repository.fork,
        language: repository.language,
        name: repository.name,
        starCount: repository.stargazers_count,
        url: repository.html_url,
      })),
      websiteUrl: normalizeWebsite(user.blog),
    },
  }
}

export function useGitHubProfile(
  username: () => string,
  adapter: GitHubProfileAdapter = loadGitHubProfile,
) {
  const profileState = ref<ProfileLoadState>({ status: 'loading' })
  let controller: AbortController | undefined

  async function load() {
    controller?.abort()
    controller = new AbortController()
    const { signal } = controller
    profileState.value = { status: 'loading' }

    try {
      const result = await adapter(username(), signal)
      if (!signal.aborted) profileState.value = result
    } catch (error) {
      if (!signal.aborted && !(error instanceof DOMException && error.name === 'AbortError')) {
        profileState.value = { status: 'error' }
      }
    }
  }

  watch(username, () => void load(), { immediate: true })
  onScopeDispose(() => controller?.abort())

  return { profileState: readonly(profileState), retry: load }
}
