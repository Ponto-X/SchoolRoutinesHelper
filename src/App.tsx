import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import PrivateRoute from "@/components/PrivateRoute";
import AppLayout from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tarefas from "./pages/Tarefas";
import Eventos from "./pages/Eventos";
import Contatos from "./pages/Contatos";
import Faltas from "./pages/Faltas";
import Comunicacao from "./pages/Comunicacao";
import Alunos from "./pages/Alunos";
import Colaboradores from "./pages/Colaboradores";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<PrivateRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/alunos" element={<Alunos />} />
                  <Route path="/colaboradores" element={<Colaboradores />} />
                  <Route path="/tarefas" element={<Tarefas />} />
                  <Route path="/eventos" element={<Eventos />} />
                  <Route path="/contatos" element={<Contatos />} />
                  <Route path="/faltas" element={<Faltas />} />
                  <Route path="/comunicacao" element={<Comunicacao />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}
