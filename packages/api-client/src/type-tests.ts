/**
 * Compile-time contract tests: fail `tsc` if the typed client degrades to `any`
 * (e.g. if the API's emitted declarations stop resolving).
 */
import type { Notebook, Source } from "@doubtless/schemas";
import type { ApiClient } from "./index.ts";

type IsAny<T> = 0 extends 1 & T ? true : false;
type Expect<T extends true> = T;
type Equal<A, B> =
  (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false;

type ListRes = Awaited<
  ReturnType<Awaited<ReturnType<ApiClient["v1"]["notebooks"]["$get"]>>["json"]>
>;
type CreateSourceInput = Parameters<
  ApiClient["v1"]["notebooks"][":notebookId"]["sources"]["$post"]
>[0]["json"];
type SourceRes = Awaited<
  ReturnType<Awaited<ReturnType<ApiClient["v1"]["sources"][":id"]["$get"]>>["json"]>
>;

export type _tests = [
  Expect<Equal<IsAny<ApiClient>, false>>,
  Expect<Equal<IsAny<ListRes>, false>>,
  Expect<Equal<Extract<ListRes, { data: unknown }>["data"][number]["id"], Notebook["id"]>>,
  Expect<Equal<Extract<CreateSourceInput, { type: "url" }>["url"], string>>,
  Expect<Equal<Extract<SourceRes, { kind: unknown }>["kind"], Source["kind"]>>,
];
