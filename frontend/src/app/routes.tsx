import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { PermissionRoute } from "./components/PermissionRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Clients from "./pages/Clients";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, element: <PermissionRoute permission="view_pos"><POS /></PermissionRoute> },
          {
            path: "products",
            element: <PermissionRoute permission="view_products"><Products /></PermissionRoute>,
          },
          {
            path: "clients",
            element: <PermissionRoute permission="view_clients"><Clients /></PermissionRoute>,
          },
          { path: "sales", element: <PermissionRoute permission="view_sales"><Sales /></PermissionRoute> },
          {
            path: "purchases",
            element: <PermissionRoute permission="view_purchases"><Purchases /></PermissionRoute>,
          },
          { path: "admin", Component: Admin },
        ],
      },
    ],
  },
]);
