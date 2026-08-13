export type StudioMode = 'agent' | 'graphic' | 'video' | 'calendar' | 'assets';

export type DesignNodeKind = 'text' | 'shape' | 'image' | 'annotation';

export type ShapeType = 'rectangle' | 'circle' | 'rounded' | 'pill' | 'star' | 'badge';

export type DesignNode = {
  id: string;
  kind: DesignNodeKind;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  boxShadow?: string;
  shapeType?: ShapeType;
  src?: string;
  prompt?: string;
  filter?: string;
};

export type SocialProvider = 'youtube' | 'tiktok' | 'facebook' | 'instagram' | 'x' | 'linkedin';

