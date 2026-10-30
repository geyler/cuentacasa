/**
 * Procesa una imagen para recortarla al centro en proporción 1:1 (cuadrada)
 * y generar los formatos requeridos para:
 * 1. Logotipo cuadrado de alta fidelidad (512x512) para PWA, cabecera y modal
 * 2. Favicon optimizado (64x64) para el navegador
 * 3. Icono de app (192x192) para dispositivos móviles y Apple Touch Icon
 */
export async function processSquareLogoImage(file: File): Promise<{
  square512: string;
  icon192: string;
  favicon64: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no soportado'));
      img.onload = () => {
        try {
          // Determinar corte cuadrado centrado
          const minDim = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
          const startX = ((img.naturalWidth || img.width) - minDim) / 2;
          const startY = ((img.naturalHeight || img.height) - minDim) / 2;

          // Helper para dibujar y exportar a un tamaño objetivo
          const exportSquare = (targetSize: number): string => {
            const canvas = document.createElement('canvas');
            canvas.width = targetSize;
            canvas.height = targetSize;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('No se pudo inicializar canvas 2D');

            // Alta calidad de suavizado
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(
              img,
              startX,
              startY,
              minDim,
              minDim,
              0,
              0,
              targetSize,
              targetSize
            );

            return canvas.toDataURL('image/png', 0.92);
          };

          const square512 = exportSquare(512);
          const icon192 = exportSquare(192);
          const favicon64 = exportSquare(64);

          resolve({ square512, icon192, favicon64 });
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Actualiza dinámicamente los elementos <link rel="icon"> y <link rel="apple-touch-icon">
 * en el documento HTML actual sin recargar la página.
 */
export function updateDocumentIcons(iconUrl: string) {
  if (typeof document === 'undefined' || !iconUrl) return;
  try {
    let fav = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (!fav) {
      fav = document.createElement('link');
      fav.rel = 'icon';
      document.head.appendChild(fav);
    }
    fav.type = 'image/png';
    fav.href = iconUrl;

    let appleIcon = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = iconUrl;
  } catch (e) {
    console.warn('No se pudo actualizar el favicon dinámico:', e);
  }
}
