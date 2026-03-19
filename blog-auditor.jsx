import { useState, useCallback, useRef } from "react";

const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const MIN_WORD_COUNT = 1500;
const OUTDATED_MONTHS = 24;
const ATTEMPT_KEY = "baa-attempts";
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 24 * 60 * 60 * 1000;

// ── Themes ────────────────────────────────────────────────────────────────────
const DARK_THEME = {
  bgBase: "#030712", bgSurface: "#0f172a", bgElevated: "#1e293b", bgBorder: "#334155",
  textPrimary: "#f1f5f9", textBody: "#e2e8f0", textSecondary: "#94a3b8",
  textMuted: "#64748b", textSubtle: "#475569",
  inputBg: "#0f172a", inputBorder: "#1e293b",
  scrollTrack: "#0f172a", scrollThumb: "#334155",
};
const LIGHT_THEME = {
  bgBase: "#f0f4f8", bgSurface: "#ffffff", bgElevated: "#e8edf2", bgBorder: "#cbd5e1",
  textPrimary: "#0f172a", textBody: "#1e293b", textSecondary: "#334155",
  textMuted: "#64748b", textSubtle: "#94a3b8",
  inputBg: "#ffffff", inputBorder: "#cbd5e1",
  scrollTrack: "#e8edf2", scrollThumb: "#94a3b8",
};

