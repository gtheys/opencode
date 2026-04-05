# Marpit Image Syntax Reference

## Table of Contents
1. [Overview](#overview)
2. [Resizing Images](#resizing-images)
3. [Image Filters](#image-filters)
4. [Slide Backgrounds](#slide-backgrounds)
5. [Background Size](#background-size)
6. [Background Color](#background-color)
7. [Advanced Backgrounds (Inline SVG)](#advanced-backgrounds)
8. [Multiple Backgrounds](#multiple-backgrounds)
9. [Split Backgrounds](#split-backgrounds)
10. [Feature Availability Matrix](#feature-availability-matrix)

---

## Overview

Marpit extends standard Markdown image syntax `![alt](url)` by recognizing **keywords in the alt text**. After keywords are extracted, remaining alt text becomes the image's `alt` attribute (inline images) or `<figcaption>` (background images).

```markdown
![My photo w:300](photo.jpg)
<!-- Renders with alt="My photo", width 300px -->
```

---

## Resizing Images

### Width and height keywords

```markdown
![width:200px](image.jpg)
![height:300px](image.jpg)
![width:200px height:300px](image.jpg)
```

### Shorthand

```markdown
![w:200 h:300](image.jpg)
![w:32 h:32](icon.png)
```

When no unit is given, `px` is assumed.

### Allowed units

Inline images: `auto` keyword and CSS absolute length units (`px`, `cm`, `mm`, `in`, `pt`, `pc`, `em`, `rem`).

**Not allowed**: viewport-relative units (`vw`, `vh`, `vmin`, `vmax`) — to ensure immutable render results.

### Percentage resizing (backgrounds only)

Percentage values work only for background images, not inline images.

```markdown
![bg 80%](image.jpg)
```

---

## Image Filters

Apply CSS filter functions via keywords in the alt text. Format: `filter-name:value` or just `filter-name` for defaults.

| Filter | Syntax | Default |
|---|---|---|
| `blur` | `blur:10px` | `blur:10px` |
| `brightness` | `brightness:1.5` | `brightness:1.5` |
| `contrast` | `contrast:200%` | `contrast:200%` |
| `drop-shadow` | `drop-shadow:0,5px,10px,black` | (params required) |
| `grayscale` | `grayscale:100%` | `grayscale:100%` |
| `hue-rotate` | `hue-rotate:90deg` | `hue-rotate:90deg` |
| `invert` | `invert:100%` | `invert:100%` |
| `opacity` | `opacity:50%` | `opacity:50%` |
| `saturate` | `saturate:200%` | `saturate:200%` |
| `sepia` | `sepia:100%` | `sepia:100%` |

### Combining filters

```markdown
![brightness:0.8 sepia:50%](photo.jpg)
![blur:3px opacity:80%](background.jpg)
```

### Filters with backgrounds

Filters work with both inline images and background images:

```markdown
![bg blur:5px](background.jpg)
![bg brightness:0.6 contrast:1.2](hero.jpg)
```

---

## Slide Backgrounds

Add the `bg` keyword to make an image a slide background instead of inline content:

```markdown
![bg](https://example.com/background.jpg)
```

When `bg` is present, the image is removed from the content flow and applied as the slide's background.

### Basic vs. Advanced mode

- **Basic mode** (no inline SVG): Uses CSS `background-image`. Only the last `![bg]` in a slide is shown. No multiple backgrounds or split layouts.
- **Advanced mode** (inline SVG enabled — default in Marp Core): Supports multiple backgrounds, split layouts, and per-image filters.

---

## Background Size

Control how the background image fills the slide. Keywords follow CSS `background-size`:

| Keyword | Effect |
|---|---|
| `cover` | Scale to fill entire slide (default) |
| `contain` | Scale to fit within slide |
| `fit` | Alias for `contain` (Deckset compatibility) |
| `auto` | Use original image size |
| `N%` | Scale by percentage |

```markdown
![bg cover](image.jpg)
![bg contain](diagram.png)
![bg auto](small-logo.png)
![bg 50%](image.jpg)
```

You can also use `w:` and `h:` keywords with backgrounds (works in inline SVG mode):

```markdown
![bg w:500px](image.jpg)
```

---

## Background Color

Pass a CSS color value as the URL to set a background color:

```markdown
![bg](#ff6347)
![bg](rebeccapurple)
![bg](<rgb(255,128,0)>)
```

This is equivalent to the `_backgroundColor` spot directive.

---

## Advanced Backgrounds

Advanced backgrounds require inline SVG mode (enabled by default in Marp Core). They create isolated SVG layers for each background, enabling features that CSS backgrounds alone cannot provide.

---

## Multiple Backgrounds

Define multiple `![bg]` images on the same slide to tile them side-by-side:

```markdown
![bg](image1.jpg)
![bg](image2.jpg)
![bg](image3.jpg)
```

By default, images are arranged **horizontally**. Add the `vertical` keyword to stack them vertically:

```markdown
![bg vertical](image1.jpg)
![bg](image2.jpg)
![bg](image3.jpg)
```

Note: Only the first `![bg]` needs the `vertical` keyword — it sets the direction for all backgrounds on that slide.

---

## Split Backgrounds

Use `left` or `right` keywords with `bg` to split the slide between content and a background image:

```markdown
![bg left](photo.jpg)

# Content appears on the right
```

```markdown
![bg right](chart.png)

# Content appears on the left
```

### Custom split ratio

Specify the background's share as a percentage:

```markdown
![bg left:33%](photo.jpg)

# Content takes up 67% of the slide width
```

### Split + Multiple backgrounds

Multiple backgrounds work within the split region:

```markdown
![bg right](image1.jpg)
![bg](image2.jpg)

# Content on the left
# Background area on the right has two images tiled
```

If both `left` and `right` keywords appear in the same slide's backgrounds, the **last defined** keyword wins.

---

## Feature Availability Matrix

| Feature | Inline Image | Basic Background | Advanced Background (SVG) |
|---|---|---|---|
| Resize by length (`w:`, `h:`) | ✅ | ✅ | ✅ |
| Resize by percentage | ❌ | ✅ | ✅ |
| CSS Filters | ✅ | ❌ | ✅ |
| Background color | — | ✅ | ✅ |
| Multiple backgrounds | — | ❌ | ✅ |
| Split backgrounds | — | ❌ | ✅ |
