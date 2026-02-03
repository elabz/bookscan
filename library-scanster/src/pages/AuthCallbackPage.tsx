import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInAndUp } from 'supertokens-auth-react/recipe/thirdparty';
import { PageLayout } from '@/components/layout/PageLayout';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const response = await signInAndUp();

        if (response.status === 'OK') {
          await refreshSession();
          toast.success('Successfully signed in!');
          navigate('/library');
        } else if (response.status === 'NO_EMAIL_GIVEN_BY_PROVIDER') {
          toast.error('No email provided by the provider');
          navigate('/login');
        } else {
          toast.error('Authentication failed');
          navigate('/login');
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed');
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <PageLayout className="flex justify-center items-center">
      <div className="text-center">
        <div className="w-16 h-16 border-t-4 border-primary rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Completing Authentication</h2>
        <p className="text-muted-foreground">Please wait while we complete the authentication process...</p>
      </div>
    </PageLayout>
  );
};

export default AuthCallbackPage;
