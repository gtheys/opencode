# Marpit Directives Reference

## Table of Contents
1. [Writing Directives](#writing-directives)
2. [Global Directives](#global-directives)
3. [Local Directives](#local-directives)
4. [Spot Directives](#spot-directives)
5. [Directive Precedence](#directive-precedence)
6. [Custom Directives (Developer)](#custom-directives)

---

## Writing Directives

Directives are written as YAML. Two methods:

### HTML Comments (anywhere in Markdown)

```markdown
<!-- theme: default -->
<!-- paginate: true -->
```

Multi-line:

```markdown
<!--
theme: default
paginate: true
-->
```

When a comment is parsed as a directive, it is NOT collected as a presenter note.

### YAML Front-Matter (must be first thing in file)

```markdown
---
marp: true
theme: default
paginate: true
---
```

The front-matter's closing `---` is NOT a slide separator — content starts after it.

### YAML Special Characters

Wrap values with quotes when they contain YAML special chars:

```markdown
<!-- header: "**bold** header" -->
<!-- footer: "Page: 1" -->
```

---

## Global Directives

Apply to the **entire deck**. Only the last value wins if duplicated.

### `theme`

Select a registered theme by name.

```markdown
---
theme: gaia
---
```

### `style`

Inject additional CSS. Alternative to `<style>` tags — useful for keeping Markdown compatible with other editors.

```markdown
---
style: |
  section {
    background-color: #ccc;
  }
  h1 {
    color: navy;
  }
---
```

### `headingDivider`

Auto-split slides at headings. Accepts a single number (1-6) or array.

```markdown
---
headingDivider: 2
---
```

Splits at any heading level ≥ 2 (i.e., `##`, `###`, etc.).

```markdown
---
headingDivider: [1, 2]
---
```

Splits only at `#` and `##`.

This is useful for turning plain Markdown documents into presentations without manually adding `---` rulers.

---

## Local Directives

Apply from the **defined slide onward** (cascade to subsequent slides until overridden).

| Directive | Purpose | Example Value |
|---|---|---|
| `paginate` | Show page numbers | `true`, `false` |
| `header` | Header content (Markdown OK) | `"**My Talk**"` |
| `footer` | Footer content (Markdown OK) | `"© 2025 Author"` |
| `class` | CSS class on `<section>` | `lead`, `invert`, or array `[lead, invert]` |
| `color` | Text color | `#333`, `white` |
| `backgroundColor` | Background color | `#fdf6e3`, `navy` |
| `backgroundImage` | Background image (CSS value) | `"url(image.jpg)"` |
| `backgroundPosition` | Background position | `center`, `top left` |
| `backgroundRepeat` | Background repeat | `no-repeat`, `repeat` |
| `backgroundSize` | Background size | `cover`, `contain`, `50%` |

### Example: Change footer partway through

```markdown
---
marp: true
theme: default
footer: "Part 1: Introduction"
---

# Intro Slide 1

---

# Intro Slide 2

---
<!-- footer: "Part 2: Deep Dive" -->

# Deep Dive Slide 1
```

Slides 1-2 get "Part 1" footer; slide 3 onward gets "Part 2".

---

## Spot Directives

Prefix any local directive with `_` to apply it to the **current slide only** (does not cascade).

```markdown
---
marp: true
paginate: true
---

<!-- _paginate: false -->

# Title Slide (no page number)

---

# Slide 2 (has page number again)
```

### `_paginate: skip`

Hides the page number but still increments the count (so the next visible page number accounts for this slide).

### Common patterns

```markdown
<!-- _class: invert -->          <!-- Dark slide, just this one -->
<!-- _backgroundColor: black --> <!-- Black bg, just this one -->
<!-- _color: white -->           <!-- White text, just this one -->
<!-- _header: "" -->             <!-- Remove header, just this one -->
<!-- _footer: "" -->             <!-- Remove footer, just this one -->
```

---

## Directive Precedence

1. Front-matter directives are applied first
2. HTML comment directives override in document order
3. Spot directives (`_` prefix) override local directives for that slide only
4. For global directives, the **last** occurrence wins
5. For local directives, each occurrence overrides the previous from that slide onward

---

## Custom Directives (Developer)

Marpit allows extending directives programmatically:

```javascript
marpit.customDirectives.global.$theme = (value, marpit) => {
  return { theme: value }
}

marpit.customDirectives.local.colorPreset = (value) => {
  const presets = {
    sunset: { backgroundColor: '#ff6b35', color: '#fff' },
    dark: { backgroundColor: '#1a1a2e', color: '#eee' },
  }
  return presets[value] || {}
}
```

Marp Core extends Marpit with additional directives like `size` (for choosing slide size presets defined in theme CSS).
