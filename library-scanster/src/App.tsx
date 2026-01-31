
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

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        
        {/* Protected routes */}
        <Route path="/library" element={
          <RequireAuth>
            <LibraryPage />
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
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  </TooltipProvider>
);

export default App;
