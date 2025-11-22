import React, { useMemo } from 'react';
import { hexToRgb, hexToHsl, hexToCmyk } from '../services/colorUtils';

interface ColorSwatchProps {
  name: string;
  hex: string;
  colorMode: 'HEX' | 'RGB' | 'HSL' | 'CMYK';
  onClick: () => void;
}

const isColorLight = (hex: string): boolean => {
  if (!hex || hex.length < 4) return false;
  const color = hex.substring(1);
  const rgb = parseInt(color, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 180; 
};

const ColorSwatch: React.FC<ColorSwatchProps> = ({ name, hex, colorMode, onClick }) => {
  
  const textColor = useMemo(() => isColorLight(hex) ? 'text-black' : 'text-white', [hex]);
  
  const displayedValue = useMemo(() => {
    switch(colorMode) {
        case 'RGB': return hexToRgb(hex);
        case 'HSL': return hexToHsl(hex);
        case 'CMYK': return hexToCmyk(hex);
        default: return hex.toUpperCase();
    }
  }, [hex, colorMode]);

  return (
    <div
      className="group relative aspect-square cursor-pointer border-2 border-border bg-surface overflow-hidden transition-transform duration-500 ease-carthay"
      onClick={onClick}
    >
      {/* Color Fill */}
      <div 
        className="absolute inset-0 z-0 transition-transform duration-1000 group-hover:scale-110 ease-carthay"
        style={{ backgroundColor: hex }}
      />

      {/* Info Overlay - Always Visible */}
      <div className={`absolute inset-0 z-10 flex flex-col justify-between p-3 md:p-6 ${textColor} pointer-events-none`}>
        
        {/* Header: Name */}
        <div className="flex flex-col items-start">
             <span 
                className="font-ui text-sm md:text-lg leading-tight tracking-wide font-light truncate w-full drop-shadow-md"
                title={name}
            >
                {name}
            </span>
        </div>

        {/* Footer: Value */}
        <div className="flex flex-col items-start w-full relative">
             <div className="h-[2px] w-8 bg-current mb-2 opacity-50"></div>
             <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest truncate w-full drop-shadow-md">{displayedValue}</span>
        </div>
      </div>

      {/* Action Button - Slide Up on Hover */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 z-20 transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-carthay">
         <button className="w-full py-3 bg-bg border-2 border-border text-text-primary font-mono text-[10px] uppercase tracking-widest hover:bg-surface hover:border-accent transition-all duration-300 shadow-2xl">
            Click For Options
         </button>
      </div>
    </div>
  );
};

export default ColorSwatch;
