---
name: marpit-slides
description: Write Markdown slide decks using Marpit/Marp syntax and style them with CSS themes. Use this skill whenever the user wants to create presentation slides in Markdown, mentions Marp or Marpit, asks for a ".md slide deck", wants to write slides using horizontal rulers (---), asks about Marp directives, image syntax, background images, split backgrounds, themes, or any Markdown-to-slide workflow. Also trigger when the user wants to style or theme Marp slides, add pagination/headers/footers, use scoped styles, create fragmented lists, or convert existing content into a Marp presentation. If the user says "slides", "deck", "presentation" and mentions Markdown or Marp, use this skill.
---

# Marpit/Marp Slide Writing Skill

This skill helps you write Markdown slide decks using the Marpit framework (and its superset Marp Core). The output is a `.md` file that can be rendered by Marp CLI, Marp for VS Code, or any Marpit-based tool into HTML, PDF, or PPTX.

## Quick Start Structure

Every Marp slide deck starts with a YAML front-matter block and uses `---` to separate slides:

```markdown
---
marp: true
theme: default
paginate: true
---

# Slide 1 Title

Content here

---

# Slide 2 Title

More content
```

The `marp: true` flag enables Marp features in VS Code and other tools. It is not a Marpit directive per se, but is standard practice and should always be included.

## Slide Separation

Slides are split by horizontal rulers. The standard `---` requires an empty line before it per CommonMark spec. Alternatives that don't need empty lines:

- `___` (underscores)
- `***` (asterisks)
- `- - -` (spaced dashes)

## Directives

Directives control slide-deck behavior. They are written as YAML inside HTML comments or in the front-matter. Read the full reference in `references/DIRECTIVES.md` before using advanced directive features.

### Where to write directives

1. **Front-matter** (top of file, between `---` rulers) — for global settings
2. **HTML comments** anywhere in the Markdown:
   ```markdown
   <!-- theme: default -->
   <!-- paginate: true -->
   ```

### Directive scoping

- **Global directives**: Apply to the entire deck. Set once (last value wins if duplicated). Examples: `theme`, `style`, `headingDivider`.
- **Local directives**: Apply from the current slide onward. Examples: `paginate`, `header`, `footer`, `class`, `color`, `backgroundColor`.
- **Spot directives**: Prefix with `_` to apply to the current slide only, e.g., `_class: invert`, `_paginate: false`, `_backgroundColor: black`.

### Key directives

| Directive | Scope | Purpose |
|---|---|---|
| `theme` | Global | Select theme name |
| `style` | Global | Inject CSS (alternative to `<style>` tag) |
| `headingDivider` | Global | Auto-split slides at heading levels (1-6 or array) |
| `paginate` | Local | Show page numbers (`true`/`false`) |
| `_paginate` | Spot | `false` hides number; `skip` hides but still counts |
| `header` | Local | Set header text |
| `footer` | Local | Set footer text |
| `class` | Local | Set CSS class on slide's `<section>` |
| `color` | Local | Set text color |
| `backgroundColor` | Local | Set background color |
| `backgroundImage` | Local | Set background image via CSS value |
| `backgroundSize` | Local | Set background-size style |
| `backgroundPosition` | Local | Set background-position style |

### Example: Title slide without pagination, then enable it

```markdown
---
marp: true
theme: default
---

# My Presentation
### By Author Name

---
<!-- paginate: true -->

# First Content Slide

This slide and all after it will have page numbers.
```

## Image Syntax

Marpit extends Markdown image syntax `![alt](url)` with keywords in the alt text. Read `references/IMAGE_SYNTAX.md` for the full reference.

### Resizing

```markdown
![width:200px](image.jpg)
![height:30cm](image.jpg)
![w:300 h:200](image.jpg)
```

Shorthand: `w` for width, `h` for height.

### CSS Filters

Add filter keywords to the alt text:

```markdown
![blur:3px](image.jpg)
![brightness:0.8 sepia:50%](image.jpg)
```

Available filters: `blur`, `brightness`, `contrast`, `drop-shadow`, `grayscale`, `hue-rotate`, `invert`, `opacity`, `saturate`, `sepia`.

### Background Images

Add the `bg` keyword to make an image a slide background:

```markdown
![bg](https://example.com/photo.jpg)
```

Background size keywords: `cover` (default), `contain`, `fit` (alias for contain), `auto`, or a percentage like `50%`.

```markdown
![bg contain](image.jpg)
![bg 50%](image.jpg)
```

### Background Color

Pass a CSS color value as the URL:

```markdown
![bg](#ff6347)
![bg](rebeccapurple)
```

### Split Backgrounds

Use `bg left` or `bg right` to split the slide between content and a background image:

```markdown
![bg left](photo.jpg)

# Content on the right side
```

Specify split ratio: `![bg left:33%](photo.jpg)`

### Multiple Backgrounds

Multiple `![bg]` images in one slide tile side-by-side (horizontal by default). Add `vertical` keyword for vertical stacking:

