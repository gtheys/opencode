# Marpit Theme CSS Reference

## Table of Contents
1. [Theme Basics](#theme-basics)
2. [The @theme Metadata](#the-theme-metadata)
3. [Slide Size](#slide-size)
4. [Styling Slides](#styling-slides)
5. [Pagination Styling](#pagination-styling)
6. [Header and Footer Styling](#header-and-footer-styling)
7. [The :root Pseudo-Class](#the-root-pseudo-class)
8. [Tweaking Styles via Markdown](#tweaking-styles-via-markdown)
9. [Importing Themes](#importing-themes)
10. [Marp Core Built-in Themes](#marp-core-built-in-themes)
11. [Complete Theme Example](#complete-theme-example)

---

## Theme Basics

In Marpit, each slide is a `<section>` element. A theme is pure CSS that styles these sections. There are no predefined classes or mixins — just standard CSS targeting HTML elements.

```css
/* @theme my-theme */
section {
  width: 1280px;
  height: 720px;
  font-size: 30px;
  padding: 40px;
  background-color: #fff;
  color: #333;
}

h1 {
  font-size: 48px;
  color: #0366d6;
}
```

Marpit automatically scopes CSS selectors to the container element during rendering, so theme authors don't need to worry about CSS leaking outside the slide deck.

---

## The @theme Metadata

Every standalone theme CSS file **must** include the `@theme` metadata comment:

```css
/* @theme theme-name */
```

If using Sass with compressed output, use the preserved comment syntax:

```css
/*! @theme theme-name */
```

This name is what you reference in the `theme` directive: `<!-- theme: theme-name -->`.

---

## Slide Size

Set `width` and `height` on the `section` selector to define slide dimensions. These values also determine the PDF page size when printing.

**Default**: 1280 × 720 pixels (16:9 widescreen).

```css
/* 16:9 widescreen */
section { width: 1280px; height: 720px; }

/* 4:3 traditional */
section { width: 960px; height: 720px; }

/* A4 landscape */
section { width: 297mm; height: 210mm; }
```

**Rules**:
- Must use absolute units: `px`, `cm`, `in`, `mm`, `pc`, `pt`
- Size is determined per theme — it cannot be changed via inline styles, custom classes, or CSS custom properties at the slide level
- Content width may shrink when using split backgrounds

### Size presets (Marp Core only)

Marp Core themes can define size presets via `@size` metadata:

```css
/* @theme my-theme */
/* @size 4:3 960px 720px */
/* @size 16:9 1280px 720px */
/* @size 4K 3840px 2160px */
section { width: 1280px; height: 720px; }
```

Users select presets via the `size` global directive:

```markdown
---
theme: my-theme
size: 4:3
---
```

---

## Styling Slides

### Basic element styling

```css
section {
  font-family: 'Segoe UI', sans-serif;
  line-height: 1.6;
}

h1, h2, h3 { font-weight: 700; }
h1 { font-size: 2em; }
h2 { font-size: 1.5em; }

a { color: #0366d6; }
code { background: #f6f8fa; padding: 2px 6px; border-radius: 3px; }

pre {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow: auto;
}

table {
  border-collapse: collapse;
  width: 100%;
}
th, td {
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
}
th { background: #f6f8fa; }

img { max-width: 100%; }

blockquote {
  border-left: 4px solid #dfe2e5;
  padding-left: 16px;
  color: #6a737d;
}
```

### Custom classes

Define classes on `section` and apply via the `class` directive:

```css
section.lead {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

section.invert {
  background: #1a1a2e;
  color: #eaeaea;
}

section.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2em;
}
```

Usage in Markdown:

```markdown
<!-- _class: lead -->
# Centered Title

---
<!-- _class: invert -->
# Dark Slide
```

---

## Pagination Styling

When `paginate: true` is set, page numbers appear via the `section::after` pseudo-element.

Default content is `attr(data-marpit-pagination)` (current page number).

```css
section::after {
  font-size: 14px;
  font-weight: bold;
  color: #999;
}
```

### Show "Page X / Total" format

```css
section::after {
  content: attr(data-marpit-pagination) ' / ' attr(data-marpit-pagination-total);
}
```

### Position pagination

The `section::after` pseudo-element is absolutely positioned by default. You can adjust:

```css
section::after {
  position: absolute;
  right: 30px;
  bottom: 20px;
}
```

---

## Header and Footer Styling

When `header` or `footer` directives are set, Marpit inserts `<header>` and `<footer>` elements in each slide.

```css
header, footer {
  position: absolute;
  left: 40px;
  right: 40px;
  font-size: 14px;
  color: #888;
}

header {
  top: 20px;
}

footer {
  bottom: 20px;
}
```

Header and footer content supports inline Markdown:

```markdown
<!-- header: "**My Talk** — *Conference 2025*" -->
<!-- footer: "[Link](https://example.com)" -->
```

---

## The :root Pseudo-Class

In Marpit themes, `:root` refers to `<section>` elements (not `<html>`). You can use it interchangeably with `section`, but `:root` has higher CSS specificity.

```css
:root {
  --accent: #e74c3c;
  font-size: 28px;
}

h1 { color: var(--accent); }
```

`rem` units in Marpit theme CSS are automatically transformed to calculated values relative to the parent `<section>`, so they behave as expected regardless of the HTML document's root font size.

---

## Tweaking Styles via Markdown

### `<style>` tag

Inline `<style>` tags in Markdown work within the theme CSS context:

```markdown
<style>
section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
</style>
```

### `<style scoped>`

Applies CSS only to the current slide:

```markdown
<style scoped>
section { background: black; color: white; }
h1 { color: gold; }
</style>

# This slide is special
```

### `style` global directive

```markdown
---
style: |
  section { background: #fafafa; }
---
```

This is functionally identical to a `<style>` tag but keeps the Markdown cleaner for other editors.

---

## Importing Themes

### In standalone theme CSS files

Use `@import` to inherit from another theme:

```css
/* @theme my-custom-theme */
@import 'default';

section {
  font-family: 'Georgia', serif;
  background: #fffff8;
}
```

### `@import-theme` (Marp Core)

Within a `<style>` tag in Markdown, use `@import-theme` to import a theme:

```markdown
<style>
@import-theme 'gaia';
section { background: #fafafa; }
</style>
```

Note: Regular `@import` inside `<style>` tags in Markdown is processed as a standard CSS import, not a theme import.

---

## Marp Core Built-in Themes

### `default`

Based on GitHub markdown style. Slides are vertically centered. Supports CSS variables from `github-markdown-css`.

### `gaia`

A warm, colorful theme. Supports classes:
- `lead` — centered title layout
- `invert` — inverted colors
- `gaia` — alternative color scheme

CSS variables for customization:
```css
:root {
  --color-background: #fff;
  --color-foreground: #333;
  --color-highlight: #f96;
  --color-dimmed: #888;
}
```

### `uncover`

Simple, minimal, modern. Inspired by reveal.js.

CSS variables:
```css
:root {
  --color-background: #fff;
  --color-foreground: #333;
  --color-highlight: #e74c3c;
  --color-dimmed: #888;
}
```

All three themes support `4:3` and `16:9` size presets.

---

## Complete Theme Example

A full custom theme with multiple slide classes:

```css
/* @theme corporate */

section {
  width: 1280px;
  height: 720px;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  font-size: 28px;
  padding: 50px;
  background: #ffffff;
  color: #2d3748;
  line-height: 1.6;
}

h1 { font-size: 2.2em; color: #1a365d; margin-bottom: 0.3em; }
h2 { font-size: 1.6em; color: #2b6cb0; margin-bottom: 0.3em; }
h3 { font-size: 1.2em; color: #4a5568; }

a { color: #3182ce; }
strong { color: #1a365d; }

code {
  background: #edf2f7;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

pre {
  background: #1a202c;
  color: #e2e8f0;
  padding: 20px;
  border-radius: 8px;
}

blockquote {
  border-left: 4px solid #3182ce;
  padding-left: 20px;
  color: #718096;
  font-style: italic;
}

table { width: 100%; border-collapse: collapse; }
th { background: #ebf8ff; color: #2b6cb0; }
th, td { border: 1px solid #e2e8f0; padding: 10px 16px; }

/* Title slide class */
section.title {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%);
  color: white;
}
section.title h1 { color: white; font-size: 2.8em; }
section.title h2 { color: #bee3f8; font-weight: 400; }

/* Dark/invert class */
section.dark {
  background: #1a202c;
  color: #e2e8f0;
}
section.dark h1, section.dark h2 { color: #90cdf4; }

/* Pagination */
section::after {
  font-size: 13px;
  color: #a0aec0;
  content: attr(data-marpit-pagination) ' / ' attr(data-marpit-pagination-total);
}

/* Header & footer */
header {
  font-size: 13px;
  color: #a0aec0;
}
footer {
  font-size: 13px;
  color: #a0aec0;
}
```
