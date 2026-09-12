/**
 * Волнистая кромка цветной секции — точные кривые из XD в координатах артборда 1920
 * (Group 8/17 — серая, Group 15/16 — тёмная, Path 18 — жёлтая; пересчёт трансформаций:
 * scratch-скрипт, результаты ниже). Каждая кромка — полоса `y…y+h` артборда:
 * при ширине 1920 высота совпадает с макетом, дальше масштабируется от ширины окна
 * (с минимумом, чтобы на мобиле волна не превращалась в линию).
 *
 *   side 'below' — секция под кривой (верхняя кромка секции)
 *   side 'above' — секция над кривой (нижняя кромка секции)
 */

type EdgeDef = { y: number; h: number; d: string; from: number; to: number; side: 'below' | 'above' };

const EDGES = {
  /** Верх серой секции (Group 8 / Path 18). */
  greyTop: {
    y: 1104.2,
    h: 96.8,
    d: 'M-153.1,1163.1C-153.1,1163.1 -42.6,1103.8 269.4,1158C581.4,1212.2 709.5,1218.5 1073.8,1158C1438.2,1097.5 2073.1,1103.9 2073.1,1103.9',
    from: -153.1,
    to: 2073.1,
    side: 'below',
  },
  /** Низ серой секции (Group 17 / Path 19). */
  greyBottom: {
    y: 2045,
    h: 155.1,
    d: 'M2109.1,2115.6C2109.1,2115.6 1998.6,2174.9 1686.6,2120.8C1374.6,2066.6 1313.6,1982.1 882.2,2120.8C450.7,2259.4 -117.1,2174.8 -117.1,2174.8',
    from: 2109.1,
    to: -117.1,
    side: 'above',
  },
  /** Верх тёмной секции (Group 15). Используется и для патички. */
  darkTop: {
    y: 2857.9,
    h: 155.1,
    d: 'M-153.1,2942.8C-153.1,2942.8 -42.6,2883.4 269.4,2937.6C581.4,2991.8 642.4,3076.3 1073.8,2937.6C1505.3,2799 2073.1,2883.5 2073.1,2883.5',
    from: -153.1,
    to: 2073.1,
    side: 'below',
  },
  /** Низ тёмной секции (Group 16) = верх жёлтой: заливаем жёлтым то, что под кривой. */
  darkBottom: {
    y: 4111,
    h: 97.1,
    d: 'M2109.1,4148.7C2109.1,4148.7 1998.6,4208 1686.6,4153.9C1374.6,4099.7 1246.5,4093.4 882.2,4153.9C517.8,4214.3 -117.1,4207.9 -117.1,4207.9',
    from: 2109.1,
    to: -117.1,
    side: 'below',
  },
  /** Низ жёлтой секции newsletter (Path 18). */
  yellowBottom: {
    y: 4666.1,
    h: 96.7,
    d: 'M-153.1,4703.9C-153.1,4703.9 -42.6,4763.3 269.4,4709.1C581.4,4654.9 709.5,4648.6 1073.8,4709.1C1438.2,4769.6 2073.1,4763.2 2073.1,4763.2',
    from: -153.1,
    to: 2073.1,
    side: 'above',
  },
} satisfies Record<string, EdgeDef>;

export type EdgeName = keyof typeof EDGES;

/** Высота полосы: как в макете на 1920, пропорционально ширине окна, но не меньше 40 %. */
export const edgeHeight = (name: EdgeName): string => {
  const { h } = EDGES[name];
  return `max(${(h / 19.2).toFixed(3)}vw, ${Math.round(h * 0.4)}px)`;
};

type SectionEdgeProps = {
  edge: EdgeName;
  /** Цвет секции (CSS-значение). */
  fill: string;
  className?: string;
};

export const SectionEdge = ({ edge, fill, className = '' }: SectionEdgeProps) => {
  const { y, h, d, from, to, side } = EDGES[edge];
  // замыкаем фигуру за пределами полосы (+3), чтобы на стыке с заливкой секции не было щели
  const edgeY = side === 'below' ? y + h + 3 : y - 3;
  return (
    <div aria-hidden className={`pointer-events-none relative w-full ${className}`} style={{ height: edgeHeight(edge) }}>
      <svg
        viewBox={`0 ${y} 1920 ${h}`}
        preserveAspectRatio="none"
        overflow="visible"
        className="absolute inset-0 block size-full"
      >
        <path d={`${d}L${to},${edgeY}L${from},${edgeY}Z`} fill={fill} />
      </svg>
    </div>
  );
};
