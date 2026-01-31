import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import SuperTokens, { SuperTokensWrapper } from 'supertokens-auth-react'
import App from './App'
import './index.css'
import { Toaster } from './components/ui/sonner'
import './config/supertokens'

// Create a client for React Query
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SuperTokensWrapper>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <App />
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </SuperTokensWrapper>
  </React.StrictMode>,
)
