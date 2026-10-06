# Shared visual specification

Owner: M1. All members must use this specification.

## Source of truth

The Milestone 2 report, Appendix pages 24–25, supplies the colours

and typography below. These override the earlier approximation

notes in [screen-map.md](http://screen-map.md).

figma-screens.pdf supplies screen layouts.

[screen-map.md](http://screen-map.md) supplies ownership, routes and agreed deviations.

## Colours

| Token | Value | Usage |

|---|---|---|

| primary | #0B2545 | Primary buttons, selected controls, active navigation |

| accent | #F15A24 | Hold timers, grace warnings, expiry alerts |

| text | #1E293B | Headings, labels, body text |

| muted | #64748B | Supporting information and timestamps |

| border | #E2E8F0 | Outlines and dividers |

| background | #F8FAFC | Neutral backgrounds, particularly staff views |

| surface / white | #FFFFFF | Cards, inputs and student page backgrounds |

| success | #16A34A | Positive states |

| danger | #DC2626 | Errors and critical/unavailable states |

Orange is an accent, not the dominant interface colour.

Pair status colours with readable text or icons.

Do not use colour alone to communicate a state.

## Typography

| Level | Report size | Weight |

|---|---|---|

| Page title | 24 | 600 or 700 |

| Section/card heading | 18 | 600 |

| Body | 14–16 | 400 |

| Supporting text | 12–14 | 400 |

| Labels | 12–14 | 500 |

| Session timer | 40–48 | 700 |

Use React Native numeric font sizes; do not manually multiply

them by device pixel density.

The report does not identify the font family. Android's system

font is the current implementation fallback, not a confirmed

match to Figma. Coordinate a custom font change with M1.

Spacing, corner radii and 48-unit minimum control height are

shared implementation choices, not quoted report measurements.

## Shared files

- src/constants/theme.ts

- src/components/ui/AppButton.tsx

- src/components/ui/AppInput.tsx

## Usage

```tsx

import {

  colors,

  fontSize,

  fontWeight,

  radius,

  spacing,

} from '@/constants/theme';

import { AppButton } from '@/components/ui/AppButton';

import { AppInput } from '@/components/ui/AppInput';

```

Button example, inside a screen with the relevant state/handler:

```tsx

<AppButton

  title="Save Group Configuration"

  onPress={saveGroup}

  loading={busy}

  disabled={!isValid}

/>

```

Button variants: primary (default), secondary, danger.

Loading disables the button and displays an indicator.

Input example:

```tsx

<AppInput

  label="Group Title"

  value={name}

  onChangeText={setName}

  error={nameError}

/>

```

Normal TextInput properties are supported, including

secureTextEntry, autoCapitalize, keyboardType and multiline.

## Responsibilities

Screens handle validation, Firebase requests and error messages.

Use try/catch/finally for async operations and reset busy in finally.

The shared controls only display the supplied state.

Keep screen-specific layouts and cards in your feature files.

Coordinate shared-file changes with M1.

Do not create competing themes or copies of these components.

These files do not change navigation or existing screens.

Use them while implementing the assigned Figma screens.