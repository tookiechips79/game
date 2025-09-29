import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-[#F97316]">404</h1>
        <p className="text-xl text-gray-300 mb-8">Oops! Page not found</p>
        <p className="text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button className="bg-[#F97316] hover:bg-[#FBBF24] text-black font-bold">
            <Home className="h-4 w-4 mr-2" />
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
