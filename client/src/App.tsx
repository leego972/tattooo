import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages (no auth required)
import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SharedDesign from "./pages/SharedDesign";
import PaymentSuccess from "./pages/PaymentSuccess";
import ArtistSignup from "./pages/ArtistSignup";

// Protected pages (require login)
import Studio from "./pages/Studio";
import Gallery from "./pages/Gallery";
import History from "./pages/History";
import MyTatts from "./pages/MyTatts";
import DrawingBoard from "./pages/DrawingBoard";
import Pricing from "./pages/Pricing";
import Artists from "./pages/Artists";
import ArtistProfile from "./pages/ArtistProfile";
import Admin from "./pages/Admin";
import Referral from "./pages/Referral";
import Bookings from "./pages/Bookings";
import Outreach from "./pages/Outreach";
import AdvertisingDashboard from "./pages/AdvertisingDashboard";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import Subscription from "./pages/Subscription";
import AdminPromos from "./pages/AdminPromos";
import Credits from "./pages/Credits";
import MailingList from "./pages/MailingList";
import ArtistDashboard from "./pages/ArtistDashboard";
import MyBookings from "./pages/MyBookings";
import BlogPage from "./pages/BlogPage";
import BlogAdmin from "./pages/BlogAdmin";
import SeoDashboard from "./pages/SeoDashboard";
import ContentCreatorPage from "./pages/ContentCreatorPage";
import MarketingPage from "./pages/MarketingPage";
import TermsPage from "./pages/TermsPage";
import AccountSettings from "./pages/AccountSettings";

import Navbar from "./components/Navbar";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Navbar renders as sidebar on desktop, top bar on mobile */}
      <Navbar />
      {/* Main content area — takes remaining width beside sidebar */}
      <main className="flex-1 min-w-0 flex flex-col">
        <Switch>
          {/* ── Public routes (no auth required) ─────────────────── */}
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Login} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/share" component={SharedDesign} />
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route path="/artist-signup/success" component={ArtistSignup} />
          <Route path="/artist-signup" component={ArtistSignup} />

          {/* ── Home / landing — public so visitors can browse before signing up ── */}
          <Route path="/" component={Home} />

          {/* ── Protected routes (require login) ────────────────── */}
          <Route path="/studio">
            {() => <ProtectedRoute component={Studio} />}
          </Route>
          <Route path="/gallery">
            {() => <ProtectedRoute component={Gallery} />}
          </Route>
          <Route path="/history">
            {() => <ProtectedRoute component={History} />}
          </Route>
          <Route path="/my-tatts">
            {() => <ProtectedRoute component={MyTatts} />}
          </Route>
          <Route path="/draw">
            {() => <ProtectedRoute component={DrawingBoard} />}
          </Route>
          <Route path="/pricing" component={Pricing} />
          <Route path="/artists/:id" component={ArtistProfile} />
          <Route path="/artists" component={Artists} />
          <Route path="/referral">
            {() => <ProtectedRoute component={Referral} />}
          </Route>
          <Route path="/bookings">
            {() => <ProtectedRoute component={Bookings} />}
          </Route>
          <Route path="/subscription">
            {() => <ProtectedRoute component={Subscription} />}
          </Route>
          <Route path="/credits">
            {() => <ProtectedRoute component={Credits} />}
          </Route>
          <Route path="/admin/promos">
            {() => <ProtectedRoute component={AdminPromos} />}
          </Route>
          <Route path="/admin">
            {() => <ProtectedRoute component={Admin} />}
          </Route>
          <Route path="/outreach">
            {() => <ProtectedRoute component={Outreach} />}
          </Route>
          <Route path="/mailing-list">
            {() => <ProtectedRoute component={MailingList} />}
          </Route>
          <Route path="/advertising">
            {() => <ProtectedRoute component={AdvertisingDashboard} />}
          </Route>
          <Route path="/affiliates">
            {() => <ProtectedRoute component={AffiliateDashboard} />}
          </Route>
          <Route path="/artist-dashboard">
            {() => <ProtectedRoute component={ArtistDashboard} />}
          </Route>
          <Route path="/my-bookings">
            {() => <ProtectedRoute component={MyBookings} />}
          </Route>
          {/* ── Public content routes ──────────────────────────────────── */}
          <Route path="/blog" component={BlogPage} />
          <Route path="/terms" component={TermsPage} />
          {/* ── Protected user & admin routes ─────────────────────────── */}
          <Route path="/settings">
            {() => <ProtectedRoute component={AccountSettings} />}
          </Route>
          <Route path="/admin/blog">
            {() => <ProtectedRoute component={BlogAdmin} />}
          </Route>
          <Route path="/admin/seo">
            {() => <ProtectedRoute component={SeoDashboard} />}
          </Route>
          <Route path="/admin/content">
            {() => <ProtectedRoute component={ContentCreatorPage} />}
          </Route>
          <Route path="/admin/marketing">
            {() => <ProtectedRoute component={MarketingPage} />}
          </Route>

          {/* ── Fallback ──────────────────────────────────────────── */}
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.10 0.008 20)",
                border: "1px solid oklch(0.22 0.010 20)",
                color: "oklch(0.92 0.008 60)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
