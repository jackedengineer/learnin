/** Minimal in-memory R2 stand-in for Node tests (only the methods the API uses). */
type Obj = { body: Uint8Array; contentType?: string };

async function toBytes(
  value: ReadableStream | ArrayBuffer | Uint8Array | string,
): Promise<Uint8Array> {
  if (typeof value === "string") return new TextEncoder().encode(value);
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return new Uint8Array(await new Response(value).arrayBuffer());
}

export function createFakeR2() {
  const store = new Map<string, Obj>();
  const bucket = {
    store,
    async put(
      key: string,
      value: ReadableStream | ArrayBuffer | Uint8Array | string,
      opts?: { httpMetadata?: { contentType?: string } },
    ) {
      store.set(key, { body: await toBytes(value), contentType: opts?.httpMetadata?.contentType });
      return { key };
    },
    async head(key: string) {
      const o = store.get(key);
      return o ? { key, size: o.body.byteLength } : null;
    },
    async get(key: string, opts?: { range?: { offset: number; length: number } }) {
      const o = store.get(key);
      if (!o) return null;
      const slice = opts?.range
        ? o.body.slice(opts.range.offset, opts.range.offset + opts.range.length)
        : o.body;
      return {
        key,
        size: o.body.byteLength,
        arrayBuffer: async () =>
          slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength),
      };
    },
    async delete(keys: string | string[]) {
      for (const k of Array.isArray(keys) ? keys : [keys]) store.delete(k);
    },
    async list(opts: { prefix?: string }) {
      const objects = [...store.keys()]
        .filter((k) => k.startsWith(opts.prefix ?? ""))
        .map((key) => ({ key }));
      return { objects, truncated: false, cursor: undefined };
    },
  };
  return bucket;
}
