import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ProductsPage } from "./pages/ProductsPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrdersPage } from "./pages/OrdersPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ProfilePage } from "./pages/ProfilePage";
import { OffersPage } from "./pages/OffersPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: LoginPage },
      { path: "signup", Component: SignupPage },
      { path: "products", Component: ProductsPage },
      { path: "cart", Component: CartPage },
      { path: "checkout", Component: CheckoutPage },
      { path: "orders", Component: OrdersPage },
      { path: "profile", Component: ProfilePage },
      { path: "offers", Component: OffersPage },
      { path: "admin", Component: AdminDashboard },
      { path: "auth/callback", Component: AuthCallbackPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
