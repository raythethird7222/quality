// Page: renders the login screen by delegating to the shared LoginPage feature component.
import LoginPage from "@/features/auth/components/LoginPage";

// Thin wrapper that mounts the reusable login UI.
export default function Login() {
  return <LoginPage />;
}
