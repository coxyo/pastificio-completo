// src/pages/App.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Verifica token all'avvio
    const token = localStorage.getItem('token');
    
    // Se non c'è token e non sei già nella pagina login
    if (!token && router.pathname !== '/login') {
      router.push('/login');
    }
  }, [router.pathname]);

  return <Component {...pageProps} />;
}

export default App;