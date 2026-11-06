import { newIdempotencyKey, unwrap } from "@doubtless/api-client";
import type {
  CreateNotebookInput,
  CreateSourceInput,
  Me,
  Notebook,
  Source,
  UpdateNotebookInput,
  UpdateProfileInput,
  UpdateSourceInput,
} from "@doubtless/schemas";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api.ts";

export const keys = {
  me: ["me"] as const,
  notebooks: ["notebooks"] as const,
  notebook: (id: string) => ["notebooks", id] as const,
  sources: (notebookId: string) => ["notebooks", notebookId, "sources"] as const,
};

export const useMe = () =>
  useQuery({
    queryKey: keys.me,
    queryFn: async () => unwrap<Me>(await api.v1.me.$get()),
    retry: false,
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (json: UpdateProfileInput) =>
      unwrap(await api.v1.me.profile.$patch({ json })),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.me }),
  });
};

export const useNotebooks = () =>
  useInfiniteQuery({
    queryKey: keys.notebooks,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrap<{ data: Notebook[]; nextCursor: string | null }>(
        await api.v1.notebooks.$get({ query: { limit: "20", cursor: pageParam } }),
      ),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

export const useNotebook = (id: string) =>
  useQuery({
    queryKey: keys.notebook(id),
    queryFn: async () => unwrap<Notebook>(await api.v1.notebooks[":id"].$get({ param: { id } })),
  });

export const useCreateNotebook = () => {
  const qc = useQueryClient();
  return useMutation({
    // One idempotency key per user intent: TanStack retries reuse the same variables.
    mutationFn: async ({ json, key }: { json: CreateNotebookInput; key: string }) =>
      unwrap<Notebook>(await api.v1.notebooks.$post({ json, header: { "idempotency-key": key } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notebooks }),
  });
};

export const useUpdateNotebook = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (json: UpdateNotebookInput) =>
      unwrap<Notebook>(await api.v1.notebooks[":id"].$patch({ param: { id }, json })),
    onSuccess: (nb) => {
      qc.setQueryData(keys.notebook(id), nb);
      qc.invalidateQueries({ queryKey: keys.notebooks });
    },
  });
};

export const useDeleteNotebook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap<undefined>(await api.v1.notebooks[":id"].$delete({ param: { id } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notebooks }),
  });
};

type SourcePage = { data: Source[]; nextCursor: string | null };

/** All sources of a notebook (a notebook holds at most a few hundred), fetched page by page. */
export const useSources = (notebookId: string) =>
  useQuery({
    queryKey: keys.sources(notebookId),
    queryFn: async (): Promise<SourcePage> => {
      const data: Source[] = [];
      let cursor: string | undefined;
      for (let i = 0; i < 20; i++) {
        const page = await unwrap<SourcePage>(
          await api.v1.notebooks[":notebookId"].sources.$get({
            param: { notebookId },
            query: { limit: "100", cursor },
          }),
        );
        data.push(...page.data);
        if (!page.nextCursor) break;
        cursor = page.nextCursor;
      }
      return { data, nextCursor: null };
    },
  });

export const useCreateSource = (notebookId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ json, key }: { json: CreateSourceInput; key: string }) =>
      unwrap<Source>(
        await api.v1.notebooks[":notebookId"].sources.$post({
          param: { notebookId },
          json,
          header: { "idempotency-key": key },
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.sources(notebookId) }),
  });
};

export const useUpdateSource = (notebookId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, json }: { id: string; json: UpdateSourceInput }) =>
      unwrap<Source>(await api.v1.sources[":id"].$patch({ param: { id }, json })),
    // Optimistic toggle so checkboxes feel instant; roll back on error.
    onMutate: async ({ id, json }) => {
      await qc.cancelQueries({ queryKey: keys.sources(notebookId) });
      const prev = qc.getQueryData<{ data: Source[]; nextCursor: string | null }>(
        keys.sources(notebookId),
      );
      if (prev) {
        qc.setQueryData(keys.sources(notebookId), {
          ...prev,
          data: prev.data.map((s) => (s.id === id ? { ...s, ...json } : s)),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(keys.sources(notebookId), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.sources(notebookId) }),
  });
};

export const useDeleteSource = (notebookId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap<undefined>(await api.v1.sources[":id"].$delete({ param: { id } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.sources(notebookId) }),
  });
};

export { newIdempotencyKey };
