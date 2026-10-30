export interface LogoFontOption {
  id: string;
  name: string;
  family: string;
  category: string;
  description: string;
}

export const DEFAULT_LOGO_FONT: LogoFontOption = {
  id: 'dancing-script',
  name: 'Dancing Script',
  family: "'Dancing Script', 'Pacifico', cursive, sans-serif",
  category: 'Boutique Cursiva',
  description: 'Caligrafía manuscrita cálida, femenina y artesanal'
};

export const LOGO_FONT_OPTIONS: LogoFontOption[] = [
  {
    id: 'cinzel',
    name: 'Cinzel',
    family: "'Cinzel', 'Times New Roman', serif",
    category: 'Lujo & Clásico',
    description: 'Elegancia romana, joyería y moda alta (Estilo Zara / Cartier)'
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    family: "'Playfair Display', Georgia, serif",
    category: 'Editorial & Glamour',
    description: 'Serif de alto impacto y glamour boutique (Estilo Vogue / Shein Glam)'
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    family: "'Montserrat', -apple-system, sans-serif",
    category: 'Moderno & Geométrico',
    description: 'Limpio, simétrico y líder indiscutible en marcas de e-commerce global'
  },
  {
    id: 'poppins',
    name: 'Poppins',
    family: "'Poppins', -apple-system, sans-serif",
    category: 'Digital & Tech',
    description: 'Geometría circular amigable, moderna y de máxima legibilidad móvil'
  },
  {
    id: 'bebas-neue',
    name: 'Bebas Neue',
    family: "'Bebas Neue', Impact, sans-serif",
    category: 'Urbano & Fuerza',
    description: 'Titulares condensados, presencia contundente (Estilo Nike / Streetwear)'
  },
  {
    id: 'dancing-script',
    name: 'Dancing Script',
    family: "'Dancing Script', 'Pacifico', cursive, sans-serif",
    category: 'Boutique Cursiva',
    description: 'Caligrafía manuscrita cálida, femenina y artesanal'
  },
  {
    id: 'great-vibes',
    name: 'Great Vibes',
    family: "'Great Vibes', cursive, sans-serif",
    category: 'Caligrafía & Firma',
    description: 'Firma de autor estilizada y curvas de lujo fluido'
  },
  {
    id: 'system',
    name: 'Sistema Neutral',
    family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    category: 'Minimalista',
    description: 'Tipografía nativa limpia, ultra rápida y minimalista'
  }
];

export function getLogoFontById(id?: string): LogoFontOption {
  if (!id) return DEFAULT_LOGO_FONT;
  const found = LOGO_FONT_OPTIONS.find(f => f.id === id);
  return found || DEFAULT_LOGO_FONT;
}
