// Route registry: the only source of truth for routes the agent can suggest.
// The LLM never generates URLs — it picks from this predefined set. Each route
// has a builder function that resolves dynamic segments from context.

import type { NavigationAction } from "./types";

// A route definition: a builder that produces the final route string, plus
// metadata describing what the route is for (used for LLM tool descriptions).
export type RouteDefinition = {
  id: string;
  label: string;
  description: string;
  /** Builds the route path. Receives the agent context for dynamic segments. */
  build: (ctx: RouteContext) => string;
};

// Context passed to route builders: user identity and their accessible accounts.
type RouteContext = {
  account: string;
  accounts: { account: string; role: string }[];
  agentSlug?: string;
};

// Helper to build an account-scoped route path. Centralizes the pattern
// to avoid template literal encoding issues across the registry.
function accountRoute(ctx: RouteContext, segment: string): string {
  return "/accounts/" + ctx.account.toLowerCase() + "/" + segment;
}

// The complete registry of navigable routes. The agent can ONLY suggest
// routes from this list — no arbitrary URL generation is possible.
export const ROUTE_REGISTRY: RouteDefinition[] = [
  {
    id: "dashboard",
    label: "Open Dashboard",
    description: "The main dashboard showing QA metrics and account summaries",
    build: () => "/dashboard",
  },
  {
    id: "evaluations",
    label: "View Evaluations",
    description: "The evaluations list for the user's primary account",
    build: (ctx) => accountRoute(ctx, "roster"),
  },
  {
    id: "team-analytics",
    label: "View Team Analytics",
    description: "Team performance charts and rankings for an account",
    build: (ctx) => accountRoute(ctx, "analytics"),
  },
  {
    id: "assignments",
    label: "View Assignments",
    description: "Agent assignment management for an account",
    build: (ctx) => accountRoute(ctx, "assignments"),
  },
  {
    id: "account-dashboard",
    label: "View Account Dashboard",
    description: "The account overview page",
    build: (ctx) => accountRoute(ctx, "dashboard"),
  },
  {
    id: "coaching-insights",
    label: "View Coaching Insights",
    description: "Coaching recommendations and insights",
    build: () => "/coaching-insights",
  },
  {
    id: "settings",
    label: "Open Settings",
    description: "User settings and preferences",
    build: () => "/settings",
  },
  {
    id: "agent-detail",
    label: "View Agent Details",
    description: "Detailed evaluation history for a specific agent",
    build: (ctx) => {
      const slug = ctx.agentSlug ?? "agent";
      return accountRoute(ctx, "roster/" + slug);
    },
  },
];

// Resolves a route action from a route ID and context. Returns null if the
// route ID is not in the registry — this is a hard security boundary.
export function resolveRouteAction(
  routeId: string,
  ctx: RouteContext
): NavigationAction | null {
  const route = ROUTE_REGISTRY.find((r) => r.id === routeId);
  if (!route) return null;

  return {
    type: "navigation",
    label: route.label,
    route: route.build(ctx),
    description: route.description,
  };
}

// Returns a description of all available routes for the LLM to choose from.
// Used in the navigation tool's system context injection.
export function getRouteDescriptions(): string {
  return ROUTE_REGISTRY.map(
    (r) => "- " + r.id + ": " + r.label + " (" + r.description + ")"
  ).join("\n");
}
