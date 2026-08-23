import { QuartzConfig } from "./quartz/quartz/cfg"
import * as Plugin from "./quartz/quartz/plugins"

const repository = process.env.GITHUB_REPOSITORY ?? "GeorgeGao-Jingqi/personal-homepage"
const [owner, name] = repository.split("/")

const config: QuartzConfig = {
  configuration: {
    pageTitle: "个人知识花园",
    pageTitleSuffix: " · 个人知识库",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "zh-CN",
    baseUrl: process.env.GITHUB_ACTIONS ? `${owner}.github.io/${name}` : "localhost:4179",
    ignorePatterns: ["private", "templates", ".obsidian", "**/*.draft.md"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "local",
      cdnCaching: false,
      typography: {
        header: "Inter",
        body: "Inter",
        code: "ui-monospace",
      },
      colors: {
        lightMode: {
          light: "#f6f4ef",
          lightgray: "#e3e0d7",
          gray: "#777570",
          darkgray: "#2d2d2d",
          dark: "#1c1c1c",
          secondary: "#b13a25",
          tertiary: "#9c7a2c",
          highlight: "#edeae1",
          textHighlight: "#ead8a3",
        },
        darkMode: {
          light: "#121212",
          lightgray: "#262626",
          gray: "#8e8c85",
          darkgray: "#d9d7d0",
          dark: "#e8e6e0",
          secondary: "#cf5f45",
          tertiary: "#cba24a",
          highlight: "#1c1c1c",
          textHighlight: "#594b25",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({ priority: ["frontmatter", "git", "filesystem"] }),
      Plugin.SyntaxHighlighting({
        theme: { light: "github-light", dark: "github-dark" },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.ExplicitPublish()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({ enableSiteMap: true, enableRSS: true }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
