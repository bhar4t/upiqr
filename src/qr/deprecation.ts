let warned = false

/** Emits a one-time console warning when the deprecated async default export is used. */
export function warnDeprecatedAsyncDefault(): void {
    if (warned) return
    warned = true
    // eslint-disable-next-line no-console
    console.warn(
        '[upiqr] The default export (async) is deprecated and will be removed in a future major version. ' +
        'Use `import { upiqrSync } from "upiqr"` instead - it is synchronous and returns the result directly, no Promise required.'
    )
}
