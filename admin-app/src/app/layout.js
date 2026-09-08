import './globals.css';
import { AppModeProvider } from '../context/AppModeProvider';
import { ThemeProvider } from '../context/ThemeProvider';
import { OpsProvider } from '../context/OpsProvider';
import Sidebar from '../components/Sidebar';
import Onboarding from '../components/Onboarding';

export const metadata = {
  title: 'Domix — Panel interno',
  description: 'Centro de operaciones de Domix Mensajería & Logística',
};

export const viewport = { themeColor: '#17140F', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="es-CO">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <AppModeProvider>
          <OpsProvider>
            <div className="dx-admin">
              <Sidebar />
              <main className="dx-main">{children}</main>
            </div>
            <Onboarding />
          </OpsProvider>
        </AppModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
