/**
 * Version utilities for checking updates against GitHub releases
 */

import { APP_VERSION, GITHUB_REPO } from '../config/constants';

export interface GitHubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
  body: string;
}

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string | null;
  releaseUrl: string | null;
  releaseNotes: string | null;
}

/**
 * Parse a semantic version string into components
 */
export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
} | null {
  // Remove 'v' prefix if present
  const clean = version.replace(/^v/, '');
  const match = clean.match(/^(\d+)\.(\d+)\.(\d+)/);

  if (!match) {
    return null;
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Compare two semantic versions
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
export function compareVersions(a: string, b: string): number {
  const versionA = parseVersion(a);
  const versionB = parseVersion(b);

  if (!versionA || !versionB) {
    return 0;
  }

  if (versionA.major !== versionB.major) {
    return versionA.major > versionB.major ? 1 : -1;
  }

  if (versionA.minor !== versionB.minor) {
    return versionA.minor > versionB.minor ? 1 : -1;
  }

  if (versionA.patch !== versionB.patch) {
    return versionA.patch > versionB.patch ? 1 : -1;
  }

  return 0;
}

/**
 * Get the current app version
 */
export function getCurrentVersion(): string {
  return APP_VERSION;
}

/**
 * Fetch the latest release from GitHub
 */
export async function getLatestRelease(): Promise<GitHubRelease | null> {
  const url = `https://api.github.com/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.repo}/releases/latest`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No releases yet
        return null;
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch latest release:', error);
    return null;
  }
}

/**
 * Check if an update is available
 */
export async function checkForUpdate(): Promise<UpdateInfo> {
  const currentVersion = getCurrentVersion();

  const result: UpdateInfo = {
    hasUpdate: false,
    currentVersion,
    latestVersion: null,
    releaseUrl: null,
    releaseNotes: null,
  };

  const release = await getLatestRelease();

  if (!release) {
    return result;
  }

  const latestVersion = release.tag_name.replace(/^v/, '');
  result.latestVersion = latestVersion;
  result.releaseUrl = release.html_url;
  result.releaseNotes = release.body;

  // Check if the latest version is newer than the current version
  result.hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

  return result;
}