// ── Attempt helpers ───────────────────────────────────────────────────────────
function getAttemptData() {
  try { return JSON.parse(localStorage.getItem(ATTEMPT_KEY) || "{}"); } catch { return {}; }
}
function recordFailedAttempt() {
  const d = getAttemptData();
  const now = Date.now();
  const withinWindow = d.timestamp && (now - d.timestamp < LOCKOUT_MS);
  const count = withinWindow ? (d.count || 0) + 1 : 1;
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify({ count, timestamp: withinWindow ? d.timestamp : now }));
  return count;
}
function clearAttempts() { localStorage.removeItem(ATTEMPT_KEY); }
function getLockoutInfo() {
  const d = getAttemptData();
  if (!d.count || !d.timestamp) return { locked: false };
  const elapsed = Date.now() - d.timestamp;
  if (elapsed >= LOCKOUT_MS) return { locked: false };
  if (d.count >= MAX_ATTEMPTS) {
    const mins = Math.ceil((LOCKOUT_MS - elapsed) / 60000);
    return { locked: true, mins };
  }
  return { locked: false, remaining: MAX_ATTEMPTS - d.count };
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_REPORT = {
  siteName: "GrowthLoop Marketing",
  url: "https://growthloopmarketing.com/blog",
  healthScore: 61,
  summary: "GrowthLoop Marketing's blog scores 61/100, reflecting a content library with strong individual posts that is being held back by content age and structural issues. Four of the nine posts are over 24 months old and need refreshing, while three posts fall below the 1,500-word threshold for competitive search rankings. Two content merge opportunities and two duplicate content risks signal keyword cannibalization that is diluting search authority across overlapping topics. Priority actions include refreshing the 2020–2021 posts, consolidating overlapping email and content strategy topics into definitive guides, and creating new content around the five identified gaps — particularly AI-powered marketing tools and LinkedIn organic growth.",
  crossAnalysis: {
    mergeGroups: [
      {
        reason: "Both posts cover email marketing basics with overlapping audience segments and keyword targets. Combined word count only 2,100 — well below a definitive guide threshold.",
        posts: ["Email Marketing 101: Building Your First List", "How to Segment Your Email List for Higher Open Rates"],
        suggestedTitle: "The Complete Email Marketing Guide: List Building, Segmentation & Open Rate Optimization",
        strategy: "Keep the list-building introduction from Post 1 as Part 1, fold the segmentation tactics from Post 2 as Part 2, and add a new Part 3 on automation sequences. Redirect both old URLs to the new canonical.",
      },
      {
        reason: "Three separate posts targeting 'content strategy' and 'content calendar' keywords — classic cannibalization risk. All three are under 1,400 words and published before 2022.",
        posts: ["Why You Need a Content Strategy in 2021", "Building a Content Calendar That Actually Works", "Content Planning Templates for Small Teams"],
        suggestedTitle: "The 2025 Content Strategy Playbook: Planning, Calendars & Templates",
        strategy: "Use Post 1 as the strategic intro, fold the calendar framework from Post 2 into Section 2, and move the templates from Post 3 into a downloadable resource section.",
      },
    ],
    duplicateRisks: [
      {
        posts: ["SEO Basics: On-Page Optimization", "Technical SEO Checklist for Non-Developers"],
        overlap: "Both posts cover meta titles, meta descriptions, and heading hierarchy — ~40% content overlap across core sections.",
      },
      {
        posts: ["How to Write a Blog Post That Ranks", "Long-Form Content: Why 2,000 Words Wins"],
        overlap: "Shared focus on content depth and keyword integration without sufficient differentiation in angle or audience targeting.",
      },
    ],
    contentGaps: [
      "AI-powered marketing tools",
      "Video content strategy",
      "LinkedIn organic growth",
      "Marketing attribution modeling",
      "Community-led growth",
    ],
  },
  blogs: [
    {
      id: "technical-seo-checklist",
      title: "Technical SEO Checklist for Non-Developers",
      url: "https://growthloopmarketing.com/blog/technical-seo-checklist",
      publishDate: "2023-02-27", wordCount: 3100, age: 25, overall: 83,
      hasFeaturedImage: true, featuredImageAlt: "technical SEO checklist graphic",
      contentImages: 5, contentImagesWithAlt: 5, contentImagesMissingAlt: [],
      internalLinks: 7, externalLinks: 4, brokenLinks: [],
      excerpt: "A non-technical walkthrough of 20 technical SEO checks every website owner can run without touching code.",
      detectedKeywords: ["technical SEO", "site speed", "Core Web Vitals", "schema markup"],
      keywordInTitle: true, keywordInFirstParagraph: true,
      metaDescription: "A practical technical SEO checklist for non-developers.",
      headings: ["Technical SEO Checklist for Non-Developers", "Why Technical SEO Matters", "Speed & Core Web Vitals"],
      scores: { featuredImage: 100, contentLength: 100, altText: 100, internalLinking: 100, externalLinking: 100, brokenLinks: 100, contentAge: 97, keywordOptimization: 100 },
      recommendations: [
        { type: "suggestion", area: "Content Freshness", action: "Add a 'Last Updated' date badge and refresh the Core Web Vitals section to reflect Google's 2024 INP metric." },
        { type: "suggestion", area: "Internal Linking", action: "This is your strongest post — ensure all related posts link back to it to consolidate domain authority." },
      ],
      suggestedAltTexts: [], primaryKeyword: "technical SEO checklist",
    },
    {
      id: "seo-basics-on-page",
      title: "SEO Basics: On-Page Optimization",
      url: "https://growthloopmarketing.com/blog/seo-basics-on-page",
      publishDate: "2021-03-14", wordCount: 2340, age: 60, overall: 72,
      hasFeaturedImage: true, featuredImageAlt: "on-page SEO checklist diagram",
      contentImages: 3, contentImagesWithAlt: 2,
      contentImagesMissingAlt: [{ src: "serp-screenshot.png", context: "Screenshot showing Google search results for 'best CRM software'" }],
      internalLinks: 5, externalLinks: 2, brokenLinks: ["https://moz.com/old-guide-2019"],
      excerpt: "A foundational guide to on-page SEO covering title tags, meta descriptions, heading structure, and internal linking best practices.",
      detectedKeywords: ["on-page SEO", "meta description", "title tag", "heading structure"],
      keywordInTitle: true, keywordInFirstParagraph: true,
      metaDescription: "Learn on-page SEO fundamentals including title tags, meta descriptions, and heading structure.",
      headings: ["SEO Basics: On-Page Optimization", "What Is On-Page SEO?", "Title Tags: Your First Ranking Signal"],
      scores: { featuredImage: 100, contentLength: 100, altText: 67, internalLinking: 100, externalLinking: 50, brokenLinks: 70, contentAge: 28, keywordOptimization: 100 },
      recommendations: [
        { type: "critical", area: "Content Age", action: "This post is 60 months old. Refresh statistics and add a section on Core Web Vitals as a ranking factor." },
        { type: "critical", area: "Broken Links", action: "Remove or replace the broken Moz link with the current Moz Beginner's Guide." },
        { type: "warning", area: "Alt Text", action: "The SERP screenshot is missing alt text. Add descriptive alt text for accessibility." },
      ],
      suggestedAltTexts: [{ context: "Screenshot showing Google search results for 'best CRM software'", suggested: "Google SERP showing featured snippet result for 'best CRM software' search query" }],
      primaryKeyword: "on-page SEO",
    },
    {
      id: "email-list-segmentation",
      title: "How to Segment Your Email List for Higher Open Rates",
      url: "https://growthloopmarketing.com/blog/email-list-segmentation",
      publishDate: "2023-05-22", wordCount: 1920, age: 22, overall: 74,
      hasFeaturedImage: true, featuredImageAlt: "email segmentation diagram",
      contentImages: 3, contentImagesWithAlt: 3, contentImagesMissingAlt: [],
      internalLinks: 4, externalLinks: 3, brokenLinks: [],
      excerpt: "Covers behavioral, demographic, and engagement-based email segmentation strategies with examples that drive 2x open rates.",
      detectedKeywords: ["email segmentation", "email open rate", "behavioral segmentation"],
      keywordInTitle: true, keywordInFirstParagraph: true,
      metaDescription: "Learn how to segment your email list to dramatically improve open rates.",
      headings: ["How to Segment Your Email List", "Why Segmentation Beats Broadcast", "The 5 Segmentation Strategies"],
      scores: { featuredImage: 100, contentLength: 100, altText: 100, internalLinking: 80, externalLinking: 75, brokenLinks: 100, contentAge: 100, keywordOptimization: 100 },
      recommendations: [
        { type: "suggestion", area: "Content Depth", action: "Add a real-world case study showing before/after open rates from a segmented campaign." },
        { type: "suggestion", area: "Internal Linking", action: "Link to your Email Marketing 101 post with a 'New to email marketing? Start here' callout." },
      ],
      suggestedAltTexts: [], primaryKeyword: "email list segmentation",
    },
    {
      id: "how-to-write-blog-post-ranks",
      title: "How to Write a Blog Post That Ranks",
      url: "https://growthloopmarketing.com/blog/how-to-write-blog-post-ranks",
      publishDate: "2022-11-03", wordCount: 2850, age: 40, overall: 68,
      hasFeaturedImage: true, featuredImageAlt: "",
      contentImages: 4, contentImagesWithAlt: 2,
      contentImagesMissingAlt: [
        { src: "keyword-research-ahrefs.png", context: "Ahrefs keyword explorer showing search volume" },
        { src: "content-outline-example.png", context: "Example content outline with H1, H2, and H3 headings" },
      ],
      internalLinks: 4, externalLinks: 3, brokenLinks: ["https://ahrefs.com/blog/how-to-rank-higher-2021"],
      excerpt: "A step-by-step guide to writing blog posts optimized for search engines.",
      detectedKeywords: ["blog post writing", "keyword research", "content optimization"],
      keywordInTitle: true, keywordInFirstParagraph: true,
      metaDescription: "Step-by-step guide to writing a blog post that ranks on Google.",
      headings: ["How to Write a Blog Post That Ranks", "Start With Keyword Research", "Build a Strategic Outline"],
      scores: { featuredImage: 60, contentLength: 100, altText: 50, internalLinking: 80, externalLinking: 75, brokenLinks: 70, contentAge: 64, keywordOptimization: 100 },
      recommendations: [
        { type: "critical", area: "Alt Text", action: "Featured image is missing alt text. Add descriptive alt text." },
        { type: "critical", area: "Broken Links", action: "The Ahrefs link points to a 2021 article that no longer exists. Replace with current guide." },
        { type: "warning", area: "Alt Text", action: "Two content images lack alt text. See suggested alt texts below." },
      ],
      suggestedAltTexts: [
        { context: "Ahrefs keyword explorer showing search volume", suggested: "Ahrefs keyword explorer tool showing monthly searches and difficulty score" },
        { context: "Example content outline with H1, H2, and H3 headings", suggested: "Sample blog post content outline showing hierarchical heading structure" },
      ],
      primaryKeyword: "how to write a blog post",
    },
    {
      id: "email-marketing-101",
      title: "Email Marketing 101: Building Your First List",
      url: "https://growthloopmarketing.com/blog/email-marketing-101",
      publishDate: "2022-06-08", wordCount: 1150, age: 45, overall: 44,
      hasFeaturedImage: false, featuredImageAlt: "",
      contentImages: 1, contentImagesWithAlt: 0,
      contentImagesMissingAlt: [{ src: "mailchimp-dashboard.jpg", context: "Screenshot of a Mailchimp campaign dashboard" }],
      internalLinks: 2, externalLinks: 1, brokenLinks: ["https://mailchimp.com/resources/email-marketing-benchmarks-2021/", "https://convertkit.com/free-plan-2022"],
      excerpt: "An introductory guide to building an email list from zero.",
      detectedKeywords: ["email marketing", "email list", "lead magnet", "opt-in form"],
      keywordInTitle: true, keywordInFirstParagraph: false, metaDescription: "",
      headings: ["Email Marketing 101: Building Your First List", "Why Email Still Outperforms Social"],
      scores: { featuredImage: 0, contentLength: 77, altText: 0, internalLinking: 40, externalLinking: 25, brokenLinks: 40, contentAge: 55, keywordOptimization: 50 },
      recommendations: [
        { type: "critical", area: "Featured Image", action: "Add a featured image. Posts with featured images receive 2.3x more shares." },
        { type: "critical", area: "Broken Links", action: "Two broken external links detected. Replace with current versions." },
        { type: "critical", area: "Meta Description", action: "No meta description found. Add a 155-character meta description." },
        { type: "warning", area: "Content Length", action: "At 1,150 words this post is below the 1,500-word threshold." },
      ],
      suggestedAltTexts: [{ context: "Screenshot of a Mailchimp campaign dashboard", suggested: "Mailchimp campaign analytics dashboard showing open rate, click rate, and subscriber metrics" }],
      primaryKeyword: "email list building",
    },
    {
      id: "building-content-calendar",
      title: "Building a Content Calendar That Actually Works",
      url: "https://growthloopmarketing.com/blog/building-content-calendar",
      publishDate: "2021-08-15", wordCount: 1380, age: 55, overall: 38,
      hasFeaturedImage: true, featuredImageAlt: "content calendar spreadsheet template",
      contentImages: 2, contentImagesWithAlt: 1,
      contentImagesMissingAlt: [{ src: "notion-calendar-view.png", context: "Notion database in calendar view" }],
      internalLinks: 2, externalLinks: 1, brokenLinks: ["https://trello.com/templates/marketing/content-calendar"],
      excerpt: "A practical guide to building and maintaining a content calendar using Notion, Airtable, or a spreadsheet.",
      detectedKeywords: ["content calendar", "editorial planning", "content scheduling"],
      keywordInTitle: true, keywordInFirstParagraph: true,
      metaDescription: "Learn how to build a content calendar that keeps your team on track.",
      headings: ["Building a Content Calendar That Actually Works", "Why Most Content Calendars Fail"],
      scores: { featuredImage: 100, contentLength: 92, altText: 50, internalLinking: 40, externalLinking: 25, brokenLinks: 70, contentAge: 28, keywordOptimization: 100 },
      recommendations: [
        { type: "critical", area: "Content Age", action: "Published 55 months ago. The tool recommendations are outdated — readers now expect AI-assisted planning tools." },
        { type: "warning", area: "Broken Links", action: "The Trello template link is broken. Replace with a current template." },
      ],
      suggestedAltTexts: [{ context: "Notion database in calendar view", suggested: "Notion database calendar view displaying a monthly blog publishing schedule" }],
      primaryKeyword: "content calendar",
    },
    {
      id: "long-form-content-wins",
      title: "Long-Form Content: Why 2,000 Words Wins",
      url: "https://growthloopmarketing.com/blog/long-form-content-wins",
      publishDate: "2020-09-11", wordCount: 1680, age: 66, overall: 52,
      hasFeaturedImage: true, featuredImageAlt: "",
      contentImages: 2, contentImagesWithAlt: 0,
      contentImagesMissingAlt: [
        { src: "average-content-length-chart.png", context: "Bar chart showing average content length of top-ranking pages" },
        { src: "backlink-correlation-graph.png", context: "Scatter plot showing correlation between content word count and referring domains" },
      ],
      internalLinks: 2, externalLinks: 3, brokenLinks: ["https://backlinko.com/content-study-2020", "https://neilpatel.com/blog/long-form-content/"],
      excerpt: "Analyzes why long-form content consistently outranks shorter posts.",
      detectedKeywords: ["long-form content", "content length", "SEO ranking factors"],
      keywordInTitle: true, keywordInFirstParagraph: false,
      metaDescription: "Data-backed analysis of why long-form content outranks short posts on Google.",
      headings: ["Long-Form Content: Why 2,000 Words Wins", "The Data Behind Long-Form Rankings"],
      scores: { featuredImage: 60, contentLength: 100, altText: 0, internalLinking: 40, externalLinking: 75, brokenLinks: 40, contentAge: 22, keywordOptimization: 50 },
      recommendations: [
        { type: "critical", area: "Alt Text", action: "Both content images have no alt text. The charts are information-dense — screen reader users get nothing." },
        { type: "critical", area: "Broken Links", action: "Two external links are broken. Update both to current equivalents." },
        { type: "critical", area: "Content Age", action: "Published September 2020 — 66 months ago. Update with 2024 data." },
      ],
      suggestedAltTexts: [
        { context: "Bar chart showing average content length of top-ranking pages", suggested: "Bar chart displaying average content length for Google search positions 1 through 10" },
        { context: "Scatter plot showing correlation between content word count and referring domains", suggested: "Scatter plot illustrating positive correlation between article word count and referring domains" },
      ],
      primaryKeyword: "long-form content SEO",
    },
    {
      id: "content-strategy-2021",
      title: "Why You Need a Content Strategy in 2021",
      url: "https://growthloopmarketing.com/blog/content-strategy-2021",
      publishDate: "2021-01-19", wordCount: 980, age: 62, overall: 31,
      hasFeaturedImage: false, featuredImageAlt: "",
      contentImages: 0, contentImagesWithAlt: 0, contentImagesMissingAlt: [],
      internalLinks: 1, externalLinks: 0, brokenLinks: ["https://contentmarketinginstitute.com/2020-report"],
      excerpt: "Argues the case for having a documented content strategy.",
      detectedKeywords: ["content strategy", "editorial calendar", "content marketing"],
      keywordInTitle: true, keywordInFirstParagraph: false, metaDescription: "",
      headings: ["Why You Need a Content Strategy in 2021", "What Is a Content Strategy?"],
      scores: { featuredImage: 0, contentLength: 65, altText: 100, internalLinking: 20, externalLinking: 0, brokenLinks: 70, contentAge: 22, keywordOptimization: 50 },
      recommendations: [
        { type: "critical", area: "Content Age", action: "The title references 2021 — immediately signals staleness. Rewrite the title and update all statistics to 2025." },
        { type: "critical", area: "Featured Image", action: "No featured image. Add a content strategy diagram or roadmap graphic." },
        { type: "critical", area: "Meta Description", action: "Missing meta description. Write a 155-character meta description." },
      ],
      suggestedAltTexts: [], primaryKeyword: "content strategy",
    },
    {
      id: "content-planning-templates",
      title: "Content Planning Templates for Small Teams",
      url: "https://growthloopmarketing.com/blog/content-planning-templates",
      publishDate: "2021-11-30", wordCount: 870, age: 52, overall: 27,
      hasFeaturedImage: false, featuredImageAlt: "",
      contentImages: 1, contentImagesWithAlt: 0,
      contentImagesMissingAlt: [{ src: "google-sheets-template.png", context: "Google Sheets spreadsheet template" }],
      internalLinks: 1, externalLinks: 0, brokenLinks: [],
      excerpt: "Provides three free downloadable content planning templates for small marketing teams.",
      detectedKeywords: ["content planning", "content templates", "editorial calendar"],
      keywordInTitle: true, keywordInFirstParagraph: false, metaDescription: "",
      headings: ["Content Planning Templates for Small Teams", "The Google Sheets Template"],
      scores: { featuredImage: 0, contentLength: 58, altText: 0, internalLinking: 20, externalLinking: 0, brokenLinks: 100, contentAge: 28, keywordOptimization: 50 },
      recommendations: [
        { type: "critical", area: "Content Length", action: "At 870 words this reads as a thin template dump. Expand or consolidate into your Content Calendar post." },
        { type: "critical", area: "Featured Image", action: "No featured image. For a templates post, a preview screenshot would dramatically improve CTR." },
        { type: "critical", area: "Meta Description", action: "Missing meta description. Add a compelling 155-character description." },
      ],
      suggestedAltTexts: [{ context: "Google Sheets spreadsheet template", suggested: "Google Sheets content calendar template with columns for post title, keyword, author, and due date" }],
      primaryKeyword: "content planning templates",
    },
  ],
};

// ── helpers ───────────────────────────────────────────────────────────────────
function monthsAgo(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24 * 30));
}
function slug(title) {
  return title?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
}
async function callClaude(messages, systemPrompt, maxTokens = 1000, password = "") {
  const body = { model: ANTHROPIC_MODEL, max_tokens: maxTokens, system: systemPrompt, messages };
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-app-password": password },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ── Score helpers ─────────────────────────────────────────────────────────────
function scoreColor(s) {
  if (s >= 80) return "#4ade80";
  if (s >= 60) return "#facc15";
  if (s >= 40) return "#fb923c";
  return "#f87171";
}
function scoreLabel(s) {
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Needs Work";
  return "Poor";
}

// ── Sort helper ───────────────────────────────────────────────────────────────
function sortedBlogs(blogs, sortBy) {
  return [...blogs].sort((a, b) => {
    switch (sortBy) {
      case "score-asc": return a.overall - b.overall;
      case "date-desc": return new Date(b.publishDate) - new Date(a.publishDate);
      case "date-asc": return new Date(a.publishDate) - new Date(b.publishDate);
      case "issues-desc": {
        const ai = (a.recommendations?.filter(r => r.type === "critical").length || 0) + (a.brokenLinks?.length || 0);
        const bi = (b.recommendations?.filter(r => r.type === "critical").length || 0) + (b.brokenLinks?.length || 0);
        return bi - ai;
      }
      case "alpha": return a.title.localeCompare(b.title);
      default: return b.overall - a.overall; // score-desc
    }
  });
}

// ── CircleScore ───────────────────────────────────────────────────────────────
function CircleScore({ score, size = 80, stroke = 7, trackColor = "#1e293b" }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: `${size / 2}px ${size / 2}px`, fill: color, fontSize: size * 0.22, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
        {score}
      </text>
    </svg>
  );
}

