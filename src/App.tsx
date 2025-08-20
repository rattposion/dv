import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InventarioProvider } from "./contexts/InventarioContext";
import { HistoricoProvider } from "./contexts/HistoricoContext";
import { EstoqueProvider } from "./contexts/EstoqueContext";
import { ResetProvider } from "./contexts/ResetContext";
import { FuncionarioProvider } from "./contexts/FuncionarioContext";
import { EquipamentoProvider } from "./contexts/EquipamentoContext";
import { ManutencaoProvider } from "./contexts/ManutencaoContext";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Funcionarios from "./pages/Funcionarios";
import Equipamentos from "./pages/Equipamentos";
import Inventario from "./pages/Inventario";
import Saida from "./pages/Saida";
import Producao from "./pages/Producao";
import Relatorios from "./pages/Relatorios";
import Manutencoes from "./pages/Manutencoes";
import Recebimentos from "./pages/Recebimentos";
import Defeitos from "./pages/Defeitos";
import RMA from "./pages/RMA";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <EstoqueProvider>
        <ResetProvider>
          <InventarioProvider>
            <HistoricoProvider>
              <FuncionarioProvider>
                <EquipamentoProvider>
                  <ManutencaoProvider>
                    <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/funcionarios" element={<Funcionarios />} />
                        <Route path="/equipamentos" element={<Equipamentos />} />
                        <Route path="/inventario" element={<Inventario />} />
                        <Route path="/recebimentos" element={<Recebimentos />} />
                        <Route path="/defeitos" element={<Defeitos />} />
                        <Route path="/saida" element={<Saida />} />
                        <Route path="/producao" element={<Producao />} />
                        <Route path="/manutencoes" element={<Manutencoes />} />
                        <Route path="/rma" element={<RMA />} />
                        <Route path="/relatorios" element={<Relatorios />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                    </TooltipProvider>
                  </ManutencaoProvider>
                </EquipamentoProvider>
              </FuncionarioProvider>
            </HistoricoProvider>
          </InventarioProvider>
        </ResetProvider>
      </EstoqueProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
