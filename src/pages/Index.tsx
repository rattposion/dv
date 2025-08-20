import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OverviewSection } from "@/components/dashboard/OverviewSection";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, UserPlus, Shield } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="card-natural">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Sistema de Gestão Industrial
              </CardTitle>
              <CardDescription className="text-gray-600">
                Faça login para acessar o sistema de controle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link to="/auth">
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                  </Link>
                </Button>
                <Button variant="outline" asChild className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Link to="/auth">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrar
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Sistema seguro para gestão de equipamentos industriais
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <OverviewSection />
    </DashboardLayout>
  );
};

export default Index;