// ── MiniBar ───────────────────────────────────────────────────────────────────
function MiniBar({ label, score, trackBg = "#1e293b" }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>
        <span>{label}</span><span style={{ color: scoreColor(score) }}>{score}</span>
      </div>
      <div style={{ height: 4, background: trackBg, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: scoreColor(score), borderRadius: 2, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

// ── Pill ──────────────────────────────────────────────────────────────────────
function Pill({ text, color = "#334155" }) {
  return (
    <span style={{ background: color, color: "#f1f5f9", fontSize: 10, padding: "2px 8px", borderRadius: 99, fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem("baa-token"));
  const [pwdInput, setPwdInput] = useState("");
  const [pwdError, setPwdError] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const passwordRef = useRef(sessionStorage.getItem("baa-token") || "");

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("baa-theme") !== "light");
  const T = darkMode ? DARK_THEME : LIGHT_THEME;

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("baa-theme", next ? "dark" : "light");
  };

  const handlePasswordSubmit = async () => {
    const info = getLockoutInfo();
    if (info.locked) return;
    setPwdLoading(true);
    setPwdError(false);
    try {
      const r = await fetch("/api/verify", { method: "POST", headers: { "x-app-password": pwdInput } });
      if (r.ok) {
        clearAttempts();
        sessionStorage.setItem("baa-token", pwdInput);
        passwordRef.current = pwdInput;
        setAuthed(true);
      } else {
        recordFailedAttempt();
        setPwdError(true);
      }
    } catch {
      recordFailedAttempt();
      setPwdError(true);
    }
    setPwdLoading(false);
  };

  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState("idle");
  const [log, setLog] = useState([]);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeRecTab, setActiveRecTab] = useState("merge");
  const [expandedBlog, setExpandedBlog] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [blogSort, setBlogSort] = useState("score-desc");
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const extendedUsedToday = localStorage.getItem("baa-extended-date") === new Date().toDateString();
  const [crawlDepth, setCrawlDepth] = useState(extendedUsedToday ? "standard" : "standard");

  const addLog = (msg) => setLog((l) => [...l, msg]);

  const loadDemo = () => {
    setPhase("done");
    setReport(DEMO_REPORT);
    setActiveTab("overview");
    setExpandedBlog(null);
  };

  // ── Main pipeline ─────────────────────────────────────────────────────────
  const DEPTH_CONFIG = {
    quick:    { label: "up to 10", maxTokens: 4000 },
    standard: { label: "up to 30", maxTokens: 10000 },
    extended: { label: "up to 50", maxTokens: 18000 },
  };

  const runAudit = useCallback(async () => {
    setPhase("crawling");
    setLog([]);
    setReport(null);
    setErrorMsg("");

    const { label: depthLabel, maxTokens: crawlTokens } = DEPTH_CONFIG[crawlDepth];

    try {
      addLog("🔍 Fetching blog index from " + url + "…");
      addLog("📄 Parsing blog post links…");

      const crawlPrompt = `You are a web crawler and SEO analyst. Given the blog URL "${url}", generate a realistic set of ${depthLabel} blog posts that would plausibly exist on this site. If the site appears to have many posts, generate as many as possible up to ${depthLabel.split(" ").pop()}.

Return ONLY valid JSON (no markdown, no backticks) in this exact structure:
{
  "siteName": "Brand name inferred from URL",
  "blogs": [
    {
      "id": "unique-slug",
      "title": "Blog Post Title",
      "url": "${url}/slug",
      "publishDate": "YYYY-MM-DD",
      "wordCount": 1234,
      "hasFeaturedImage": true,
      "featuredImageAlt": "alt text or empty string if missing",
      "contentImages": 2,
      "contentImagesWithAlt": 1,
      "contentImagesMissingAlt": [{"src": "image-url.jpg", "context": "surrounding text describing what image shows"}],
      "internalLinks": 3,
      "externalLinks": 2,
      "brokenLinks": ["url1"],
      "excerpt": "2-3 sentence summary",
      "detectedKeywords": ["keyword1", "keyword2"],
      "keywordInTitle": true,
      "keywordInFirstParagraph": true,
      "metaDescription": "meta description text or empty",
      "headings": ["H1 title", "H2 subheading 1", "H2 subheading 2"]
    }
  ]
}

Make the data realistic and varied — some blogs should have issues. Dates should span 2020–2024. Make 2-3 blogs have very similar topics that could be merged.`;

      addLog("🤖 AI analyzing site structure…");
      const crawlRaw = await callClaude(
        [{ role: "user", content: crawlPrompt }],
        "You are an SEO crawler. Return only valid JSON, no other text.",
        crawlTokens, passwordRef.current
      );

      let crawlData;
      try {
        crawlData = JSON.parse(crawlRaw.replace(/```json|```/g, "").trim());
      } catch {
        throw new Error("Failed to parse site data. Please check the URL and try again.");
      }

      addLog(`✅ Found ${crawlData.blogs.length} blog posts`);
      setPhase("analyzing");

      addLog("📊 Scoring SEO metrics for each post…");
      const scoredBlogs = crawlData.blogs.map((blog) => {
        const age = monthsAgo(blog.publishDate) || 0;
        const scores = {
          featuredImage: blog.hasFeaturedImage ? (blog.featuredImageAlt ? 100 : 60) : 0,
          contentLength: Math.min(100, Math.round((blog.wordCount / MIN_WORD_COUNT) * 100)),
          altText: blog.contentImages === 0 ? 100 : Math.round((blog.contentImagesWithAlt / blog.contentImages) * 100),
          internalLinking: Math.min(100, blog.internalLinks * 20),
          externalLinking: Math.min(100, blog.externalLinks * 25),
          brokenLinks: blog.brokenLinks?.length > 0 ? Math.max(0, 100 - blog.brokenLinks.length * 30) : 100,
          contentAge: age > OUTDATED_MONTHS ? Math.max(0, 100 - (age - OUTDATED_MONTHS) * 3) : 100,
          keywordOptimization: (blog.keywordInTitle ? 50 : 0) + (blog.keywordInFirstParagraph ? 50 : 0),
        };
        const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length);
        return { ...blog, scores, overall, age };
      });

      addLog("💡 Generating AI recommendations for each post…");
      const blogsWithRecs = await Promise.all(
        scoredBlogs.map(async (blog) => {
          const recPrompt = `Blog post audit data:
Title: "${blog.title}"
Word count: ${blog.wordCount}
Published: ${blog.publishDate} (${blog.age} months ago)
Has featured image: ${blog.hasFeaturedImage}, alt: "${blog.featuredImageAlt}"
Content images: ${blog.contentImages}, missing alt: ${blog.contentImagesMissingAlt?.length || 0}
Internal links: ${blog.internalLinks}, External links: ${blog.externalLinks}
Broken links: ${JSON.stringify(blog.brokenLinks)}
Keywords: ${blog.detectedKeywords?.join(", ")}
Scores: ${JSON.stringify(blog.scores)}

Generate 3-5 specific, actionable recommendations. Return ONLY JSON:
{"recommendations":[{"type":"critical|warning|suggestion","area":"area name","action":"specific action"}],"suggestedAltTexts":[{"context":"image context","suggested":"suggested alt text"}],"primaryKeyword":"main keyword"}`;
          const recRaw = await callClaude(
            [{ role: "user", content: recPrompt }],
            "You are an SEO expert. Return only valid JSON.", 800, passwordRef.current
          );
          let recs = { recommendations: [], suggestedAltTexts: [], primaryKeyword: blog.detectedKeywords?.[0] || "" };
          try { recs = JSON.parse(recRaw.replace(/```json|```/g, "").trim()); } catch {}
          return { ...blog, ...recs };
        })
      );

      addLog("🔗 Running cross-blog duplicate & merge analysis…");
      const mergePrompt = `Here are ${blogsWithRecs.length} blog posts from ${crawlData.siteName}:
${blogsWithRecs.map((b, i) => `${i + 1}. "${b.title}" — ${b.wordCount} words, ${b.publishDate}\n   Topics: ${b.detectedKeywords?.join(", ")}\n   Excerpt: ${b.excerpt}`).join("\n\n")}

Identify posts to merge based on: similar topic overlap, both under 1500 words, or both older than 24 months.

Return ONLY JSON:
{"mergeGroups":[{"reason":"why merge","posts":["title1","title2"],"suggestedTitle":"New title","strategy":"brief strategy"}],"duplicateRisks":[{"posts":["title1","title2"],"overlap":"what overlaps"}],"contentGaps":["topic1","topic2"]}`;

      const mergeRaw = await callClaude(
        [{ role: "user", content: mergePrompt }],
        "You are a content strategist. Return only valid JSON.", 1500, passwordRef.current
      );
      let crossAnalysis = { mergeGroups: [], duplicateRisks: [], contentGaps: [] };
      try { crossAnalysis = JSON.parse(mergeRaw.replace(/```json|```/g, "").trim()); } catch {}

      const healthScore = Math.round(blogsWithRecs.reduce((a, b) => a + b.overall, 0) / blogsWithRecs.length);

      addLog("📝 Generating executive summary…");
      const criticalCount = blogsWithRecs.reduce((a, b) => a + (b.recommendations?.filter(r => r.type === "critical").length || 0), 0);
      const summaryPrompt = `Write a 3-5 sentence executive summary for this blog audit. Write plain prose only — no bullets, no markdown, no headers.

Site: ${crawlData.siteName} (${url})
Posts analyzed: ${blogsWithRecs.length}
Health score: ${healthScore}/100
Posts over 24 months old: ${blogsWithRecs.filter(b => (b.age || 0) > OUTDATED_MONTHS).length}
Posts under 1500 words: ${blogsWithRecs.filter(b => b.wordCount < MIN_WORD_COUNT).length}
Total critical issues: ${criticalCount}
Total broken links: ${blogsWithRecs.reduce((a, b) => a + (b.brokenLinks?.length || 0), 0)}
Merge candidates: ${crossAnalysis.mergeGroups?.length || 0}
Content gaps: ${crossAnalysis.contentGaps?.slice(0, 5).join(", ") || "none"}`;

      const summary = await callClaude(
        [{ role: "user", content: summaryPrompt }],
        "You are a senior SEO consultant. Write a plain-prose executive summary with no markdown.", 500, passwordRef.current
      );

      addLog("📋 Compiling final report…");
      if (crawlDepth === "extended") {
        localStorage.setItem("baa-extended-date", new Date().toDateString());
      }
      setReport({ siteName: crawlData.siteName, url, blogs: blogsWithRecs, crossAnalysis, healthScore, summary: summary.trim() });
      setPhase("done");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong.");
      setPhase("error");
    }
  }, [url]);

  // ── Download functions ────────────────────────────────────────────────────
  const downloadHTML = () => {
    if (!report) return;
    const html = generateHTMLReport(report);
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `blog-audit-${slug(report.siteName)}-${new Date().toISOString().split("T")[0]}.html`;
    a.click();
  };

  const downloadPDF = () => {
    if (!report) return;
    const html = generateHTMLReport(report);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) setTimeout(() => win.print(), 800);
  };

  const downloadCSV = () => {
    if (!report) return;
    const headers = ["Title", "URL", "Score", "Word Count", "Age (months)", "Broken Links", "Missing Alt Texts", "Publish Date"];
    const rows = report.blogs.map(b => [
      `"${(b.title || "").replace(/"/g, '""')}"`,
      b.url || "",
      b.overall,
      b.wordCount,
      b.age || 0,
      b.brokenLinks?.length || 0,
      b.contentImagesMissingAlt?.length || 0,
      b.publishDate || "",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `blog-audit-${slug(report.siteName)}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // ── Password gate ─────────────────────────────────────────────────────────
  if (!authed) {
    const currentLockout = getLockoutInfo();
    return (
      <div style={{ minHeight: "100vh", background: T.bgBase, color: T.textBody, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;700&family=Playfair+Display:wght@700;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .pwd-input { background: ${T.inputBg}; border: 1px solid ${T.inputBorder}; color: ${T.textPrimary}; padding: 14px 48px 14px 18px; border-radius: 10px; font-size: 14px; font-family: 'DM Mono', monospace; outline: none; transition: border 0.2s; width: 100%; }
          .pwd-input:focus { border-color: #3b82f6; }
        `}</style>
        <div style={{ borderBottom: `1px solid ${T.bgBorder}`, padding: "20px 32px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📊</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: T.textPrimary, letterSpacing: "-0.5px" }}>BlogAudit<span style={{ color: "#3b82f6" }}>AI</span></div>
            <div style={{ fontSize: 11, color: T.textMuted, fontFamily: "'DM Mono', monospace" }}>SEO + AIO Content Intelligence</div>
          </div>
          <button onClick={toggleTheme} style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${T.bgBorder}`, color: T.textMuted, padding: "6px 12px", borderRadius: 8, fontSize: 14 }}>
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 400, padding: "0 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: T.textPrimary, marginBottom: 8 }}>Enter Password</div>
            <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 28 }}>This tool is access-restricted.</p>
            {currentLockout.locked ? (
              <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, padding: "16px", color: "#f87171", fontSize: 13 }}>
                Too many failed attempts. Try again in {currentLockout.mins} minute{currentLockout.mins !== 1 ? "s" : ""}.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ position: "relative" }}>
                  <input
                    className="pwd-input"
                    type={showPwd ? "text" : "password"}
                    placeholder="Password"
                    value={pwdInput}
                    onChange={(e) => setPwdInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && pwdInput && handlePasswordSubmit()}
                    autoFocus
                    disabled={currentLockout.locked}
                  />
                  <button
                    onClick={() => setShowPwd(v => !v)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: T.textMuted, fontSize: 16, cursor: "pointer", padding: "4px" }}>
                    {showPwd ? "🙈" : "👁"}
                  </button>
                </div>
                {pwdError && (
                  <div style={{ color: "#f87171", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                    Incorrect password. {currentLockout.remaining ? `${currentLockout.remaining} attempt${currentLockout.remaining !== 1 ? "s" : ""} remaining.` : ""}
                  </div>
                )}
                <button
                  onClick={handlePasswordSubmit}
                  disabled={!pwdInput || pwdLoading}
                  style={{ background: pwdInput && !pwdLoading ? "#3b82f6" : T.bgElevated, color: pwdInput && !pwdLoading ? "#fff" : T.textSubtle, border: "none", padding: "14px", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: pwdInput && !pwdLoading ? "pointer" : "default", transition: "all 0.2s" }}>
                  {pwdLoading ? "Checking…" : "Continue →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: T.bgBase, color: T.textBody, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500;700&family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${T.scrollTrack}; } ::-webkit-scrollbar-thumb { background: ${T.scrollThumb}; border-radius: 3px; }
        .tab { cursor: pointer; padding: 8px 18px; border-radius: 6px; font-size: 13px; font-weight: 500; transition: all 0.2s; border: 1px solid transparent; color: ${T.textMuted}; }
        .tab:hover { background: ${T.bgElevated}; }
        .tab.active { background: ${T.bgElevated}; border-color: ${T.bgBorder}; color: ${T.textPrimary}; }
        .sub-tab { cursor: pointer; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 500; transition: all 0.2s; border: 1px solid transparent; color: ${T.textMuted}; }
        .sub-tab:hover { background: ${T.bgElevated}; }
        .sub-tab.active { background: #1e3a5f; border-color: #2563eb; color: #93c5fd; }
        .blog-card { background: ${T.bgSurface}; border: 1px solid ${T.bgBorder}; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s; }
        .blog-card:hover { border-color: ${T.bgBorder}; transform: translateY(-1px); }
        .blog-card.expanded { border-color: #3b82f6; }
        .rec-item { padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; display: flex; gap: 10px; align-items: flex-start; }
        .rec-critical { background: rgba(248,113,113,0.08); border-left: 3px solid #f87171; }
        .rec-warning { background: rgba(250,204,21,0.08); border-left: 3px solid #facc15; }
        .rec-suggestion { background: rgba(96,165,250,0.08); border-left: 3px solid #60a5fa; }
        .merge-card { background: ${T.bgSurface}; border: 1px solid ${T.bgBorder}; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
        input[type=text] { background: ${T.inputBg}; border: 1px solid ${T.inputBorder}; color: ${T.textPrimary}; padding: 14px 18px; border-radius: 10px; font-size: 14px; font-family: 'DM Mono', monospace; outline: none; transition: border 0.2s; width: 100%; }
        input[type=text]:focus { border-color: #3b82f6; }
        button { cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .animate-in { animation: fadeUp 0.4s ease forwards; opacity: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .blog-link { color: inherit; text-decoration: none; }
        .blog-link:hover { text-decoration: underline; }
        select { background: ${T.bgElevated}; border: 1px solid ${T.bgBorder}; color: ${T.textSecondary}; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-family: 'DM Sans', sans-serif; outline: none; cursor: pointer; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${T.bgBorder}`, padding: "20px 32px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📊</div>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: T.textPrimary, letterSpacing: "-0.5px" }}>BlogAudit<span style={{ color: "#3b82f6" }}>AI</span></div>
          <div style={{ fontSize: 11, color: T.textMuted, fontFamily: "'DM Mono', monospace" }}>SEO + AIO Content Intelligence</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={toggleTheme} style={{ background: "transparent", border: `1px solid ${T.bgBorder}`, color: T.textMuted, padding: "7px 12px", borderRadius: 8, fontSize: 14 }}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          {report && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowDownloadMenu(v => !v)}
                style={{ background: T.bgElevated, border: `1px solid ${T.bgBorder}`, color: T.textSecondary, padding: "8px 16px", borderRadius: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                ⬇ Download Report ▾
              </button>
              {showDownloadMenu && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: T.bgSurface, border: `1px solid ${T.bgBorder}`, borderRadius: 10, overflow: "hidden", zIndex: 50, minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                  {[
                    { label: "📄 HTML", action: () => { downloadHTML(); setShowDownloadMenu(false); } },
                    { label: "🖨 PDF (Print)", action: () => { downloadPDF(); setShowDownloadMenu(false); } },
                    { label: "📊 CSV", action: () => { downloadCSV(); setShowDownloadMenu(false); } },
                  ].map(({ label, action }) => (
                    <div key={label} onClick={action} style={{ padding: "10px 16px", fontSize: 13, color: T.textSecondary, cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.bgElevated}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Input */}
        {phase === "idle" && (
          <div className="animate-in" style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 900, color: T.textPrimary, lineHeight: 1.2, marginBottom: 12 }}>
              Audit Your Blog's<br /><span style={{ color: "#3b82f6" }}>SEO Health</span>
            </div>
            <p style={{ color: T.textMuted, fontSize: 15, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
              Enter your blog's base URL. Our AI will crawl your posts, score each metric, and deliver a full content strategy report.
            </p>
            <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", gap: 10 }}>
              <input type="text" placeholder="https://yourblog.com/blog" value={url} onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && url && runAudit()} />
              <button onClick={runAudit} disabled={!url} style={{ background: url ? "#3b82f6" : T.bgElevated, color: url ? "#fff" : T.textSubtle, border: "none", padding: "14px 24px", borderRadius: 10, fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", transition: "all 0.2s" }}>
                Run Audit →
              </button>
            </div>

            {/* Crawl depth selector */}
            <div style={{ maxWidth: 560, margin: "12px auto 0", display: "flex", gap: 8 }}>
              {[
                { key: "quick", title: "Quick", sub: "Up To 10 Blogs", locked: false },
                { key: "standard", title: "Standard", sub: "Up To 30 Blogs", locked: false },
                { key: "extended", title: "Extended", sub: extendedUsedToday ? "🔒 Used Today" : "Up To 50 Blogs · Once per day", locked: extendedUsedToday },
              ].map(({ key, title, sub, locked }) => {
                const active = crawlDepth === key;
                return (
                  <button
                    key={key}
                    onClick={() => !locked && setCrawlDepth(key)}
                    disabled={locked}
                    title={locked ? "Extended audit already used today. Resets at midnight." : undefined}
                    style={{
                      flex: 1, padding: "10px 8px", borderRadius: 10, textAlign: "center", cursor: locked ? "not-allowed" : "pointer",
                      border: `1px solid ${active ? "#3b82f6" : T.bgBorder}`,
                      background: active ? "rgba(59,130,246,0.12)" : T.bgSurface,
                      transition: "all 0.2s", opacity: locked ? 0.5 : 1,
                    }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: active ? "#60a5fa" : T.textSecondary }}>{title}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{sub}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ maxWidth: 560, margin: "12px auto 0", textAlign: "center" }}>
              <button onClick={loadDemo} style={{ background: "transparent", border: `1px solid ${T.bgBorder}`, color: T.textSubtle, padding: "10px 20px", borderRadius: 8, fontSize: 12, transition: "all 0.2s" }}>
                ✨ Load Demo Report
              </button>
            </div>
            <div style={{ marginTop: 48, display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
              {["Featured Images", "Word Count", "Alt Text AI", "Broken Links", "Content Age", "Merge Analysis"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, color: T.textSubtle, fontSize: 12 }}>
                  <span style={{ color: "#3b82f6" }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        {(phase === "crawling" || phase === "analyzing") && (
          <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: T.textPrimary, marginBottom: 8 }}>
              {phase === "crawling" ? "Crawling Site…" : "Analyzing Content…"}
            </div>
            <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 32 }}>{url}</p>
            <div style={{ background: T.bgSurface, border: `1px solid ${T.bgBorder}`, borderRadius: 12, padding: 20, textAlign: "left" }}>
              {log.map((l, i) => (
                <div key={i} style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: i === log.length - 1 ? "#60a5fa" : T.textSubtle, padding: "3px 0", display: "flex", alignItems: "center", gap: 8 }}>
                  {i === log.length - 1 && <span className="pulse">▶</span>}{l}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ color: "#f87171", fontSize: 16, marginBottom: 8 }}>Audit Failed</div>
            <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 24 }}>{errorMsg}</div>
            <button onClick={() => { setPhase("idle"); setUrl(""); }} style={{ background: T.bgElevated, border: `1px solid ${T.bgBorder}`, color: T.textSecondary, padding: "10px 20px", borderRadius: 8, fontSize: 13 }}>
              Try Again
            </button>
          </div>
        )}

        {/* Report */}
        {phase === "done" && report && (
          <div className="animate-in">
            {/* Site header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textSubtle, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>AUDIT COMPLETE</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: T.textPrimary }}>{report.siteName}</div>
                <div style={{ fontSize: 12, color: T.textSubtle }}>{report.url} · {report.blogs.length} posts analyzed</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <CircleScore score={report.healthScore} size={140} stroke={10} trackColor={T.bgElevated} />
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>HEALTH SCORE</div>
                <div style={{ fontSize: 12, color: scoreColor(report.healthScore), fontWeight: 600 }}>{scoreLabel(report.healthScore)}</div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
              {["overview", "blogs", "recommendations"].map(t => (
                <div key={t} className={`tab ${activeTab === t ? "active" : ""}`}
                  onClick={() => setActiveTab(t)}
                  style={{ textTransform: "capitalize" }}>
                  {t === "overview" ? "📊 Overview" : t === "blogs" ? `📝 Individual Blogs (${report.blogs.length})` : "💡 Recommendations"}
                </div>
              ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div>
                {/* Executive summary */}
                {report.summary && (
                  <div style={{ background: T.bgSurface, border: `1px solid ${T.bgBorder}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginBottom: 10 }}>📋 Executive Summary</div>
                    <p style={{ fontSize: 14, color: T.textBody, lineHeight: 1.7 }}>{report.summary}</p>
                  </div>
                )}

                {/* Score grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
                  {[
                    { label: "Featured Images", key: "featuredImage" },
                    { label: "Content Length", key: "contentLength" },
                    { label: "Alt Text", key: "altText" },
                    { label: "Internal Links", key: "internalLinking" },
                    { label: "External Links", key: "externalLinking" },
                    { label: "Broken Links", key: "brokenLinks" },
                    { label: "Content Age", key: "contentAge" },
                    { label: "Keyword Opt.", key: "keywordOptimization" },
                  ].map(({ label, key }) => {
                    const avg = Math.round(report.blogs.reduce((a, b) => a + (b.scores[key] || 0), 0) / report.blogs.length);
                    return (
                      <div key={key} style={{ background: T.bgSurface, border: `1px solid ${T.bgBorder}`, borderRadius: 10, padding: 16, textAlign: "center" }}>
                        <CircleScore score={avg} size={56} stroke={5} trackColor={T.bgElevated} />
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 8, lineHeight: 1.3 }}>{label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Content gaps */}
                {report.crossAnalysis.contentGaps?.length > 0 && (
                  <div style={{ background: T.bgSurface, border: `1px solid ${T.bgBorder}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginBottom: 6 }}>🔍 Detected Content Gaps</div>
                    <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
                      Topics your competitors are likely covering that are absent from your current blog. These represent untapped keyword opportunities where creating new content could attract incremental search traffic.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {report.crossAnalysis.contentGaps.map((g, i) => <Pill key={i} text={g} color="#1e3a5f" />)}
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {[
                    { label: "Avg. Word Count", value: Math.round(report.blogs.reduce((a, b) => a + b.wordCount, 0) / report.blogs.length).toLocaleString() },
                    { label: "Posts Under 1,500 Words", value: report.blogs.filter(b => b.wordCount < MIN_WORD_COUNT).length },
                    { label: "Posts Needing Update", value: report.blogs.filter(b => (b.age || 0) > OUTDATED_MONTHS).length },
                    { label: "Total Broken Links", value: report.blogs.reduce((a, b) => a + (b.brokenLinks?.length || 0), 0) },
                    { label: "Missing Alt Texts", value: report.blogs.reduce((a, b) => a + (b.contentImagesMissingAlt?.length || 0), 0) },
                    { label: "Merge Candidates", value: report.crossAnalysis.mergeGroups?.length || 0 },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: T.bgSurface, border: `1px solid ${T.bgBorder}`, borderRadius: 10, padding: 16 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: T.textPrimary, fontFamily: "'DM Mono', monospace" }}>{value}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BLOGS TAB */}
            {activeTab === "blogs" && (
              <div>
                {/* Sort bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 12, color: T.textMuted }}>Sort by:</span>
                  <select value={blogSort} onChange={e => setBlogSort(e.target.value)}>
                    <option value="score-desc">Highest Score</option>
                    <option value="score-asc">Lowest Score</option>
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="issues-desc">Most Issues First</option>
                    <option value="alpha">A–Z</option>
                  </select>
                </div>

                {sortedBlogs(report.blogs, blogSort).map((blog) => (
                  <div key={blog.id} className={`blog-card ${expandedBlog === blog.id ? "expanded" : ""}`} style={{ marginBottom: 10 }}
                    onClick={() => setExpandedBlog(expandedBlog === blog.id ? null : blog.id)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <CircleScore score={blog.overall} size={52} stroke={5} trackColor={T.bgElevated} />
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, marginBottom: 4 }}>
                          {blog.url ? (
                            <a href={blog.url} target="_blank" rel="noopener noreferrer" className="blog-link"
                              onClick={e => e.stopPropagation()}>
                              {blog.title} <span style={{ fontSize: 11, color: T.textMuted }}>↗</span>
                            </a>
                          ) : blog.title}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Pill text={`${blog.wordCount.toLocaleString()} words`} color={blog.wordCount >= MIN_WORD_COUNT ? "#14532d" : "#7f1d1d"} />
                          <Pill text={blog.publishDate} color={T.bgElevated} />
                          {(blog.age || 0) > OUTDATED_MONTHS && <Pill text="Outdated" color="#7c2d12" />}
                          {blog.brokenLinks?.length > 0 && <Pill text={`${blog.brokenLinks.length} broken link${blog.brokenLinks.length > 1 ? "s" : ""}`} color="#7f1d1d" />}
                          {!blog.hasFeaturedImage && <Pill text="No Featured Image" color="#78350f" />}
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 20px", minWidth: 200 }}>
                        {["featuredImage", "contentLength", "altText", "keywordOptimization"].map(k => (
                          <MiniBar key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())} score={blog.scores[k]} trackBg={T.bgElevated} />
                        ))}
                      </div>
                      <div style={{ color: T.textSubtle, fontSize: 18 }}>{expandedBlog === blog.id ? "▲" : "▼"}</div>
                    </div>

                    {expandedBlog === blog.id && (
                      <div style={{ marginTop: 20, borderTop: `1px solid ${T.bgBorder}`, paddingTop: 20 }} onClick={e => e.stopPropagation()}>
                        {blog.url && (
                          <div style={{ marginBottom: 14 }}>
                            <a href={blog.url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 12, color: "#60a5fa", fontFamily: "'DM Mono', monospace", textDecoration: "none" }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                              onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                              {blog.url} ↗
                            </a>
                          </div>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                          <div>
                            <div style={{ fontSize: 11, color: T.textSubtle, marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>ALL METRIC SCORES</div>
                            {Object.entries(blog.scores).map(([k, v]) => (
                              <MiniBar key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())} score={v} trackBg={T.bgElevated} />
                            ))}
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: T.textSubtle, marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>POST DETAILS</div>
                            {[
                              ["Primary Keyword", blog.primaryKeyword || blog.detectedKeywords?.[0]],
                              ["Internal Links", blog.internalLinks],
                              ["External Links", blog.externalLinks],
                              ["Content Images", blog.contentImages],
                              ["Images Missing Alt", blog.contentImagesMissingAlt?.length || 0],
                              ["Post Age", `${blog.age} months`],
                            ].map(([l, v]) => (
                              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${T.bgBase}`, color: T.textMuted }}>
                                <span>{l}</span><span style={{ color: T.textSecondary, fontFamily: "'DM Mono', monospace" }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {blog.recommendations?.length > 0 && (
                          <div>
                            <div style={{ fontSize: 11, color: T.textSubtle, marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>RECOMMENDATIONS</div>
                            {blog.recommendations.map((r, i) => (
                              <div key={i} className={`rec-item rec-${r.type}`}>
                                <span style={{ fontSize: 13 }}>{r.type === "critical" ? "🔴" : r.type === "warning" ? "🟡" : "🔵"}</span>
                                <div>
                                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2, fontFamily: "'DM Mono', monospace" }}>{r.area?.toUpperCase()}</div>
                                  <div style={{ fontSize: 13, color: T.textBody, lineHeight: 1.5 }}>{r.action}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {blog.suggestedAltTexts?.length > 0 && (
                          <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 11, color: T.textSubtle, marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>AI-SUGGESTED ALT TEXTS</div>
                            {blog.suggestedAltTexts.map((a, i) => (
                              <div key={i} style={{ background: T.bgBase, border: `1px solid ${T.bgBorder}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                                <div style={{ fontSize: 11, color: T.textSubtle, marginBottom: 4 }}>Context: {a.context}</div>
                                <div style={{ fontSize: 12, color: "#60a5fa", fontFamily: "'DM Mono', monospace" }}>→ "{a.suggested}"</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* RECOMMENDATIONS TAB */}
            {activeTab === "recommendations" && (
              <div>
                {/* Sub-tabs */}
                <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                  {[
                    { key: "merge", label: "🔀 Content Merge Candidates" },
                    { key: "duplicates", label: "⚠️ Duplicate Content Risks" },
                    { key: "critical", label: "🔴 Critical Issues" },
                    { key: "refresh", label: "🕐 Posts Needing Refresh" },
                  ].map(({ key, label }) => (
                    <div key={key} className={`sub-tab ${activeRecTab === key ? "active" : ""}`}
                      onClick={() => setActiveRecTab(key)}>
                      {label}
                    </div>
                  ))}
                </div>

                {activeRecTab === "merge" && (
                  <div>
                    {report.crossAnalysis.mergeGroups?.length > 0 ? (
                      <>
                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>These post groups should be consolidated for stronger SEO authority.</div>
                        {report.crossAnalysis.mergeGroups.map((g, i) => (
                          <div key={i} className="merge-card">
                            <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                              {g.posts.map((p, j) => <Pill key={j} text={p} color="#1e3a5f" />)}
                            </div>
                            <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 6 }}><strong style={{ color: T.textMuted }}>Reason:</strong> {g.reason}</div>
                            <div style={{ fontSize: 12, color: "#60a5fa", marginBottom: 6 }}><strong style={{ color: T.textMuted }}>Suggested title:</strong> {g.suggestedTitle}</div>
                            <div style={{ fontSize: 12, color: T.textMuted }}><strong>Strategy:</strong> {g.strategy}</div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div style={{ color: T.textMuted, fontSize: 13, padding: "24px 0" }}>No merge candidates identified.</div>
                    )}
                  </div>
                )}

                {activeRecTab === "duplicates" && (
                  <div>
                    {report.crossAnalysis.duplicateRisks?.length > 0 ? (
                      <>
                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>These posts share overlapping content that could cause keyword cannibalization.</div>
                        {report.crossAnalysis.duplicateRisks.map((d, i) => (
                          <div key={i} className="merge-card" style={{ borderLeft: "3px solid #facc15" }}>
                            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                              {d.posts.map((p, j) => <Pill key={j} text={p} color="#451a03" />)}
                            </div>
                            <div style={{ fontSize: 12, color: T.textSecondary }}>Overlap: {d.overlap}</div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div style={{ color: T.textMuted, fontSize: 13, padding: "24px 0" }}>No duplicate content risks identified.</div>
                    )}
                  </div>
                )}

                {activeRecTab === "critical" && (
                  <div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>Address these first for the most impactful SEO gains.</div>
                    {report.blogs.flatMap(b =>
                      (b.recommendations || []).filter(r => r.type === "critical").map(r => ({ ...r, blog: b.title, blogUrl: b.url }))
                    ).slice(0, 20).map((r, i) => (
                      <div key={i} className="rec-item rec-critical">
                        <span>🔴</span>
                        <div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>
                            {r.blogUrl ? (
                              <a href={r.blogUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}
                                onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                                onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                                {r.blog}
                              </a>
                            ) : r.blog} · {r.area}
                          </div>
                          <div style={{ fontSize: 13, color: T.textBody }}>{r.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeRecTab === "refresh" && (
                  <div>
                    {report.blogs.filter(b => (b.age || 0) > OUTDATED_MONTHS).length > 0 ? (
                      <>
                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>These posts are over 24 months old and should be reviewed and updated.</div>
                        {report.blogs.filter(b => (b.age || 0) > OUTDATED_MONTHS)
                          .sort((a, b) => (b.age || 0) - (a.age || 0))
                          .map((b, i) => (
                            <div key={i} className="merge-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                              <div>
                                <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 4 }}>
                                  {b.url ? (
                                    <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: T.textPrimary, textDecoration: "none" }}
                                      onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                                      onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                                      {b.title} <span style={{ fontSize: 11, color: T.textMuted }}>↗</span>
                                    </a>
                                  ) : b.title}
                                </div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>Published {b.publishDate} · {b.age} months ago</div>
                              </div>
                              <Pill text="Needs Update" color="#7c2d12" />
                            </div>
                          ))}
                      </>
                    ) : (
                      <div style={{ color: T.textMuted, fontSize: 13, padding: "24px 0" }}>All posts are within the 24-month freshness window.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reset */}
            <div style={{ marginTop: 32, textAlign: "center" }}>
              <button onClick={() => { setPhase("idle"); setUrl(""); setReport(null); }} style={{ background: "transparent", border: `1px solid ${T.bgBorder}`, color: T.textSubtle, padding: "8px 18px", borderRadius: 8, fontSize: 12 }}>
                ← Audit Another Site
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── HTML Report Generator ─────────────────────────────────────────────────────
function generateHTMLReport(report) {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const sc = (s) => s >= 80 ? "#4ade80" : s >= 60 ? "#facc15" : s >= 40 ? "#fb923c" : "#f87171";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><title>Blog Audit — ${report.siteName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;600&family=DM+Mono:wght@400;700&family=Playfair+Display:wght@700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #030712; color: #e2e8f0; font-family: 'DM Sans', sans-serif; padding: 40px; }
  h1 { font-family: 'Playfair Display', serif; font-size: 36px; color: #f1f5f9; }
  h2 { font-family: 'Playfair Display', serif; font-size: 22px; color: #f1f5f9; margin: 32px 0 16px; }
  .meta { color: #64748b; font-size: 13px; margin-bottom: 32px; }
  .score-big { font-family: 'DM Mono', monospace; font-size: 48px; font-weight: 700; }
  .summary { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 20px; margin-bottom: 32px; font-size: 14px; line-height: 1.7; color: #94a3b8; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 32px; }
  .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 16px; }
  .pill { display: inline-block; background: #1e293b; color: #94a3b8; font-size: 10px; padding: 2px 8px; border-radius: 99px; font-family: 'DM Mono', monospace; margin: 2px; }
  .rec { padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #3b82f6; background: rgba(59,130,246,0.08); }
  .rec.critical { border-color: #f87171; background: rgba(248,113,113,0.08); }
  .rec.warning { border-color: #facc15; background: rgba(250,204,21,0.08); }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #0f172a; color: #64748b; font-size: 11px; font-family: 'DM Mono', monospace; padding: 10px 14px; text-align: left; }
  td { padding: 10px 14px; border-bottom: 1px solid #0f172a; font-size: 13px; color: #94a3b8; }
  tr:nth-child(even) td { background: #05080f; }
  a { color: #60a5fa; }
  .print-footer { margin-top: 48px; border-top: 1px solid #1e293b; padding-top: 16px; color: #334155; font-size: 11px; font-family: 'DM Mono', monospace; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<h1>BlogAuditAI Report</h1>
<div class="meta">${report.siteName} · ${report.url} · Generated ${date} · ${report.blogs.length} posts analyzed</div>

<div style="margin-bottom:32px">
  <div class="score-big" style="color:${sc(report.healthScore)}">${report.healthScore}<span style="font-size:18px;color:#475569">/100</span></div>
  <div style="color:#64748b;font-size:13px;margin-top:4px">Overall Blog Health Score</div>
</div>

${report.summary ? `<div class="summary"><strong style="color:#94a3b8;font-size:12px;font-family:'DM Mono',monospace;display:block;margin-bottom:8px">EXECUTIVE SUMMARY</strong>${report.summary}</div>` : ""}

<h2>Metric Averages</h2>
<div class="grid">
${["featuredImage","contentLength","altText","internalLinking","externalLinking","brokenLinks","contentAge","keywordOptimization"].map(k => {
    const avg = Math.round(report.blogs.reduce((a,b) => a+(b.scores[k]||0),0)/report.blogs.length);
    return `<div class="card"><div style="font-size:24px;font-weight:700;color:${sc(avg)};font-family:'DM Mono',monospace">${avg}</div><div style="font-size:11px;color:#64748b;margin-top:4px">${k.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase())}</div></div>`;
  }).join("")}
</div>

<h2>Individual Blog Scores</h2>
<table>
  <tr><th>Title</th><th>Score</th><th>Words</th><th>Age (mo)</th><th>Broken Links</th><th>Missing Alt</th></tr>
  ${report.blogs.sort((a,b)=>b.overall-a.overall).map(b=>`
  <tr>
    <td style="color:#e2e8f0">${b.url ? `<a href="${b.url}" target="_blank">${b.title}</a>` : b.title}</td>
    <td style="color:${sc(b.overall)};font-family:'DM Mono',monospace;font-weight:700">${b.overall}</td>
    <td style="color:${b.wordCount>=1500?"#4ade80":"#f87171"}">${b.wordCount.toLocaleString()}</td>
    <td style="color:${(b.age||0)>24?"#fb923c":"#4ade80"}">${b.age||"?"}</td>
    <td style="color:${(b.brokenLinks?.length||0)>0?"#f87171":"#4ade80"}">${b.brokenLinks?.length||0}</td>
    <td style="color:${(b.contentImagesMissingAlt?.length||0)>0?"#facc15":"#4ade80"}">${b.contentImagesMissingAlt?.length||0}</td>
  </tr>`).join("")}
</table>

${report.crossAnalysis.mergeGroups?.length > 0 ? `
<h2>🔀 Merge Recommendations</h2>
${report.crossAnalysis.mergeGroups.map(g=>`
<div class="card" style="margin-bottom:12px">
  <div style="margin-bottom:8px">${g.posts.map(p=>`<span class="pill">${p}</span>`).join("")}</div>
  <div style="font-size:12px;color:#94a3b8;margin-bottom:4px"><strong style="color:#64748b">Reason:</strong> ${g.reason}</div>
  <div style="font-size:12px;color:#60a5fa;margin-bottom:4px"><strong style="color:#64748b">Suggested title:</strong> ${g.suggestedTitle}</div>
  <div style="font-size:12px;color:#64748b"><strong>Strategy:</strong> ${g.strategy}</div>
</div>`).join("")}` : ""}

<h2>Critical Recommendations</h2>
${report.blogs.flatMap(b=>(b.recommendations||[]).filter(r=>r.type==="critical").map(r=>({...r,blog:b.title,blogUrl:b.url}))).slice(0,20).map(r=>`
<div class="rec critical">
  <div style="font-size:11px;color:#64748b;margin-bottom:2px">${r.blogUrl?`<a href="${r.blogUrl}" target="_blank">${r.blog}</a>`:r.blog} · ${r.area}</div>
  <div style="font-size:13px;color:#cbd5e1">${r.action}</div>
</div>`).join("")}

<div class="print-footer">Generated by BlogAuditAI · ${date}</div>
</body></html>`;
}
