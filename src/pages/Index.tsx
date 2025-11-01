import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to game page
    navigate("/game");
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center space-bg">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold glow-primary">Loading...</h1>
        <p className="text-xl text-muted-foreground">Redirecting to game...</p>
      </div>
    </div>
  );
};

export default Index;
