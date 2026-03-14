import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Studio from "./pages/Studio";
import Gallery from "./pages/Gallery";
import History from "./pages/History";
import MyTatts from "./pages/MyTatts";
import DrawingBoard from "./pages/DrawingBoard";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Navbar renders as sidebar on desktop, top bar on mobile */}
      <Navbar />
      {/* Main content area — takes remaining width beside sidebar */}
      <main className="flex-1 min-w-0 flex flex-col">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/studio" component={Studio} />
          <Route path="/gallery" component={Gallery} />
          <Route path="/history" component={History} />
          <Route path="/my-tatts" component={MyTatts} />
          <Route path="/draw" component={DrawingBoard} />
          <Route path="/login" component={Login} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/payment-success" component={PaymentSuccess} />
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
                background: "oklch(0.10 0.008 250)",
                border: "1px solid oklch(0.20 0.01 250)",
                color: "oklch(0.93 0.005 250)",
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
