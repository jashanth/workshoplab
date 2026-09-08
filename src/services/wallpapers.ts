export interface WallpaperTheme {
  id: string;
  name: string;
  className: string;
  style?: React.CSSProperties;
}

export const wallpaperThemes: WallpaperTheme[] = [
  {
    id: 'default',
    name: 'Kali Dark Blue (Default)',
    className: 'bg-gradient-to-br from-[#050814] via-[#0a1128] to-[#1c2541]',
    style: {
      backgroundImage: `
        radial-gradient(circle at 20% 30%, rgba(54, 123, 240, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(0, 217, 255, 0.1) 0%, transparent 40%),
        linear-gradient(135deg, #050814 0%, #0a1128 50%, #101b3b 100%)
      `
    }
  },
  {
    id: 'matrix',
    name: 'Matrix Rain',
    className: 'bg-black',
    style: {
      backgroundImage: `
        radial-gradient(circle at 50% 50%, rgba(0, 255, 65, 0.1) 0%, transparent 70%),
        linear-gradient(180deg, #000a00 0%, #001400 100%)
      `
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Purple',
    className: 'bg-gradient-to-br from-[#12072b] via-[#2d0c4e] to-[#4c1175]',
    style: {
      backgroundImage: `
        radial-gradient(circle at 30% 20%, rgba(255, 0, 128, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 70% 80%, rgba(0, 217, 255, 0.15) 0%, transparent 50%),
        linear-gradient(135deg, #0c041c 0%, #1e0936 50%, #2f0e54 100%)
      `
    }
  },
  {
    id: 'minimal',
    name: 'Deep Minimal',
    className: 'bg-[#0a0d14]',
    style: {
      backgroundImage: `
        radial-gradient(circle at 50% 0%, rgba(30, 41, 59, 0.5) 0%, transparent 75%),
        linear-gradient(180deg, #080b11 0%, #030407 100%)
      `
    }
  }
];
