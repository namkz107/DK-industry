import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"

export function RequireStaff() {
  const { user } = useAuth()
  if (user?.role === "staff") return <Outlet/>
  if (user?.role === "admin") return <Navigate to="/admin" replace/>
  return <Navigate to="/tai-khoan" replace/>
}
