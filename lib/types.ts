export type StudioMode = 'agent' | 'graphic' | 'video' | 'calendar' | 'assets';

export type DesignNode = {
  id: string;
  kind: 'text' | 'shape' | 'image' | 'annotation';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  color?: string;
  rotation?: number;
};
