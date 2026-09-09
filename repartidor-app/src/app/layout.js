import './globals.css';
import RegistrarSW from '../components/RegistrarSW';
import { AppModeProvider } from '../context/AppModeProvider';
import { ThemeProvider } from '../context/ThemeProvider';
import { CourierSessionProvider } from '../context/CourierSessionProvider';
import PhoneFrame from '../components/PhoneFrame';
import Splash from '../components/Splash';

export const metadata = {
  title: 'Domix Repartidor',
  description: 'App de repartidores de Domix — Mensajería & Logística',
  manifest: '/manifest.json',
};

export const viewport = { themeColor: '#17140F', width: 'device-width', initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="es-CO">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
      </head>
      <body>
        <RegistrarSW />
        <ThemeProvider>
          <AppModeProvider>
          <PhoneFrame>
            <div className="dx-shell">
              <CourierSessionProvider>{children}</CourierSessionProvider>
              <Splash />
            </div>
          </PhoneFrame>
        </AppModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
