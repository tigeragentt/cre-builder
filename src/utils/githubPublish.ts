import type { ProjectFiles } from "./projectGenerator";

const REPO = "tigeragentt/cre-scaffold-templates";
const API  = "https://api.github.com";

export interface PublishResult {
  branchUrl: string;
  branchName: string;
}

async function ghFetch(
  path: string,
  token: string,
  method: string = "GET",
  body?: object
): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message ?? `GitHub API error: ${res.status} ${res.statusText}`
    );
  }
  return res.json();
}

export async function publishToGitHub(
  files: ProjectFiles,
  branchName: string,
  token: string
): Promise<PublishResult> {
  // 1. Get main branch SHA
  const mainRef = await ghFetch(
    `/repos/${REPO}/git/refs/heads/main`,
    token
  );
  const baseSha: string = mainRef.object.sha;

  // 2. Get base commit to get tree SHA
  const baseCommit = await ghFetch(
    `/repos/${REPO}/git/commits/${baseSha}`,
    token
  );
  const baseTreeSha: string = baseCommit.tree.sha;

  // 3. Create a tree with all project files
  const treeItems = Object.entries(files).map(([path, content]) => ({
    path,
    mode: "100644",
    type: "blob",
    content,
  }));

  const newTree = await ghFetch(`/repos/${REPO}/git/trees`, token, "POST", {
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  // 4. Create a commit
  const newCommit = await ghFetch(`/repos/${REPO}/git/commits`, token, "POST", {
    message: `scaffold: ${branchName}`,
    tree: newTree.sha,
    parents: [baseSha],
  });

  // 5. Create the branch pointing at the new commit
  await ghFetch(`/repos/${REPO}/git/refs`, token, "POST", {
    ref: `refs/heads/${branchName}`,
    sha: newCommit.sha,
  });

  return {
    branchName,
    branchUrl: `https://github.com/${REPO}/tree/${branchName}`,
  };
}
