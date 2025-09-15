"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
              zIndex: 2147483647,
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
            },
          }}
          containerStyle={{
            zIndex: 2147483650,  // Increased z-index to be above ant-modal-wrap
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </>
    </SessionProvider>
  );
}
