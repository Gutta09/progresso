"""Thin synchronous wrapper over the GitHub REST API using httpx.

All calls are made server-side so the PAT never reaches the browser. GitHub
error responses are translated into HTTPExceptions with a useful detail.
"""
import httpx
from fastapi import HTTPException

API_BASE = "https://api.github.com"
_HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}
_TIMEOUT = 15.0


class GitHubClient:
    def __init__(self, token: str, repo: str):
        # repo is "owner/name"
        self.repo = repo.strip().strip("/")
        self._headers = {**_HEADERS, "Authorization": f"Bearer {token}"}

    def _request(self, method: str, path: str, **kwargs):
        url = f"{API_BASE}{path}"
        try:
            with httpx.Client(timeout=_TIMEOUT) as client:
                resp = client.request(method, url, headers=self._headers, **kwargs)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Could not reach GitHub: {exc}")

        if resp.status_code == 401:
            raise HTTPException(status_code=400, detail="GitHub rejected the token (unauthorized)")
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="GitHub denied access (token scope or rate limit)")
        if resp.status_code == 404:
            raise HTTPException(status_code=404, detail=f"GitHub resource not found: {path}")
        if resp.status_code >= 400:
            detail = resp.json().get("message", resp.text) if resp.content else resp.text
            raise HTTPException(status_code=502, detail=f"GitHub error: {detail}")
        return resp

    # ── Repo ────────────────────────────────────────
    def get_repo(self) -> dict:
        r = self._request("GET", f"/repos/{self.repo}")
        d = r.json()
        return {
            "full_name": d.get("full_name"),
            "html_url": d.get("html_url"),
            "description": d.get("description"),
            "private": d.get("private"),
            "default_branch": d.get("default_branch"),
            "stargazers_count": d.get("stargazers_count"),
            "open_issues_count": d.get("open_issues_count"),
        }

    # ── Commits ─────────────────────────────────────
    def list_commits(self, limit: int = 20) -> list:
        r = self._request("GET", f"/repos/{self.repo}/commits", params={"per_page": limit})
        out = []
        for c in r.json():
            commit = c.get("commit", {})
            author = commit.get("author", {}) or {}
            out.append({
                "sha": c.get("sha", "")[:7],
                "message": (commit.get("message") or "").split("\n")[0],
                "author": author.get("name"),
                "date": author.get("date"),
                "html_url": c.get("html_url"),
            })
        return out

    # ── Issues ──────────────────────────────────────
    def list_issues(self, state: str = "open", limit: int = 50) -> list:
        r = self._request(
            "GET", f"/repos/{self.repo}/issues",
            params={"state": state, "per_page": limit},
        )
        out = []
        for i in r.json():
            if "pull_request" in i:  # the issues endpoint also returns PRs
                continue
            out.append(_issue_summary(i))
        return out

    def get_issue(self, number: int) -> dict:
        r = self._request("GET", f"/repos/{self.repo}/issues/{number}")
        return _issue_summary(r.json())

    def create_issue(self, title: str, body: str = "") -> dict:
        r = self._request(
            "POST", f"/repos/{self.repo}/issues",
            json={"title": title, "body": body},
        )
        return _issue_summary(r.json())

    def set_issue_state(self, number: int, state: str) -> dict:
        # state is "open" or "closed"
        r = self._request(
            "PATCH", f"/repos/{self.repo}/issues/{number}",
            json={"state": state},
        )
        return _issue_summary(r.json())

    # ── Pull requests ───────────────────────────────
    def list_pulls(self, state: str = "open", limit: int = 30) -> list:
        r = self._request(
            "GET", f"/repos/{self.repo}/pulls",
            params={"state": state, "per_page": limit},
        )
        out = []
        for p in r.json():
            user = p.get("user", {}) or {}
            out.append({
                "number": p.get("number"),
                "title": p.get("title"),
                "state": p.get("state"),
                "user": user.get("login"),
                "html_url": p.get("html_url"),
                "created_at": p.get("created_at"),
                "draft": p.get("draft"),
            })
        return out


def _issue_summary(i: dict) -> dict:
    user = i.get("user", {}) or {}
    return {
        "number": i.get("number"),
        "title": i.get("title"),
        "state": i.get("state"),
        "user": user.get("login"),
        "html_url": i.get("html_url"),
        "created_at": i.get("created_at"),
        "labels": [l.get("name") for l in (i.get("labels") or [])],
    }
