import './globals.css';
import RegistrarSW from '../components/RegistrarSW';
import { AppModeProvider } from '../context/AppModeProvider';
import { ThemeProvider } from '../context/ThemeProvider';
import { ClientSessionProvider } from '../context/ClientSessionProvider';
import PhoneFrame from '../components/PhoneFrame';
import Splash from '../components/Splash';

export const metadata = {
  title: 'Domix — Pide tu servicio',
  description: 'Mensajería, encomiendas, domicilios y mandados en Buenaventura. Desde $6.000.',
  manifest: '/manifest.json',
};

export const viewport = { themeColor: '#0a0a0a', width: 'device-width', initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="es-CO">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
      </head>
      <body>
        <RegistrarSW />
        <ThemeProvider>
          <AppModeProvider>
            <PhoneFrame>
              <div className="dx-shell">
                <ClientSessionProvider>{children}</ClientSessionProvider>
                <Splash />
              </div>
            </PhoneFrame>
          </AppModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
