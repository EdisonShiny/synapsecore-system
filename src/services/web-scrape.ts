import { createId } from "@/src/utils/id";
import { nowIso } from "@/src/utils/date";
import type { WebLinkCheckResult, WebLinkReference } from "@/types/system";

const scraperUserAgent = "SynapseCoreBot/1.0 (+https://synapsecore.local)";
const maxScrapedCharacters = 4_500;

type RobotsRule = {
  pattern: string;
  allow: boolean;
};

type RobotsGroup = {
  agents: string[];
  rules: RobotsRule[];
};

function sanitizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCharCode(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
}

function stripHtmlToText(html: string) {
  const withoutScripts = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ");

  const text = withoutScripts
    .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return sanitizeWhitespace(decodeHtmlEntities(text));
}

function extractHtmlTitle(html: string) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? sanitizeWhitespace(decodeHtmlEntities(match[1])) : "";
}

function normalizeLinkUrl(input: string) {
  let next = input.trim();

  if (!/^https?:\/\//i.test(next)) {
    next = `https://${next}`;
  }

  const url = new URL(next);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https links are supported.");
  }

  url.hash = "";
  return url.toString();
}

function parseRobotsTxt(robotsText: string) {
  const groups: RobotsGroup[] = [];
  let currentGroup: RobotsGroup | null = null;

  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();

    if (!line) {
      currentGroup = null;
      continue;
    }

    const separatorIndex = line.indexOf(":");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (key === "user-agent") {
      if (!currentGroup || currentGroup.rules.length > 0) {
        currentGroup = { agents: [], rules: [] };
        groups.push(currentGroup);
      }

      currentGroup.agents.push(value.toLowerCase());
      continue;
    }

    if ((key === "allow" || key === "disallow") && currentGroup) {
      currentGroup.rules.push({
        pattern: value,
        allow: key === "allow"
      });
    }
  }

  return groups;
}

function patternMatchesPath(pattern: string, path: string) {
  if (!pattern) {
    return false;
  }

  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  const regex = new RegExp(`^${escaped}`);
  return regex.test(path);
}

function isPathAllowedByRobots(groups: RobotsGroup[], url: URL) {
  if (groups.length === 0) {
    return true;
  }

  const path = `${url.pathname}${url.search}`;
  const agent = scraperUserAgent.toLowerCase();
  const relevantGroups = groups.filter((group) =>
    group.agents.some((entry) => entry === "*" || agent.includes(entry))
  );

  if (relevantGroups.length === 0) {
    return true;
  }

  let winningRule: RobotsRule | null = null;

  for (const group of relevantGroups) {
    for (const rule of group.rules) {
      if (!patternMatchesPath(rule.pattern, path)) {
        continue;
      }

      if (!winningRule || rule.pattern.length > winningRule.pattern.length) {
        winningRule = rule;
        continue;
      }

      if (
        winningRule &&
        rule.pattern.length === winningRule.pattern.length &&
        rule.allow &&
        !winningRule.allow
      ) {
        winningRule = rule;
      }
    }
  }

  return winningRule ? winningRule.allow : true;
}

async function fetchRobotsDecision(url: URL) {
  const robotsUrl = new URL("/robots.txt", url.origin);

  try {
    const response = await fetch(robotsUrl.toString(), {
      headers: { "User-Agent": scraperUserAgent },
      redirect: "follow",
      cache: "no-store"
    });

    if (response.status === 404) {
      return {
        allowed: true,
        detail: "No robots.txt was found, so scraping is allowed."
      };
    }

    if (!response.ok) {
      return {
        allowed: false,
        detail: `Unable to verify robots.txt (${response.status}).`
      };
    }

    const robotsText = await response.text();
    const allowed = isPathAllowedByRobots(parseRobotsTxt(robotsText), url);

    return {
      allowed,
      detail: allowed
        ? "The site allows scraping for this page according to robots.txt."
        : "The site blocks scraping for this page according to robots.txt."
    };
  } catch (error) {
    return {
      allowed: false,
      detail:
        error instanceof Error
          ? `Unable to verify robots.txt: ${error.message}`
          : "Unable to verify robots.txt."
    };
  }
}

async function fetchScrapedPage(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": scraperUserAgent,
      Accept: "text/html, text/plain, application/json, application/xml;q=0.9, */*;q=0.1"
    },
    redirect: "follow",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`The page returned ${response.status}.`);
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (
    !contentType.includes("text/html") &&
    !contentType.includes("text/plain") &&
    !contentType.includes("application/json") &&
    !contentType.includes("application/xml") &&
    !contentType.includes("text/xml")
  ) {
    throw new Error(`Unsupported content type for scraping: ${contentType || "unknown"}.`);
  }

  const raw = await response.text();
  const title = contentType.includes("text/html") ? extractHtmlTitle(raw) : "";
  const text = contentType.includes("text/html") ? stripHtmlToText(raw) : sanitizeWhitespace(raw);

  if (!text) {
    throw new Error("The page did not return readable text content.");
  }

  return {
    title,
    text: text.slice(0, maxScrapedCharacters)
  };
}

export async function checkWebLink(urlInput: string): Promise<WebLinkCheckResult> {
  const checkedAt = nowIso();

  try {
    const normalizedUrl = normalizeLinkUrl(urlInput);
    const url = new URL(normalizedUrl);
    const robots = await fetchRobotsDecision(url);

    if (!robots.allowed) {
      return {
        id: createId(),
        url: urlInput.trim(),
        normalizedUrl,
        title: url.hostname,
        status: "blocked",
        detail: robots.detail,
        checkedAt
      };
    }

    const page = await fetchScrapedPage(normalizedUrl);

    return {
      id: createId(),
      url: urlInput.trim(),
      normalizedUrl,
      title: page.title || url.hostname,
      status: "allowed",
      detail: robots.detail,
      checkedAt
    };
  } catch (error) {
    return {
      id: createId(),
      url: urlInput.trim(),
      normalizedUrl: urlInput.trim(),
      title: urlInput.trim(),
      status: "error",
      detail: error instanceof Error ? error.message : "Unable to check this link.",
      checkedAt
    };
  }
}

export async function scrapeCheckedWebLinks(links: WebLinkCheckResult[]): Promise<WebLinkReference[]> {
  const nextLinks: WebLinkReference[] = [];

  for (const link of links) {
    if (link.status !== "allowed") {
      throw new Error(`Link ${link.url} is not allowed for scraping. Remove it before submitting.`);
    }

    const normalizedUrl = normalizeLinkUrl(link.normalizedUrl || link.url);
    const url = new URL(normalizedUrl);
    const robots = await fetchRobotsDecision(url);

    if (!robots.allowed) {
      throw new Error(`Link ${normalizedUrl} is blocked by robots.txt.`);
    }

    const page = await fetchScrapedPage(normalizedUrl);

    nextLinks.push({
      id: link.id || createId(),
      url: link.url,
      normalizedUrl,
      title: page.title || link.title || url.hostname,
      detail: robots.detail,
      checkedAt: nowIso(),
      scrapedContent: page.text
    });
  }

  return nextLinks;
}