```markdown
![bg](image1.jpg)
![bg](image2.jpg)
![bg](image3.jpg)
```

Multiple backgrounds require **inline SVG mode** to be enabled (it is enabled by default in Marp Core/CLI).

## Styling Slides

### Inline `<style>` tags

A `<style>` tag in Markdown applies in the context of the theme CSS — it's like adding rules to the theme:

```markdown
---
marp: true
theme: default
---

<style>
section {
  background-color: #fefefe;
  font-family: 'Helvetica Neue', sans-serif;
}
h1 {
  color: #2d3436;
}
</style>

# Styled Slide
```

### Scoped styles

Use `<style scoped>` for one-shot styling that applies only to the current slide:

```markdown
# Normal Slide

---

<style scoped>
h1 { color: red; }
section { background: black; color: white; }
</style>

# This slide only is styled differently
```

### The `style` directive

An alternative to `<style>` tags (useful to keep Markdown clean in other editors):

```markdown
---
marp: true
theme: default
style: |
  section {
    background-color: #fdf6e3;
  }
  h1 {
    color: #b58900;
  }
---
```

### Custom classes

Define classes in your style, then apply with the `class` directive:

```markdown
<style>
section.lead {
  text-align: center;
  justify-content: center;
}
section.invert {
  background: #333;
  color: #fff;
}
</style>

---
<!-- _class: lead -->

# Centered Title Slide

---
<!-- _class: invert -->

# Dark Slide
```

## Theme CSS Fundamentals

When creating a custom theme, the key concept is that `<section>` elements are the viewport for each slide. Read `references/THEME_CSS.md` for the full guide.

### Minimal custom theme

```markdown
---
marp: true
---

<style>
/* @theme my-custom */
section {
  width: 1280px;
  height: 720px;
  font-size: 28px;
  padding: 40px;
  background: #fff;
  color: #333;
}
h1 { color: #0366d6; font-size: 48px; }
h2 { color: #586069; font-size: 36px; }
</style>

# My Presentation
```

The `@theme` comment is required when defining a standalone theme file. When using `<style>` inline in a deck, you don't strictly need it, but it's good practice.

### Slide size

Width and height on `section` define the slide dimensions (default: 1280×720). Must use absolute units (`px`, `cm`, `in`, `pt`).

```css
/* 4:3 aspect ratio */
section { width: 960px; height: 720px; }

/* 16:9 widescreen (default) */
section { width: 1280px; height: 720px; }
```

### Pagination styling

Style page numbers via `section::after`:

```css
section::after {
  font-weight: bold;
  font-size: 14px;
  content: attr(data-marpit-pagination) ' / ' attr(data-marpit-pagination-total);
}
```

### Header and footer styling

```css
header, footer {
  font-size: 14px;
  color: #999;
}
header { top: 10px; }
footer { bottom: 10px; }
```

## Fragmented Lists

Use `*` (asterisk) for bullet lists or `)` for ordered lists to create fragmented (step-by-step reveal) lists. This works in HTML export only (not PDF/PPTX).

```markdown
# Regular list
- One
- Two
- Three

---

# Fragmented list (reveals one-by-one)
* One
* Two
* Three

---

# Fragmented ordered list
1) First
2) Second
3) Third
```

## Presenter Notes

HTML comments that are NOT parsed as directives become presenter notes:

```markdown
# My Slide

Content here

<!-- This is a presenter note — it won't appear on the slide -->
```

## headingDivider

Auto-split slides at headings instead of manually writing `---`:

```markdown
---
marp: true
headingDivider: 2
---

# Section 1

## Topic A
Content for Topic A

## Topic B
Content for Topic B
```

This produces 3 slides: "Section 1", "Topic A", and "Topic B". Accepts a single level number or an array like `[1, 2]`.

## Built-in Themes (Marp Core)

Marp Core provides three themes: `default`, `gaia`, and `uncover`. Each supports the `invert` class for a dark variant and `lead` class for centered title slides (gaia only has `gaia` class for an alternative color scheme).

```markdown
---
marp: true
theme: gaia
class: lead
---

# Title Slide

---
<!-- _class: invert -->

# Dark variant
```

## Workflow

When generating a Marp slide deck:

1. Start with front-matter: `marp: true`, theme, and any global directives
2. Write slide content separated by `---`
3. Add a `<style>` block for custom styling if needed
4. Use directives (HTML comments) for per-slide configuration
5. Save as `.md` and output to `/mnt/user-data/outputs/`

Always produce a complete, ready-to-render `.md` file. The user can open it in VS Code with Marp extension, or convert via `npx @marp-team/marp-cli slide-deck.md`.

## Reference Files

For detailed syntax on specific topics, read:

- `references/DIRECTIVES.md` — Full directive reference with all scoping rules
- `references/IMAGE_SYNTAX.md` — Complete image resizing, filters, backgrounds, and split layouts
- `references/THEME_CSS.md` — Creating custom themes, slide sizing, pagination, headers/footers
