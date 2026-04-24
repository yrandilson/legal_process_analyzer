import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import LoginPage from "./pages/Login";
import UploadPage from "./pages/Upload";
import DashboardPage from "./pages/Dashboard";
import ProcessDetailsPage from "./pages/ProcessDetails";
import { LegalChatBot } from "./components/LegalChatBot";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Rotas públicas */}
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={LoginPage} />

      {/* Rotas protegidas */}
      {isAuthenticated ? (
        <>
          <Route path={"/dashboard"}>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </Route>

          <Route path={"/upload"}>
            <DashboardLayout>
              <UploadPage />
            </DashboardLayout>
          </Route>

          <Route path={"/processo/:id"}>
            {({ id }) => (
              <DashboardLayout>
                <ProcessDetailsPage processId={parseInt(id)} />
              </DashboardLayout>
            )}
          </Route>
        </>
      ) : (
        // Se tentar acessar rota protegida sem autenticação, vai para login
        <>
          <Route path={"/dashboard"} component={LoginPage} />
          <Route path={"/upload"} component={LoginPage} />
          <Route path={"/processo/:id"} component={LoginPage} />
        </>
      )}

      {/* Rotas de erro */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <LegalChatBot />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
