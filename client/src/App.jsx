import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./routes";
import { useAuthStore } from "./store/authStore";
import { queryClient } from "./lib/queryClient";
import { useEffect } from "react";

const App = () => {
  const initializeSocket = useAuthStore((state) => state.initializeSocket);

  useEffect(() => {
    initializeSocket();
  }, [initializeSocket]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
