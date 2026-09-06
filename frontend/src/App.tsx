import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";

// Context
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";

// Auth Pages
import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

// Dashboard Pages
import Dashboard from "@/pages/Index";
import Assets from "@/pages/Assets";
import AssetDetail from "@/pages/assets/AssetDetail";
import AssetCreate from "@/pages/assets/AssetCreate";
import AssetTransfer from "@/pages/assets/AssetTransfer";
import AssetMaintenance from "@/pages/assets/AssetMaintenance";
import AssetDispose from "@/pages/assets/AssetDispose";
import MyAssets from "@/pages/MyAssets";
import Explorer from "@/pages/Explorer";
import AssetHistory from "@/pages/assets/AssetHistory";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import ScanQR from "@/pages/scan/ScanQR";
import PublicAssetView from "@/pages/scan/PublicAssetView";
import NotFound from "@/pages/NotFound";
import Approvals from "@/pages/approvals/Approvals";
import ApprovalDetail from "@/pages/approvals/ApprovalDetail";
import Forbidden from "@/pages/Forbidden";
import Users from "@/pages/Users";
import Import from "@/pages/Import";
import Notifications from "@/pages/Notifications";
import Procurements from "@/pages/procurement/Procurements";
import ProcurementDetail from "@/pages/procurement/ProcurementDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/scan" element={<ScanQR />} />
            <Route path="/asset/:assetId/public" element={<PublicAssetView />} />
            <Route path="/forbidden" element={<Forbidden />} />

            {/* Protected Routes - All authenticated users */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-assets"
              element={
                <ProtectedRoute allowedRoles={['staff','purchasing','user']}>
                  <MyAssets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/procurements"
              element={
                <ProtectedRoute allowedRoles={['purchasing','admin','admin_asset']}>
                  <Procurements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/procurements/:id"
              element={
                <ProtectedRoute allowedRoles={['purchasing','admin','admin_asset']}>
                  <ProcurementDetail />
                </ProtectedRoute>
              }
            />

            {/* Asset Routes - View for all, Edit for Admin */}
            <Route
              path="/assets"
              element={
                <ProtectedRoute>
                  <Assets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets/:assetId"
              element={
                <ProtectedRoute>
                  <AssetDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets/:assetId/history"
              element={
                <ProtectedRoute>
                  <AssetHistory />
                </ProtectedRoute>
              }
            />

            {/* Role-restricted Routes */}
            <Route
              path="/approvals"
              element={
                <ProtectedRoute allowedRoles={['admin','admin_asset','head_unit']}>
                  <Approvals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals/:id"
              element={
                <ProtectedRoute allowedRoles={['admin','admin_asset','head_unit']}>
                  <ApprovalDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets/create"
              element={
                <AdminRoute>
                  <AssetCreate />
                </AdminRoute>
              }
            />
            <Route
              path="/assets/:assetId/transfer"
              element={
                <AdminRoute>
                  <AssetTransfer />
                </AdminRoute>
              }
            />
            <Route
              path="/assets/:assetId/return"
              element={
                <ProtectedRoute allowedRoles={['user','staff','purchasing']}>
                  <AssetTransfer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets/:assetId/maintenance"
              element={
                <AdminRoute>
                  <AssetMaintenance />
                </AdminRoute>
              }
            />
            <Route
              path="/assets/:assetId/dispose"
              element={
                <AdminRoute>
                  <AssetDispose />
                </AdminRoute>
              }
            />
            <Route
              path="/explorer"
              element={
                <ProtectedRoute allowedRoles={['admin','admin_asset','auditor']}>
                  <Explorer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <AdminRoute>
                  <Reports />
                </AdminRoute>
              }
            />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              }
            />
            <Route
              path="/import"
              element={
                <AdminRoute>
                  <Import />
                </AdminRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <AdminRoute>
                  <Settings />
                </AdminRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
