import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@repo/sdk';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuthStore();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      navigate('/trade');
      return;
    }

    const process = async () => {
      const success = await handleCallback(code);
      if (success) {
        // Redirect to trade or wherever they were before
        navigate('/trade');
      } else {
        // If failed, maybe show an error or redirect home
        console.error("Auth callback failed");
        navigate('/trade');
      }
    };

    process();
  }, [searchParams, navigate, handleCallback]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#0f172a',
      color: '#fff'
    }}>
      <h2>Signing you in...</h2>
    </div>
  );
}
