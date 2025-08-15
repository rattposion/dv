import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OverviewSection } from "@/components/dashboard/OverviewSection";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, UserPlus } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Sistema de Gestão Industrial
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Gerencie equipamentos, funcionários, estoque e muito mais de forma eficiente.
          </p>
          
          <Card className="shadow-xl border-border/50">
            <CardHeader>
              <CardTitle>Bem-vindo!</CardTitle>
              <CardDescription>
                Para acessar o sistema, faça login ou crie uma nova conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild className="h-12">
                  <Link to="/auth">
                    <LogIn className="mr-2 h-4 w-4" />
                    Fazer Login
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-12">
                  <Link to="/auth">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Conta
                  </Link>
                </Button>
              </div>
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
