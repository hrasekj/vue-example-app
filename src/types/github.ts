export interface GitHubUser {
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

export interface GitHubRepo {
  description: string | null
  fork: boolean
  forks_count: number
  html_url: string
  language: string | null
  name: string
  stargazers_count: number
  updated_at: string
}
