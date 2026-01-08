export const omitUndefined = <T extends Record<string, any>>(obj: T) =>
  Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  ) as {
    [K in keyof T as T[K] extends undefined ? never : K]: Exclude<
      T[K],
      undefined
    >;
  };

/**
 * Utility: omitUndefined
 *
 * Removes keys with undefined values from an object (runtime) and
 * fixes TypeScript types (compile-time) for safe PATCH updates.
 *
 * Why it works:
 * 1. Key remapping (`as T[K] extends undefined ? never : K`)
 *    - Decides if a key should exist at all in the resulting type.
 *    - Any key whose type is purely undefined is removed.
 *
 * 2. Exclude (`Exclude<T[K], undefined>`)
 *    - Cleans the type of the value for keys that remain.
 *    - Removes undefined from unions like `string | undefined`.
 *
 * Together:
 * - Runtime: keys with undefined are gone.
 * - Compile-time: keys exist only if meaningful and never hold undefined.
 * - Perfect for PATCH semantics with Prisma and exactOptionalPropertyTypes.
 *
 * Example:
 * Input:  { title: "Hello", content: undefined, tags: ["a"] }
 * Output: { title: "Hello", tags: ["a"] }
 * Type:   { title?: string; tags?: string[] }
 */
