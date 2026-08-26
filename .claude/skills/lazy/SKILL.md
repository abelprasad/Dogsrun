---
name: lazy
description: Lazy dev philosophy. The CodeGraph index exists but the CLI isn't installed. Climb the YAGNI ladder before writing anything.
---

# Ponytail: Build Minimally

The `.codegraph/` index exists but the CLI isn't installed. Use grep and read to understand the code, then climb the ladder before building.

## The Ladder

Before writing code, climb it. Stop at the first rung that holds:

1. Does this need to exist? → Skip it
2. Already in this codebase? → Reuse it
3. Stdlib does it? → Use it
4. Native platform feature? → Use it
5. Installed dependency? → Use it
6. One line? → One line
7. Write the minimum that works

**Error handling, validation, security, accessibility never get cut.**

## Example: Request Logger

Task: "Log every API request."

- **Rung 1:** Does it need to exist? The existing code already logs to `winston`. Skip building a new logger.
- **Rung 2:** Already here? Yes. `import { logger } from './services/logging'` and use `logger.info()` in the route handler.
- Done. One line. Don't build a wrapper, a middleware abstraction, a config object, or a "future-proof" transport layer.

Task: "Color picker for the form."

- **Rung 1-4:** Nothing skips it, stdlib/native don't have it, it's not built.
- **Rung 5:** Is it a dependency? No.
- **Rung 7:** One line: `<input type="color">`. Ship that. Don't reach for a 287-line component library.

## When You Must Write

The minimum means necessary, not abbreviated. If validation is required, include it. If there's an error path, handle it. Don't golf it down. Don't omit error handling to reach "one line."

Every line you don't write is a line you don't debug, test, or maintain.


