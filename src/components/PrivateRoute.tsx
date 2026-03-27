import { Navigate, Outlet } from "react-router-dom";
import { useApp } from "@/context/AppContext";

export default function PrivateRoute() {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
