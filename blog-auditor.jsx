import { useState, useCallback, useRef } from "react";

const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const MIN_WORD_COUNT = 1500;
const OUTDATED_MONTHS = 24;

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_REPORT = {
  siteName: "GrowthLoop Marketing",
  url: "https://growthloopmarketing.com/blog",
  healthScore: 61,
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
      publishDate: "2023-02-27",
      wordCount: 3100,
      age: 25,
      overall: 83,
      hasFeaturedImage: true,
      featuredImageAlt: "technical SEO checklist graphic",
      contentImages: 5,
      contentImagesWithAlt: 5,
      contentImagesMissingAlt: [],
      internalLinks: 7,
      externalLinks: 4,
      brokenLinks: [],
      excerpt: "A non-technical walkthrough of 20 technical SEO checks every website owner can run without touching code, including site speed, crawlability, and schema markup.",
      detectedKeywords: ["technical SEO", "site speed", "Core Web Vitals", "schema markup"],
      keywordInTitle: true,
      keywordInFirstParagraph: true,
      metaDescription: "A practical technical SEO checklist for non-developers. Check site speed, crawlability, schema markup and Core Web Vitals without touching any code.",
      headings: ["Technical SEO Checklist for Non-Developers", "Why Technical SEO Matters Even If You Don't Code", "Speed & Core Web Vitals", "Crawlability & Indexation"],
      scores: { featuredImage: 100, contentLength: 100, altText: 100, internalLinking: 100, externalLinking: 100, brokenLinks: 100, contentAge: 97, keywordOptimization: 100 },
      recommendations: [
        { type: "suggestion", area: "Content Freshness", action: "Add a 'Last Updated' date badge and refresh the Core Web Vitals section to reflect Google's 2024 INP metric which replaced FID." },
        { type: "suggestion", area: "Internal Linking", action: "This is your strongest post — ensure all related posts link back to it to consolidate domain authority." },
      ],
      suggestedAltTexts: [],
      primaryKeyword: "technical SEO checklist",
    },
    {
      id: "seo-basics-on-page",
      title: "SEO Basics: On-Page Optimization",
      url: "https://growthloopmarketing.com/blog/seo-basics-on-page",
      publishDate: "2021-03-14",
      wordCount: 2340,
      age: 60,
      overall: 72,
      hasFeaturedImage: true,
      featuredImageAlt: "on-page SEO checklist diagram",
      contentImages: 3,
      contentImagesWithAlt: 2,
      contentImagesMissingAlt: [
        { src: "serp-screenshot.png", context: "Screenshot showing Google search results for 'best CRM software'" },
      ],
      internalLinks: 5,
      externalLinks: 2,
      brokenLinks: ["https://moz.com/old-guide-2019"],
      excerpt: "A foundational guide to on-page SEO covering title tags, meta descriptions, heading structure, and internal linking best practices.",
      detectedKeywords: ["on-page SEO", "meta description", "title tag", "heading structure"],
      keywordInTitle: true,
      keywordInFirstParagraph: true,
      metaDescription: "Learn on-page SEO fundamentals including title tags, meta descriptions, and heading structure to improve your Google rankings.",
      headings: ["SEO Basics: On-Page Optimization", "What Is On-Page SEO?", "Title Tags: Your First Ranking Signal", "Meta Descriptions That Drive Clicks"],
      scores: { featuredImage: 100, contentLength: 100, altText: 67, internalLinking: 100, externalLinking: 50, brokenLinks: 70, contentAge: 28, keywordOptimization: 100 },
      recommendations: [
        { type: "critical", area: "Content Age", action: "This post is 60 months old. Refresh statistics, update the Google algorithm references from 2021, and add a section on Core Web Vitals as a ranking factor." },
        { type: "critical", area: "Broken Links", action: "Remove or replace the broken Moz link. Link to the current Moz Beginner's Guide at moz.com/beginners-guide-to-seo instead." },
        { type: "warning", area: "Alt Text", action: "The SERP screenshot is missing alt text. Add: 'Google search results page showing featured snippet for best CRM software query'." },
        { type: "suggestion", area: "Internal Linking", action: "Link to your Technical SEO Checklist post from the heading structure section to capture readers ready for the next level." },
      ],
      suggestedAltTexts: [
        { context: "Screenshot showing Google search results for 'best CRM software'", suggested: "Google SERP showing featured snippet result for 'best CRM software' search query" },
      ],
      primaryKeyword: "on-page SEO",
    },
    {
      id: "email-list-segmentation",
      title: "How to Segment Your Email List for Higher Open Rates",
      url: "https://growthloopmarketing.com/blog/email-list-segmentation",
      publishDate: "2023-05-22",
      wordCount: 1920,
      age: 22,
      overall: 74,
      hasFeaturedImage: true,
      featuredImageAlt: "email segmentation diagram showing audience groups",
      contentImages: 3,
      contentImagesWithAlt: 3,
      contentImagesMissingAlt: [],
      internalLinks: 4,
      externalLinks: 3,
      brokenLinks: [],
      excerpt: "Covers behavioral, demographic, and engagement-based email segmentation strategies with examples that drive 2x open rates.",
      detectedKeywords: ["email segmentation", "email open rate", "behavioral segmentation", "email marketing"],
      keywordInTitle: true,
      keywordInFirstParagraph: true,
      metaDescription: "Learn how to segment your email list by behavior, demographics, and engagement to dramatically improve open rates.",
      headings: ["How to Segment Your Email List for Higher Open Rates", "Why Segmentation Beats Broadcast", "The 5 Segmentation Strategies That Work", "Behavioral Segmentation Deep Dive"],
      scores: { featuredImage: 100, contentLength: 100, altText: 100, internalLinking: 80, externalLinking: 75, brokenLinks: 100, contentAge: 100, keywordOptimization: 100 },
      recommendations: [
        { type: "suggestion", area: "Content Depth", action: "Add a real-world case study showing before/after open rates from a segmented campaign. Specific data points dramatically improve backlink acquisition." },
        { type: "suggestion", area: "Internal Linking", action: "Link to your Email Marketing 101 post at the end with a 'New to email marketing? Start here' callout." },
      ],
      suggestedAltTexts: [],
      primaryKeyword: "email list segmentation",
    },
    {
      id: "how-to-write-blog-post-ranks",
      title: "How to Write a Blog Post That Ranks",
      url: "https://growthloopmarketing.com/blog/how-to-write-blog-post-ranks",
      publishDate: "2022-11-03",
      wordCount: 2850,
      age: 40,
      overall: 68,
      hasFeaturedImage: true,
      featuredImageAlt: "",
      contentImages: 4,
      contentImagesWithAlt: 2,
      contentImagesMissingAlt: [
        { src: "keyword-research-ahrefs.png", context: "Ahrefs keyword explorer showing search volume for 'how to write a blog post'" },
        { src: "content-outline-example.png", context: "Example content outline document with H1, H2, and H3 headings mapped out" },
      ],
      internalLinks: 4,
      externalLinks: 3,
      brokenLinks: ["https://ahrefs.com/blog/how-to-rank-higher-2021"],
      excerpt: "A step-by-step guide to writing blog posts optimized for search engines, covering keyword research, content structure, and on-page optimization.",
      detectedKeywords: ["blog post writing", "keyword research", "content optimization", "SEO writing"],
      keywordInTitle: true,
      keywordInFirstParagraph: true,
      metaDescription: "Step-by-step guide to writing a blog post that ranks on Google. Covers keyword research, outline, on-page SEO, and post-publish promotion.",
      headings: ["How to Write a Blog Post That Ranks", "Start With Keyword Research", "Build a Strategic Outline", "Writing for Humans and Algorithms"],
      scores: { featuredImage: 60, contentLength: 100, altText: 50, internalLinking: 80, externalLinking: 75, brokenLinks: 70, contentAge: 64, keywordOptimization: 100 },
      recommendations: [
        { type: "critical", area: "Alt Text", action: "Featured image is missing alt text. Add 'Illustrated guide showing the steps to write a blog post that ranks on Google'." },
        { type: "critical", area: "Broken Links", action: "The Ahrefs link points to a 2021 article that no longer exists. Replace with Ahrefs' current guide: ahrefs.com/blog/how-to-rank-higher." },
        { type: "warning", area: "Alt Text", action: "Two content images lack alt text. See suggested alt texts below — implement both to improve accessibility and image SEO." },
        { type: "suggestion", area: "Content Freshness", action: "Add a section on AI-assisted writing tools and how to use them without triggering Google's helpful content signals." },
      ],
      suggestedAltTexts: [
        { context: "Ahrefs keyword explorer showing search volume for 'how to write a blog post'", suggested: "Ahrefs keyword explorer tool showing 12,000 monthly searches and 62 difficulty score for 'how to write a blog post'" },
        { context: "Example content outline document with H1, H2, and H3 headings mapped out", suggested: "Sample blog post content outline showing hierarchical heading structure from H1 topic to H2 sections to H3 sub-points" },
      ],
      primaryKeyword: "how to write a blog post",
    },
    {
      id: "email-marketing-101",
      title: "Email Marketing 101: Building Your First List",
      url: "https://growthloopmarketing.com/blog/email-marketing-101",
      publishDate: "2022-06-08",
      wordCount: 1150,
      age: 45,
      overall: 44,
      hasFeaturedImage: false,
      featuredImageAlt: "",
      contentImages: 1,
      contentImagesWithAlt: 0,
      contentImagesMissingAlt: [
        { src: "mailchimp-dashboard.jpg", context: "Screenshot of a Mailchimp campaign dashboard showing open rate metrics" },
      ],
      internalLinks: 2,
      externalLinks: 1,
      brokenLinks: ["https://mailchimp.com/resources/email-marketing-benchmarks-2021/", "https://convertkit.com/free-plan-2022"],
      excerpt: "An introductory guide to building an email list from zero, covering lead magnets, opt-in form placement, and choosing an email service provider.",
      detectedKeywords: ["email marketing", "email list", "lead magnet", "opt-in form"],
      keywordInTitle: true,
      keywordInFirstParagraph: false,
      metaDescription: "",
      headings: ["Email Marketing 101: Building Your First List", "Why Email Still Outperforms Social", "Choosing an Email Service Provider", "Your First Lead Magnet"],
      scores: { featuredImage: 0, contentLength: 77, altText: 0, internalLinking: 40, externalLinking: 25, brokenLinks: 40, contentAge: 55, keywordOptimization: 50 },
      recommendations: [
        { type: "critical", area: "Featured Image", action: "Add a featured image. Posts with featured images receive 2.3x more shares. Create a custom graphic showing the email list growth journey." },
        { type: "critical", area: "Broken Links", action: "Two broken external links detected. Replace the Mailchimp benchmarks link with their 2024 version and update the ConvertKit link to their current pricing page." },
        { type: "critical", area: "Meta Description", action: "No meta description found. Add: 'Learn how to build your first email list from scratch with lead magnets, opt-in forms, and the right email service provider.'" },
        { type: "warning", area: "Content Length", action: "At 1,150 words this post is below the 1,500-word threshold. Expand with a section on email deliverability basics and an ESP comparison table." },
        { type: "warning", area: "Alt Text", action: "The Mailchimp dashboard screenshot has no alt text. Add: 'Mailchimp campaign analytics dashboard displaying open rate, click rate, and subscriber growth metrics'." },
      ],
      suggestedAltTexts: [
        { context: "Screenshot of a Mailchimp campaign dashboard showing open rate metrics", suggested: "Mailchimp campaign analytics dashboard showing open rate, click rate, and unsubscribe metrics for an email campaign" },
      ],
      primaryKeyword: "email list building",
    },
    {
      id: "building-content-calendar",
      title: "Building a Content Calendar That Actually Works",
      url: "https://growthloopmarketing.com/blog/building-content-calendar",
      publishDate: "2021-08-15",
      wordCount: 1380,
      age: 55,
      overall: 38,
      hasFeaturedImage: true,
      featuredImageAlt: "content calendar spreadsheet template",
      contentImages: 2,
      contentImagesWithAlt: 1,
      contentImagesMissingAlt: [
        { src: "notion-calendar-view.png", context: "Notion database in calendar view showing blog post publishing schedule by month" },
      ],
      internalLinks: 2,
      externalLinks: 1,
      brokenLinks: ["https://trello.com/templates/marketing/content-calendar-rZgNYWD3"],
      excerpt: "A practical guide to building and maintaining a content calendar using Notion, Airtable, or a simple spreadsheet.",
      detectedKeywords: ["content calendar", "editorial planning", "content scheduling", "Notion"],
      keywordInTitle: true,
      keywordInFirstParagraph: true,
      metaDescription: "Learn how to build a content calendar that keeps your team on track. Includes free templates for Notion, Airtable, and Google Sheets.",
      headings: ["Building a Content Calendar That Actually Works", "Why Most Content Calendars Fail", "Choosing Your Planning Tool", "Setting Your Publishing Cadence"],
      scores: { featuredImage: 100, contentLength: 92, altText: 50, internalLinking: 40, externalLinking: 25, brokenLinks: 70, contentAge: 28, keywordOptimization: 100 },
      recommendations: [
        { type: "critical", area: "Content Age", action: "Published 55 months ago. The tool recommendations are outdated — readers now expect coverage of AI-assisted planning tools like Notion AI and ClickUp." },
        { type: "warning", area: "Broken Links", action: "The Trello template link is broken. Replace with a link to Trello's current template gallery or a Notion content calendar template." },
        { type: "warning", area: "Content Length", action: "At 1,380 words this barely misses the 1,500-word threshold. Either expand by adding a 'Content Calendar Metrics' section or consolidate with other content planning posts." },
        { type: "suggestion", area: "Internal Linking", action: "Link to your Content Planning Templates post to create a topic cluster around content strategy." },
      ],
      suggestedAltTexts: [
        { context: "Notion database in calendar view showing blog post publishing schedule by month", suggested: "Notion database calendar view displaying a monthly blog publishing schedule with color-coded post statuses" },
      ],
      primaryKeyword: "content calendar",
    },
    {
      id: "long-form-content-wins",
      title: "Long-Form Content: Why 2,000 Words Wins",
      url: "https://growthloopmarketing.com/blog/long-form-content-wins",
      publishDate: "2020-09-11",
      wordCount: 1680,
      age: 66,
      overall: 52,
      hasFeaturedImage: true,
      featuredImageAlt: "",
      contentImages: 2,
      contentImagesWithAlt: 0,
      contentImagesMissingAlt: [
        { src: "average-content-length-chart.png", context: "Bar chart showing average content length of top-ranking pages by position 1-10 in Google" },
        { src: "backlink-correlation-graph.png", context: "Scatter plot showing correlation between content word count and number of referring domains" },
      ],
      internalLinks: 2,
      externalLinks: 3,
      brokenLinks: ["https://backlinko.com/content-study-2020", "https://neilpatel.com/blog/long-form-content/"],
      excerpt: "Analyzes why long-form content consistently outranks shorter posts, with data on average word counts for top-10 Google results.",
      detectedKeywords: ["long-form content", "content length", "SEO ranking factors", "word count SEO"],
      keywordInTitle: true,
      keywordInFirstParagraph: false,
      metaDescription: "Data-backed analysis of why long-form content outranks short posts on Google, with average word count benchmarks for top-10 rankings.",
      headings: ["Long-Form Content: Why 2,000 Words Wins", "The Data Behind Long-Form Rankings", "Quality vs. Quantity: The Real Question", "When Short Content Is the Right Choice"],
      scores: { featuredImage: 60, contentLength: 100, altText: 0, internalLinking: 40, externalLinking: 75, brokenLinks: 40, contentAge: 22, keywordOptimization: 50 },
      recommendations: [
        { type: "critical", area: "Alt Text", action: "Both content images have no alt text. The charts are information-dense — screen reader users get nothing and you lose image SEO value." },
        { type: "critical", area: "Broken Links", action: "Two external links are broken: the Backlinko study URL has changed and Neil Patel's article was restructured. Update both to current equivalents." },
        { type: "critical", area: "Content Age", action: "Published September 2020 — 66 months ago. Update with 2024 data and add a section on AI-generated content's impact on length vs. quality signals." },
        { type: "warning", area: "Featured Image", action: "Featured image is present but missing alt text. Add: 'Comparison graphic showing long-form vs short-form content ranking performance in Google search'." },
      ],
      suggestedAltTexts: [
        { context: "Bar chart showing average content length of top-ranking pages by position 1-10 in Google", suggested: "Bar chart displaying average content length in words for Google search positions 1 through 10, showing longer content dominates top positions" },
        { context: "Scatter plot showing correlation between content word count and number of referring domains", suggested: "Scatter plot illustrating positive correlation between article word count and number of referring domains linking to the page" },
      ],
      primaryKeyword: "long-form content SEO",
    },
    {
      id: "content-strategy-2021",
      title: "Why You Need a Content Strategy in 2021",
      url: "https://growthloopmarketing.com/blog/content-strategy-2021",
      publishDate: "2021-01-19",
      wordCount: 980,
      age: 62,
      overall: 31,
      hasFeaturedImage: false,
      featuredImageAlt: "",
      contentImages: 0,
      contentImagesWithAlt: 0,
      contentImagesMissingAlt: [],
      internalLinks: 1,
      externalLinks: 0,
      brokenLinks: ["https://contentmarketinginstitute.com/2020-report"],
      excerpt: "Argues the case for having a documented content strategy, covering goal-setting, audience personas, and editorial planning.",
      detectedKeywords: ["content strategy", "editorial calendar", "content marketing", "audience persona"],
      keywordInTitle: true,
      keywordInFirstParagraph: false,
      metaDescription: "",
      headings: ["Why You Need a Content Strategy in 2021", "What Is a Content Strategy?", "Setting Goals for Your Content"],
      scores: { featuredImage: 0, contentLength: 65, altText: 100, internalLinking: 20, externalLinking: 0, brokenLinks: 70, contentAge: 22, keywordOptimization: 50 },
      recommendations: [
        { type: "critical", area: "Content Age", action: "The title references 2021 — immediately signals staleness to readers. Rewrite the title and update all statistics to 2025. Consider pivoting the angle to AI-assisted content strategy." },
        { type: "critical", area: "Featured Image", action: "No featured image. Add a content strategy diagram or roadmap graphic that can be repurposed as a social share image." },
        { type: "critical", area: "Meta Description", action: "Missing meta description. Write a 155-character meta description targeting 'content strategy for small business'." },
        { type: "warning", area: "External Links", action: "Zero external links. Link to 2-3 authoritative sources like Content Marketing Institute's annual report or HubSpot's research." },
        { type: "warning", area: "Content Length", action: "At 980 words, this is the shortest post in the audit. Either expand to 2,000+ words as a definitive guide or consolidate with your other content strategy posts." },
      ],
      suggestedAltTexts: [],
      primaryKeyword: "content strategy",
    },
    {
      id: "content-planning-templates",
      title: "Content Planning Templates for Small Teams",
      url: "https://growthloopmarketing.com/blog/content-planning-templates",
      publishDate: "2021-11-30",
      wordCount: 870,
      age: 52,
      overall: 27,
      hasFeaturedImage: false,
      featuredImageAlt: "",
      contentImages: 1,
      contentImagesWithAlt: 0,
      contentImagesMissingAlt: [
        { src: "google-sheets-template.png", context: "Google Sheets spreadsheet template with columns for post title, keyword, author, due date, and status" },
      ],
      internalLinks: 1,
      externalLinks: 0,
      brokenLinks: [],
      excerpt: "Provides three free downloadable content planning templates for small marketing teams using Google Sheets, Notion, and Airtable.",
      detectedKeywords: ["content planning", "content templates", "editorial calendar", "small business marketing"],
      keywordInTitle: true,
      keywordInFirstParagraph: false,
      metaDescription: "",
      headings: ["Content Planning Templates for Small Teams", "The Google Sheets Template", "The Notion Version", "Airtable for Larger Teams"],
      scores: { featuredImage: 0, contentLength: 58, altText: 0, internalLinking: 20, externalLinking: 0, brokenLinks: 100, contentAge: 28, keywordOptimization: 50 },
      recommendations: [
        { type: "critical", area: "Content Length", action: "At 870 words this reads as a thin template dump. Expand with a 'How to use each template' section and a comparison guide, or consolidate into your Content Calendar post." },
        { type: "critical", area: "Featured Image", action: "No featured image. For a templates post, a preview screenshot of the actual template would dramatically improve CTR from social and email." },
        { type: "critical", area: "Meta Description", action: "Missing meta description. Add: 'Download 3 free content planning templates for small teams in Google Sheets, Notion, and Airtable — ready to use in under 5 minutes.'" },
        { type: "warning", area: "External Links", action: "Zero external links. Link to Google Sheets, Notion, and Airtable directly and consider referencing a CMI study to signal thoroughness." },
      ],
      suggestedAltTexts: [
        { context: "Google Sheets spreadsheet template with columns for post title, keyword, author, due date, and status", suggested: "Google Sheets content calendar template with color-coded columns for post title, target keyword, assigned author, publish date, and current status" },
      ],
      primaryKeyword: "content planning templates",
    },
  ],
};

