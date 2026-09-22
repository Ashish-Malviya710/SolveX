import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AIAgentWidget from "./components/AIAgentWidget";

// Public Pages
import LandingPage from "./pages/public/LandingPage";
import ExploreProblems from "./pages/public/ExploreProblems";
import ProjectDetails from "./pages/public/ProjectDetails";
import DeveloperShowcase from "./pages/public/DeveloperShowcase";
import Showcase from "./pages/public/Showcase";
import DeveloperProfile from "./pages/public/DeveloperProfile";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";

// Developer Pages
import DeveloperDashboard from "./pages/developer/DeveloperDashboard";
import MyRequests from "./pages/developer/MyRequests";
import MyInvitations from "./pages/developer/MyInvitations";
import Portfolio from "./pages/developer/Portfolio";
import DeveloperChat from "./pages/developer/DeveloperChat";
import Settings from "./pages/developer/Settings";

// Provider Pages
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import CreateProblem from "./pages/provider/CreateProblem";
import FindDevelopers from "./pages/provider/FindDevelopers";
import DeveloperRequests from "./pages/provider/DeveloperRequests";
import ProposalReview from "./pages/provider/ProposalReview";

// Admin & 404
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-dark-950 text-gray-100 selection:bg-primary-600/40 selection:text-white">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/explore" element={<ExploreProblems />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              <Route path="/showcase" element={<Showcase />} />
              <Route path="/developers" element={<DeveloperShowcase />} />
              <Route path="/developers/:id" element={<DeveloperProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Developer Routes */}
              <Route
                path="/developer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["DEVELOPER", "ADMIN"]}>
                    <DeveloperDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/developer/requests"
                element={
                  <ProtectedRoute allowedRoles={["DEVELOPER", "ADMIN"]}>
                    <MyRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/developer/invitations"
                element={
                  <ProtectedRoute allowedRoles={["DEVELOPER", "ADMIN"]}>
                    <MyInvitations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/developer/portfolio"
                element={
                  <ProtectedRoute allowedRoles={["DEVELOPER", "ADMIN"]}>
                    <Portfolio />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/developer/chat"
                element={
                  <ProtectedRoute allowedRoles={["DEVELOPER", "PROBLEM_PROVIDER", "ADMIN"]}>
                    <DeveloperChat />
                  </ProtectedRoute>
                }
              />

              {/* Shared Settings Route */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Provider Routes */}
              <Route
                path="/provider/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["PROBLEM_PROVIDER", "ADMIN"]}>
                    <ProviderDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/create"
                element={
                  <ProtectedRoute allowedRoles={["PROBLEM_PROVIDER", "ADMIN"]}>
                    <CreateProblem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/find"
                element={
                  <ProtectedRoute allowedRoles={["PROBLEM_PROVIDER", "ADMIN"]}>
                    <FindDevelopers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/requests"
                element={
                  <ProtectedRoute allowedRoles={["PROBLEM_PROVIDER", "ADMIN"]}>
                    <DeveloperRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/proposals"
                element={
                  <ProtectedRoute allowedRoles={["PROBLEM_PROVIDER", "ADMIN"]}>
                    <ProposalReview />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <AIAgentWidget />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
