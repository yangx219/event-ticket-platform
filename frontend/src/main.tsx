import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AuthProvider } from "react-oidc-context";
import { createBrowserRouter, RouterProvider } from "react-router";

const AttendeeLandingPage = lazy(() => import("./pages/attendee-landing-page.tsx"));
const OrganizersLandingPage = lazy(() => import("./pages/organizers-landing-page.tsx"));
const DashboardManageEventPage = lazy(() => import("./pages/dashboard-manage-event-page.tsx"));
const LoginPage = lazy(() => import("./pages/login-page.tsx"));
const ProtectedRoute = lazy(() => import("./components/protected-route.tsx"));
const CallbackPage = lazy(() => import("./pages/callback-page.tsx"));
const DashboardListEventsPage = lazy(() => import("./pages/dashboard-list-events-page.tsx"));
const PublishedEventsPage = lazy(() => import("./pages/published-events-page.tsx"));
const PurchaseTicketPage = lazy(() => import("./pages/purchase-ticket-page.tsx"));
const DashboardListTickets = lazy(() => import("./pages/dashboard-list-tickets.tsx"));
const DashboardPage = lazy(() => import("./pages/dashboard-page.tsx"));
const DashboardViewTicketPage = lazy(() => import("./pages/dashboard-view-ticket-page.tsx"));
const DashboardValidateQrPage = lazy(() => import("./pages/dashboard-validate-qr-page.tsx"));
const DashboardListOrdersPage = lazy(() => import("./pages/dashboard-list-orders-page.tsx"));

const router = createBrowserRouter([
  {
    path: "/",
    Component: AttendeeLandingPage,
  },
  {
    path: "/callback",
    Component: CallbackPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/events/:id",
    Component: PublishedEventsPage,
  },
  {
    path: "/events/:eventId/purchase/:ticketTypeId",
    element: (
      <ProtectedRoute>
        <PurchaseTicketPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/organizers",
    Component: OrganizersLandingPage,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/events",
    element: (
      <ProtectedRoute>
        <DashboardListEventsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/orders",
    element: (
      <ProtectedRoute>
        <DashboardListOrdersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/tickets",
    element: (
      <ProtectedRoute>
        <DashboardListTickets />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/tickets/:id",
    element: (
      <ProtectedRoute>
        <DashboardViewTicketPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/validate-qr",
    element: (
      <ProtectedRoute>
        <DashboardValidateQrPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/events/create",
    element: (
      <ProtectedRoute>
        <DashboardManageEventPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/events/update/:id",
    element: (
      <ProtectedRoute>
        <DashboardManageEventPage />
      </ProtectedRoute>
    ),
  },
]);

const oidcConfig = {
  authority: "http://localhost:9090/realms/event-ticket-platform",
  client_id: "event-ticket-platform-app",
  redirect_uri: "http://localhost:5173/callback",
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black text-white">Loading EventPilot...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  </StrictMode>,
);