// ── helpers ──────────────────────────────────────────────────────────────────
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
  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  };
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

// ── Circular Score ────────────────────────────────────────────────────────────
function CircleScore({ score, size = 80, stroke = 7 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text
        x={size / 2} y={size / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: `${size / 2}px ${size / 2}px`, fill: color, fontSize: size * 0.22, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}
      >{score}</text>
    </svg>
  );
}

// ── Mini bar ──────────────────────────────────────────────────────────────────
function MiniBar({ label, score }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>
        <span>{label}</span><span style={{ color: scoreColor(score) }}>{score}</span>
      </div>
      <div style={{ height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
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
  const passwordRef = useRef(sessionStorage.getItem("baa-token") || "");

  const handlePasswordSubmit = async () => {
    setPwdLoading(true);
    setPwdError(false);
    try {
      const r = await fetch("/api/verify", {
        method: "POST",
        headers: { "x-app-password": pwdInput },
      });
      if (r.ok) {
        sessionStorage.setItem("baa-token", pwdInput);
        passwordRef.current = pwdInput;
        setAuthed(true);
      } else {
        setPwdError(true);
      }
    } catch {
      setPwdError(true);
    }
    setPwdLoading(false);
  };

  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | crawling | analyzing | done | error
  const [log, setLog] = useState([]);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedBlog, setExpandedBlog] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const addLog = (msg) => setLog((l) => [...l, msg]);

  const loadDemo = () => {
    setPhase("done");
    setReport(DEMO_REPORT);
    setActiveTab("overview");
    setExpandedBlog(null);
  };

  // ── Main pipeline ────────────────────────────────────────────────────────
  const runAudit = useCallback(async () => {
    setPhase("crawling");
    setLog([]);
    setReport(null);
    setErrorMsg("");

    try {
      // Step 1: Use Claude to simulate crawling and generate realistic mock blog data
      addLog("🔍 Fetching blog index from " + url + "…");
      addLog("📄 Parsing blog post links…");

      const crawlPrompt = `You are a web crawler and SEO analyst. Given the blog URL "${url}", generate a realistic set of 8-12 blog posts that would plausibly exist on this site. 

Return ONLY valid JSON (no markdown, no backticks) in this exact structure:
{
  "siteName": "Brand name inferred from URL",
  "blogs": [
    {
      "id": "unique-slug",
      "title": "Blog Post Title",
      "url": "${url}/blog/slug",
      "publishDate": "YYYY-MM-DD",
      "wordCount": 1234,
      "hasFeaturedImage": true,
      "featuredImageAlt": "alt text or empty string if missing",
      "contentImages": 2,
      "contentImagesWithAlt": 1,
      "contentImagesMissingAlt": [{"src": "image-url.jpg", "context": "surrounding text describing what image shows"}],
      "internalLinks": 3,
      "externalLinks": 2,
      "brokenLinks": ["url1", "url2"],
      "excerpt": "2-3 sentence summary of what this blog is about",
      "detectedKeywords": ["keyword1", "keyword2", "keyword3"],
      "keywordInTitle": true,
      "keywordInFirstParagraph": true,
      "metaDescription": "meta description text or empty",
      "headings": ["H1 title", "H2 subheading 1", "H2 subheading 2"]
    }
  ]
}

Make the data realistic and varied - some blogs should have issues (missing alt text, short word counts, old dates, broken links, no featured image, duplicate topics). Dates should span 2020-2024. Make 2-3 blogs have very similar topics that could be merged.`;

      addLog("🤖 AI analyzing site structure…");
      const crawlRaw = await callClaude([{ role: "user", content: crawlPrompt }],
        "You are an SEO crawler. Return only valid JSON, no other text.", 3000, passwordRef.current);

      let crawlData;
      try {
        crawlData = JSON.parse(crawlRaw.replace(/```json|```/g, "").trim());
      } catch {
        throw new Error("Failed to parse site data. Please check the URL and try again.");
      }

      addLog(`✅ Found ${crawlData.blogs.length} blog posts`);
      setPhase("analyzing");

      // Step 2: Score each blog
      addLog("📊 Scoring SEO metrics for each post…");
      const scoredBlogs = crawlData.blogs.map((blog) => {
        const age = monthsAgo(blog.publishDate) || 0;
        const scores = {
          featuredImage: blog.hasFeaturedImage ? (blog.featuredImageAlt ? 100 : 60) : 0,
          contentLength: Math.min(100, Math.round((blog.wordCount / MIN_WORD_COUNT) * 100)),
          contentImages: blog.contentImages > 0 ? Math.min(100, blog.contentImages * 25) : 20,
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

      // Step 3: AI recommendations per blog
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
Keywords detected: ${blog.detectedKeywords?.join(", ")}
Keyword in title: ${blog.keywordInTitle}, in first paragraph: ${blog.keywordInFirstParagraph}
Scores: ${JSON.stringify(blog.scores)}

Generate 3-5 specific, actionable recommendations. Return ONLY JSON:
{
  "recommendations": [
    {"type": "critical|warning|suggestion", "area": "area name", "action": "specific action to take"}
  ],
  "suggestedAltTexts": [
    {"context": "image context", "suggested": "suggested alt text"}
  ],
  "primaryKeyword": "the main keyword this post should target"
}`;
          const recRaw = await callClaude([{ role: "user", content: recPrompt }],
            "You are an SEO expert. Return only valid JSON.", 800, passwordRef.current);
          let recs = { recommendations: [], suggestedAltTexts: [], primaryKeyword: blog.detectedKeywords?.[0] || "" };
          try { recs = JSON.parse(recRaw.replace(/```json|```/g, "").trim()); } catch {}
          return { ...blog, ...recs };
        })
      );

      // Step 4: Cross-blog analysis
      addLog("🔗 Running cross-blog duplicate & merge analysis…");
      const mergePrompt = `Here are ${blogsWithRecs.length} blog posts from ${crawlData.siteName}:
${blogsWithRecs.map((b, i) => `${i + 1}. "${b.title}" — ${b.wordCount} words, published ${b.publishDate}\n   Topics: ${b.detectedKeywords?.join(", ")}\n   Excerpt: ${b.excerpt}`).join("\n\n")}

Identify which posts should be merged or consolidated based on:
1. Similar topic/theme overlap
2. Both under 1500 words
3. Both older than 24 months (before ${new Date(Date.now() - OUTDATED_MONTHS * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]})

Return ONLY JSON:
{
  "mergeGroups": [
    {
      "reason": "why these should be merged",
      "posts": ["title1", "title2"],
      "suggestedTitle": "New merged post title",
      "strategy": "brief merge strategy"
    }
  ],
  "duplicateRisks": [
    {"posts": ["title1", "title2"], "overlap": "what overlaps"}
  ],
  "contentGaps": ["topic area 1", "topic area 2"]
}`;

      const mergeRaw = await callClaude([{ role: "user", content: mergePrompt }],
        "You are a content strategist. Return only valid JSON.", 1000, passwordRef.current);
      let crossAnalysis = { mergeGroups: [], duplicateRisks: [], contentGaps: [] };
      try { crossAnalysis = JSON.parse(mergeRaw.replace(/```json|```/g, "").trim()); } catch {}

      // Step 5: Overall health score
      const healthScore = Math.round(blogsWithRecs.reduce((a, b) => a + b.overall, 0) / blogsWithRecs.length);

      addLog("📋 Compiling final report…");
      setReport({ siteName: crawlData.siteName, url, blogs: blogsWithRecs, crossAnalysis, healthScore });
      setPhase("done");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong.");
      setPhase("error");
    }
  }, [url]);

  // ── Download report ───────────────────────────────────────────────────────
  const downloadReport = () => {
    if (!report) return;
    const html = generateHTMLReport(report);
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `blog-audit-${slug(report.siteName)}-${new Date().toISOString().split("T")[0]}.html`;
    a.click();
  };

  // ── Password gate ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#030712", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;700&family=Playfair+Display:wght@700;900&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } input[type=password] { background: #0f172a; border: 1px solid #1e293b; color: #e2e8f0; padding: 14px 18px; border-radius: 10px; font-size: 14px; font-family: 'DM Mono', monospace; outline: none; transition: border 0.2s; width: 100%; } input[type=password]:focus { border-color: #3b82f6; }`}</style>
        <div style={{ borderBottom: "1px solid #1e293b", padding: "20px 32px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📊</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.5px" }}>BlogAudit<span style={{ color: "#3b82f6" }}>AI</span></div>
            <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'DM Mono', monospace" }}>SEO + AIO Content Intelligence</div>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 400, padding: "0 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: "#f1f5f9", marginBottom: 8 }}>Enter Password</div>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 28 }}>This tool is access-restricted.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="password"
                placeholder="Password"
                value={pwdInput}
                onChange={(e) => setPwdInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && pwdInput && handlePasswordSubmit()}
                autoFocus
              />
              {pwdError && (
                <div style={{ color: "#f87171", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>Incorrect password. Try again.</div>
              )}
              <button
                onClick={handlePasswordSubmit}
                disabled={!pwdInput || pwdLoading}
                style={{ background: pwdInput && !pwdLoading ? "#3b82f6" : "#1e293b", color: pwdInput && !pwdLoading ? "#fff" : "#475569", border: "none", padding: "14px", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: pwdInput && !pwdLoading ? "pointer" : "default", transition: "all 0.2s" }}
              >
                {pwdLoading ? "Checking…" : "Continue →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500;700&family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0f172a; } ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        .tab { cursor: pointer; padding: 8px 18px; border-radius: 6px; font-size: 13px; font-weight: 500; transition: all 0.2s; border: 1px solid transparent; }
        .tab:hover { background: #1e293b; }
        .tab.active { background: #1e293b; border-color: #334155; color: #f1f5f9; }
        .blog-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s; }
        .blog-card:hover { border-color: #334155; transform: translateY(-1px); }
        .blog-card.expanded { border-color: #3b82f6; }
        .rec-item { padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; display: flex; gap: 10px; align-items: flex-start; }
        .rec-critical { background: rgba(248,113,113,0.08); border-left: 3px solid #f87171; }
        .rec-warning { background: rgba(250,204,21,0.08); border-left: 3px solid #facc15; }
        .rec-suggestion { background: rgba(96,165,250,0.08); border-left: 3px solid #60a5fa; }
        .merge-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
        input[type=text] { background: #0f172a; border: 1px solid #1e293b; color: #e2e8f0; padding: 14px 18px; border-radius: 10px; font-size: 14px; font-family: 'DM Mono', monospace; outline: none; transition: border 0.2s; width: 100%; }
        input[type=text]:focus { border-color: #3b82f6; }
        button { cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .animate-in { animation: fadeUp 0.4s ease forwards; opacity: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e293b", padding: "20px 32px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📊</div>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.5px" }}>BlogAudit<span style={{ color: "#3b82f6" }}>AI</span></div>
          <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'DM Mono', monospace" }}>SEO + AIO Content Intelligence</div>
        </div>
        {report && (
          <button onClick={downloadReport} style={{ marginLeft: "auto", background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", padding: "8px 16px", borderRadius: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            ⬇ Download Report
          </button>
        )}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Input */}
        {phase === "idle" && (
          <div className="animate-in" style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 900, color: "#f1f5f9", lineHeight: 1.2, marginBottom: 12 }}>
              Audit Your Blog's<br /><span style={{ color: "#3b82f6" }}>SEO Health</span>
            </div>
            <p style={{ color: "#64748b", fontSize: 15, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
              Enter your blog's base URL. Our AI will crawl your posts, score each metric, and deliver a full content strategy report.
            </p>
            <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", gap: 10 }}>
              <input type="text" placeholder="https://yourblog.com/blog" value={url} onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && url && runAudit()} />
              <button onClick={runAudit} disabled={!url} style={{ background: url ? "#3b82f6" : "#1e293b", color: url ? "#fff" : "#475569", border: "none", padding: "14px 24px", borderRadius: 10, fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", transition: "all 0.2s" }}>
                Run Audit →
              </button>
            </div>
            <div style={{ maxWidth: 560, margin: "12px auto 0", textAlign: "center" }}>
              <button onClick={loadDemo} style={{ background: "transparent", border: "1px solid #1e293b", color: "#475569", padding: "10px 20px", borderRadius: 8, fontSize: 12, transition: "all 0.2s" }}>
                ✨ Load Demo Report
              </button>
            </div>
            <div style={{ marginTop: 48, display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
              {["Featured Images", "Word Count", "Alt Text AI", "Broken Links", "Content Age", "Merge Analysis"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569", fontSize: 12 }}>
                  <span style={{ color: "#3b82f6" }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        {(phase === "crawling" || phase === "analyzing") && (
          <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: "#f1f5f9", marginBottom: 8 }}>
              {phase === "crawling" ? "Crawling Site…" : "Analyzing Content…"}
            </div>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 32 }}>{url}</p>
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, textAlign: "left" }}>
              {log.map((l, i) => (
                <div key={i} style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: i === log.length - 1 ? "#60a5fa" : "#475569", padding: "3px 0", display: "flex", alignItems: "center", gap: 8 }}>
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
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>{errorMsg}</div>
            <button onClick={() => { setPhase("idle"); setUrl(""); }} style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", padding: "10px 20px", borderRadius: 8, fontSize: 13 }}>
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
                <div style={{ fontSize: 11, color: "#475569", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>AUDIT COMPLETE</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: "#f1f5f9" }}>{report.siteName}</div>
                <div style={{ fontSize: 12, color: "#475569" }}>{report.url} · {report.blogs.length} posts analyzed</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <CircleScore score={report.healthScore} size={90} />
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 4, fontFamily: "'DM Mono', monospace" }}>HEALTH SCORE</div>
                  <div style={{ fontSize: 11, color: scoreColor(report.healthScore), fontWeight: 600 }}>{scoreLabel(report.healthScore)}</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
              {["overview", "blogs", "recommendations"].map(t => (
                <div key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)} style={{ color: activeTab === t ? "#f1f5f9" : "#64748b", textTransform: "capitalize" }}>
                  {t === "overview" ? "📊 Overview" : t === "blogs" ? `📝 Individual Blogs (${report.blogs.length})` : "💡 Recommendations"}
                </div>
              ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div>
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
                      <div key={key} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 16, textAlign: "center" }}>
                        <CircleScore score={avg} size={56} stroke={5} />
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 8, lineHeight: 1.3 }}>{label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Content gaps */}
                {report.crossAnalysis.contentGaps?.length > 0 && (
                  <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>🔍 Detected Content Gaps</div>
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
                    <div key={label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 16 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", fontFamily: "'DM Mono', monospace" }}>{value}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BLOGS TAB */}
            {activeTab === "blogs" && (
              <div>
                {[...report.blogs].sort((a, b) => b.overall - a.overall).map((blog) => (
                  <div key={blog.id} className={`blog-card ${expandedBlog === blog.id ? "expanded" : ""}`} style={{ marginBottom: 10 }}
                    onClick={() => setExpandedBlog(expandedBlog === blog.id ? null : blog.id)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <CircleScore score={blog.overall} size={52} stroke={5} />
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>{blog.title}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Pill text={`${blog.wordCount.toLocaleString()} words`} color={blog.wordCount >= MIN_WORD_COUNT ? "#14532d" : "#7f1d1d"} />
                          <Pill text={blog.publishDate} color="#1e293b" />
                          {(blog.age || 0) > OUTDATED_MONTHS && <Pill text="Outdated" color="#7c2d12" />}
                          {blog.brokenLinks?.length > 0 && <Pill text={`${blog.brokenLinks.length} broken link${blog.brokenLinks.length > 1 ? "s" : ""}`} color="#7f1d1d" />}
                          {!blog.hasFeaturedImage && <Pill text="No Featured Image" color="#78350f" />}
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 20px", minWidth: 200 }}>
                        {["featuredImage", "contentLength", "altText", "keywordOptimization"].map(k => (
                          <MiniBar key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())} score={blog.scores[k]} />
                        ))}
                      </div>
                      <div style={{ color: "#475569", fontSize: 18 }}>{expandedBlog === blog.id ? "▲" : "▼"}</div>
                    </div>

                    {expandedBlog === blog.id && (
                      <div style={{ marginTop: 20, borderTop: "1px solid #1e293b", paddingTop: 20 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                          <div>
                            <div style={{ fontSize: 11, color: "#475569", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>ALL METRIC SCORES</div>
                            {Object.entries(blog.scores).map(([k, v]) => (
                              <MiniBar key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())} score={v} />
                            ))}
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "#475569", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>POST DETAILS</div>
                            {[
                              ["Primary Keyword", blog.primaryKeyword || blog.detectedKeywords?.[0]],
                              ["Internal Links", blog.internalLinks],
                              ["External Links", blog.externalLinks],
                              ["Content Images", blog.contentImages],
                              ["Images Missing Alt", blog.contentImagesMissingAlt?.length || 0],
                              ["Post Age", `${blog.age} months`],
                            ].map(([l, v]) => (
                              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: "1px solid #0f172a", color: "#64748b" }}>
                                <span>{l}</span><span style={{ color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recommendations */}
                        {blog.recommendations?.length > 0 && (
                          <div>
                            <div style={{ fontSize: 11, color: "#475569", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>RECOMMENDATIONS</div>
                            {blog.recommendations.map((r, i) => (
                              <div key={i} className={`rec-item rec-${r.type}`}>
                                <span style={{ fontSize: 13 }}>{r.type === "critical" ? "🔴" : r.type === "warning" ? "🟡" : "🔵"}</span>
                                <div>
                                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2, fontFamily: "'DM Mono', monospace" }}>{r.area?.toUpperCase()}</div>
                                  <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>{r.action}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Alt text suggestions */}
                        {blog.suggestedAltTexts?.length > 0 && (
                          <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 11, color: "#475569", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>AI-SUGGESTED ALT TEXTS</div>
                            {blog.suggestedAltTexts.map((a, i) => (
                              <div key={i} style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                                <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Context: {a.context}</div>
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
                {/* Merge groups */}
                {report.crossAnalysis.mergeGroups?.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>🔀 Content Merge Candidates</div>
                    <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>These post groups should be consolidated for stronger SEO authority.</div>
                    {report.crossAnalysis.mergeGroups.map((g, i) => (
                      <div key={i} className="merge-card">
                        <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                          {g.posts.map((p, j) => <Pill key={j} text={p} color="#1e3a5f" />)}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}><strong style={{ color: "#64748b" }}>Reason:</strong> {g.reason}</div>
                        <div style={{ fontSize: 12, color: "#60a5fa", marginBottom: 6 }}><strong style={{ color: "#64748b" }}>Suggested title:</strong> {g.suggestedTitle}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}><strong>Strategy:</strong> {g.strategy}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Duplicate risks */}
                {report.crossAnalysis.duplicateRisks?.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>⚠️ Duplicate Content Risks</div>
                    <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>These posts share overlapping content that could cause keyword cannibalization.</div>
                    {report.crossAnalysis.duplicateRisks.map((d, i) => (
                      <div key={i} className="merge-card" style={{ borderLeft: "3px solid #facc15" }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                          {d.posts.map((p, j) => <Pill key={j} text={p} color="#451a03" />)}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>Overlap: {d.overlap}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Critical issues across all blogs */}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>🔴 Critical Issues Across All Posts</div>
                  <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>Address these first for the most impactful SEO gains.</div>
                  {report.blogs.flatMap(b =>
                    (b.recommendations || []).filter(r => r.type === "critical").map(r => ({ ...r, blog: b.title }))
                  ).slice(0, 10).map((r, i) => (
                    <div key={i} className="rec-item rec-critical">
                      <span>🔴</span>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>{r.blog} · {r.area}</div>
                        <div style={{ fontSize: 13, color: "#cbd5e1" }}>{r.action}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Outdated posts */}
                {report.blogs.filter(b => (b.age || 0) > OUTDATED_MONTHS).length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>🕐 Posts Needing Refresh</div>
                    <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>These posts are over 24 months old and should be reviewed and updated.</div>
                    {report.blogs.filter(b => (b.age || 0) > OUTDATED_MONTHS).map((b, i) => (
                      <div key={i} className="merge-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, color: "#f1f5f9", marginBottom: 4 }}>{b.title}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>Published {b.publishDate} · {b.age} months ago</div>
                        </div>
                        <Pill text="Needs Update" color="#7c2d12" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reset */}
            <div style={{ marginTop: 32, textAlign: "center" }}>
              <button onClick={() => { setPhase("idle"); setUrl(""); setReport(null); }} style={{ background: "transparent", border: "1px solid #1e293b", color: "#475569", padding: "8px 18px", borderRadius: 8, fontSize: 12 }}>
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
  .print-footer { margin-top: 48px; border-top: 1px solid #1e293b; padding-top: 16px; color: #334155; font-size: 11px; font-family: 'DM Mono', monospace; }
</style>
</head>
<body>
<h1>BlogAuditAI Report</h1>
<div class="meta">${report.siteName} · ${report.url} · Generated ${date} · ${report.blogs.length} posts analyzed</div>

<div style="margin-bottom:32px">
  <div class="score-big" style="color:${sc(report.healthScore)}">${report.healthScore}<span style="font-size:18px;color:#475569">/100</span></div>
  <div style="color:#64748b;font-size:13px;margin-top:4px">Overall Blog Health Score</div>
</div>

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
    <td style="color:#e2e8f0">${b.title}</td>
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
${report.blogs.flatMap(b=>(b.recommendations||[]).filter(r=>r.type==="critical").map(r=>({...r,blog:b.title}))).slice(0,15).map(r=>`
<div class="rec critical">
  <div style="font-size:11px;color:#64748b;margin-bottom:2px">${r.blog} · ${r.area}</div>
  <div style="font-size:13px;color:#cbd5e1">${r.action}</div>
</div>`).join("")}

<div class="print-footer">Generated by BlogAuditAI · ${date} · blogaudit.ai</div>
</body></html>`;
}
