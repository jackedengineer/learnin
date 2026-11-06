import { ApiProblemError, unwrap } from "@doubtless/api-client";
import type { Me } from "@doubtless/schemas";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { api } from "./lib/api.ts";
import { keys } from "./lib/queries.ts";
import { AppShell } from "./routes/AppShell.tsx";
import { NotebookPage } from "./routes/NotebookPage.tsx";
import { NotebooksPage } from "./routes/NotebooksPage.tsx";
import { NotFound } from "./routes/NotFound.tsx";
import { SignInPage } from "./routes/SignInPage.tsx";
import { WelcomePage } from "./routes/WelcomePage.tsx";

type RouterContext = { queryClient: QueryClient };

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  notFoundComponent: NotFound,
});

/** Resolve the session once; null = signed out. */
async function loadMe(qc: QueryClient): Promise<Me | null> {
  try {
    return await qc.ensureQueryData({
      queryKey: keys.me,
      queryFn: async () => unwrap<Me>(await api.v1.me.$get()),
    });
  } catch (e) {
    if (e instanceof ApiProblemError && e.status === 401) return null;
    throw e;
  }
}

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in",
  beforeLoad: async ({ context }) => {
    if (await loadMe(context.queryClient)) throw redirect({ to: "/" });
  },
  component: SignInPage,
});

const authedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "authed",
  beforeLoad: async ({ context, location }) => {
    const me = await loadMe(context.queryClient);
    if (!me) throw redirect({ to: "/sign-in" });
    if (!me.profile.isOnboarded && location.pathname !== "/welcome")
      throw redirect({ to: "/welcome" });
    return { me };
  },
  component: AppShell,
});

const notebooksRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/",
  component: NotebooksPage,
});
const welcomeRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/welcome",
  component: WelcomePage,
});
export const notebookRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/notebooks/$notebookId",
  component: NotebookPage,
});

const routeTree = rootRoute.addChildren([
  signInRoute,
  authedRoute.addChildren([notebooksRoute, welcomeRoute, notebookRoute]),
]);

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({ routeTree, context: { queryClient }, defaultPreload: "intent" });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
