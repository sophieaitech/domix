import { CourierSessionProvider } from '../context/CourierSessionProvider';
import './globals.css';

export const metadata = {
  title: 'Domix Repartidor',
  description: 'App de repartidores de Domix - Mensajería & Logística',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#10233f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-CO">
      <body>
        <div className="dx-app" style={{ position: 'relative', color: 'var(--tx)', background: 'var(--bg)' }}>
          <CourierSessionProvider>{children}</CourierSessionProvider>
        </div>
      </body>
    </html>
  );
}
