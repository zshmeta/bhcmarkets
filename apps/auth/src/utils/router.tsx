import { type ReactNode } from "react";
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { Loader, Page404 } from "@repo/ui";
import { LoginPage } from "../components/Forms/LoginForm";
import { RegisterPage } from "../components/Forms/RegisterForm";
import ForgotPasswordPage from "../components/Forms/ForgotPasswordForm";
import ResetPasswordPage from "../components/Forms/ResetPasswordForm";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Outlet />,
    errorElement: <Page404 videoSrc="/404.mp4" />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
    ],
  },
]);

export function AppRouter({ fallback }: { fallback?: ReactNode }) {
  return <RouterProvider router={router} fallbackElement={fallback ?? <Loader />} />;
}
