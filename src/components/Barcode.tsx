import React from 'react';
import { encodeCode128B } from '../lib/barcodeUtils';

export interface BarcodeProps {
  value: string;
  height?: number;
  barWidth?: number;
  showText?: boolean;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  bgColor?: string;
}

/**
 * React Component for rendering razor-sharp vector SVG barcode.
 * Crisp and vector-scaled in both screen and browser window.print().
 */
export const Barcode: React.FC<BarcodeProps> = ({
  value,
  height = 36,
  barWidth = 1.6,
  showText = true,
  className = '',
  style = {},
  color = '#000000',
  bgColor = 'transparent',
}) => {
  if (!value) return null;

  const { bars, totalModules } = encodeCode128B(value);
  const quietZoneModules = 10;
  const totalSvgWidth = (totalModules + quietZoneModules * 2) * barWidth;
  const textHeight = showText ? 16 : 0;
  const totalSvgHeight = height + textHeight + 4;

  let currentModule = quietZoneModules;

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      style={{ ...style }}
    >
      <svg
        width={totalSvgWidth}
        height={totalSvgHeight}
        viewBox={`0 0 ${totalSvgWidth} ${totalSvgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
        style={{ display: 'block', maxWidth: '100%' }}
      >
        {bgColor !== 'transparent' && (
          <rect width={totalSvgWidth} height={totalSvgHeight} fill={bgColor} />
        )}
        {bars.map((bar, idx) => {
          const x = currentModule * barWidth;
          const w = bar.width * barWidth;
          currentModule += bar.width;
          if (!bar.isBar) return null;
          return <rect key={idx} x={x} y={1} width={w} height={height} fill={color} />;
        })}
        {showText && (
          <text
            x={totalSvgWidth / 2}
            y={height + 13}
            textAnchor="middle"
            fill={color}
            fontFamily="monospace, Courier, monospace"
            fontSize="10"
            fontWeight="bold"
            letterSpacing="1"
          >
            {value}
          </text>
        )}
      </svg>
    </div>
  );
};

