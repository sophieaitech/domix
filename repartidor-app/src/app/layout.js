import './globals.css';
import { ICONOS } from '../lib/iconos';
import RegistrarSW from '../components/RegistrarSW';
import { AppModeProvider } from '../context/AppModeProvider';
import { ThemeProvider } from '../context/ThemeProvider';
import { CourierSessionProvider } from '../context/CourierSessionProvider';
import PhoneFrame from '../components/PhoneFrame';
import Splash from '../components/Splash';

/* Tipografías, pedidas al mínimo.

   Dos cosas que valen mucho en un celular con datos lentos:

   1. Los pesos se piden como rango variable (500..800) y no sueltos.
      Google devuelve un archivo en vez de cuatro: Manrope pasa de
      124 KB a 25 KB, sin perder ningún peso.

   2. Los iconos se piden por nombre. La fuente completa de Material
      Symbols pesa 372 KB y esta app usa unos setenta iconos; recortada
      baja a unos 10 KB. La lista la genera scripts/iconos.mjs.

   Los iconos van con display=block y no swap: mientras carga se prefiere
   un hueco a una caja de "carácter desconocido" donde debería ir un
   icono. El texto sí va con swap, que se lee igual en otra tipografía. */
const FUENTES = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600..800&family=Plus+Jakarta+Sans:wght@500..800&family=IBM+Plex+Mono:wght@600;700;800&display=swap';
const ICONOS_URL =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0'
  + `&icon_names=${ICONOS}`
  + '&display=block';


/* Se ejecuta antes de pintar. Si esto viviera en un efecto de React, la
   app arrancaría en claro y voltearía a oscuro un instante después:
   un parpadeo blanco cada vez que se abre. */
/* Nota: <html> lleva suppressHydrationWarning porque este guion escribe
   data-theme antes de que React arranque. El HTML del servidor y el del
   navegador no coinciden a propósito, y sin eso React lo reporta como
   error en cada carga. */
const TEMA_INICIAL = `(function(){try{
  var t=localStorage.getItem('domix_theme');
  if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
  document.documentElement.setAttribute('data-theme',t);
}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export const metadata = {
  title: 'Domix Repartidor',
  description: 'App de repartidores de Domix — Mensajería & Logística',
  manifest: '/manifest.json',
};

export const viewport = { themeColor: '#17140F', width: 'device-width', initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="es-CO" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={FUENTES} rel="stylesheet" />
        <link href={ICONOS_URL} rel="stylesheet" />
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
