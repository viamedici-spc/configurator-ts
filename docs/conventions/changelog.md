# Changelog Convention

This convention defines changelog creation for the **Configurator TS** library (a JavaScript/TypeScript package).

The changelog uses a fixed heading structure so release notes are consistent across versions.

Notes:

- Level 1 headings (`#`) are reserved for sections: New Features, Improvements, Changes, Fixes.
- Level 2 headings (`##`) are used for concrete items under each section (feature titles or grouped entries).
- New Features use short paragraphs under `##` headings; Improvements, Changes, and Fixes are bullet lists under their
  `##` headings.
- Target audience: configurator application developers using the Smart Product Configuration (SPC) plattform to
  implement a product configurator. Avoid overly technical or internal-only details.

Template:

```md
# New Features

## Example Feature 1

Short paragraph describing the change and why it matters to developers.

## Example Feature 2

Short paragraph describing the change.

# Improvements

- **Short summary:** Longer description of the improvement.
- **Short summary:** Longer description of the improvement.

# Changes

- **Short summary:** Longer description of the change.
- **Short summary:** Longer description of the change.

# Fixes

- **Short summary:** Longer description of the fix.
- **Short summary:** Longer description of the fix.
```
