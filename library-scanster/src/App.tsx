
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import { RequireAuth } from "./providers/RequireAuth";

import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
import BookDetailsPage from "./pages/BookDetailsPage";
import AddBookPage from "./pages/AddBookPage";
import ScanPage from "./pages/ScanPage";
import TakePhotoPage from "./pages/TakePhotoPage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import DiscoverPage from "./pages/DiscoverPage";
import ProfilePage from "./pages/ProfilePage";
import LibrarySetupPage from "./pages/LibrarySetupPage";
import AdminPage from "./pages/AdminPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import HelpPage from "./pages/HelpPage";
import ContactPage from "./pages/ContactPage";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/auth/callback/*" element={<AuthCallbackPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Protected routes */}
        <Route path="/library" element={
          <RequireAuth>
            <LibraryPage />
          </RequireAuth>
        } />
        <Route path="/profile" element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        } />
        <Route path="/library-setup" element={
          <RequireAuth>
            <LibrarySetupPage />
          </RequireAuth>
        } />
        <Route path="/books/:id" element={<BookDetailsPage />} />
        <Route path="/books/add" element={
          <RequireAuth>
            <AddBookPage />
          </RequireAuth>
        } />
        <Route path="/scan" element={
          <RequireAuth>
            <ScanPage />
          </RequireAuth>
        } />
        <Route path="/take-photo" element={
          <RequireAuth>
            <TakePhotoPage />
          </RequireAuth>
        } />
        <Route path="/admin" element={
          <RequireAuth>
            <AdminPage />
          </RequireAuth>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  </TooltipProvider>
);

export default App;
