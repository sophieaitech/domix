import './globals.css';

export const metadata = {
  title: 'Domix',
  description: 'Pide mensajería, encomiendas, domicilios y mandados en Buenaventura — sin registrarte.',
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
        <div className="dx-app" style={{ color: 'var(--tx)', background: 'var(--bg)' }}>{children}</div>
      </body>
    </html>
  );
}
