'use client'

import { Toaster } from 'react-hot-toast'

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#2A2A2A',
          color: '#E0E0E0',
          border: '2px solid #000000',
          borderRadius: '0px',
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '4px 4px 0px 0px #000000',
        },
        success: {
          duration: 3000,
          style: {
            background: '#2A2A2A',
            color: '#7CB518',
            border: '2px solid #7CB518',
          },
          iconTheme: {
            primary: '#7CB518',
            secondary: '#2A2A2A',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#2A2A2A',
            color: '#8B1538',
            border: '2px solid #8B1538',
          },
          iconTheme: {
            primary: '#8B1538',
            secondary: '#2A2A2A',
          },
        },
      }}
    />
  )
}