'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Plus, Sparkles, Trash2 } from 'lucide-react';
import styles from './studio-shell.module.css';

type ClipKind = 'elements' | 'media' | 'audio';

type Clip = {
  id: string;
  label: string;
  kind: ClipKind;
  start: number;
  duration: number;
};

const TOTAL = 20;
const clipColor: Record<ClipKind, string> = { elements: 'purple', media: 'teal', audio: 'yellow' };

const trackLabel: Record<ClipKind, string> = { elements: 'Elements', media: 'Media', audio: 'Audio' };

export function VideoWorkspace() {
  const [clips, setClips] = useState<Clip[]>([
    { id: 'c1', label: 'Headline reveal', kind: 'elements', start: 0, duration: 6 },
    { id: 'c2', label: 'Product shot', kind: 'media', start: 3, duration: 9 },
    { id: 'c3', label: 'Logo outro', kind: 'media', start: 13, duration: 5 },
    { id: 'c4', label: 'Voiceover', kind: 'audio', start: 0, duration: 18 },
  ]);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function generateVideo() {
    const text = videoPrompt.trim();
    if (!text || videoBusy) return;
    setVideoBusy(true);
    setVideoError(null);
    try {
      const response = await fetch('/api/media/video', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: text, duration: 6 }),
      });
      const result = await response.json() as { uri?: string; error?: string };
      if (result.uri) {
        setVideoUri(result.uri);
        setClips((current) => [...current, { id: `clip-video-${Date.now()}`, label: 'Veo generated', kind: 'media', start: 0, duration: 6 }]);
      } else {
        setVideoError(result.error || 'Veo returned no video.');
      }
    } catch {
      setVideoError('Veo generation is unavailable. Check the server configuration.');
    } finally {
      setVideoBusy(false);
    }
  }

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setPlayhead((current) => (current >= TOTAL ? 0 : current + 0.1));
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing]);

  function addClip(kind: ClipKind) {
    const label = kind === 'elements' ? 'New title' : kind === 'media' ? 'New clip' : 'New audio';
    setClips((current) => [...current, { id: `clip-${Date.now()}`, label, kind, start: 0, duration: 5 }]);
  }

  function removeClip(id: string) {
    setClips((current) => current.filter((clip) => clip.id !== id));
  }

  const pct = (value: number) => `${(value / TOTAL) * 100}%`;
  const fmt = (value: number) => `00:${String(Math.floor(value)).padStart(2, '0')}.${String(Math.round((value % 1) * 10))}`;

  return (
    <div className={styles.videoArea}>
      <div className={styles.videoTop}>
        <div><span className={styles.eyebrow}>VIDEO STUDIO</span><h2>Product launch / vertical cut</h2></div>
        <div className={styles.veoBox}>
          <input className={styles.field} value={videoPrompt} onChange={(event) => setVideoPrompt(event.target.value)} placeholder="Describe a clip for Veo..." disabled={videoBusy} />
          <button className={styles.toolbarPrimary} onClick={() => void generateVideo()} disabled={videoBusy}>{videoBusy ? 'Generating...' : <><Sparkles size={16} /> Generate with Veo</>}</button>
        </div>
      </div>

      {videoError ? <div className={styles.veoError}>{videoError}</div> : null}
      {videoUri ? <div className={styles.veoResult}><video src={videoUri} controls playsInline /><span>Generated clip added to the Media track.</span></div> : null}

      <div className={styles.videoPreview}>
        <div className={styles.videoFrame}>
          <div className={styles.videoOrb} />
          <strong>YOUR<br />NEXT<br />FRAME</strong>
          <small>{fmt(playhead)}</small>
        </div>
        <button className={styles.playButton} onClick={() => setPlaying((current) => !current)} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={20} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
        </button>
      </div>

      <div className={styles.timeline}>
        <div className={styles.ruler}>{Array.from({ length: 5 }).map((_, index) => <span key={index}>00:{String(index * 5).padStart(2, '0')}</span>)}</div>
        {(['elements', 'media', 'audio'] as ClipKind[]).map((kind) => (
          <div className={styles.timelineRow} key={kind}>
            <span>{trackLabel[kind]}</span>
            <div className={styles.track}>
              {clips.filter((clip) => clip.kind === kind).map((clip) => (
                <button key={clip.id} className={`${styles.clip} ${styles[`clip${clipColor[kind]}`]}`} style={{ left: pct(clip.start), width: pct(clip.duration) }} onClick={() => removeClip(clip.id)} title="Click to remove">
                  {clip.label} <i className={styles.clipDelete}><Trash2 size={11} /></i>
                </button>
              ))}
            </div>
            <button className={styles.trackAdd} onClick={() => addClip(kind)} aria-label={`Add ${trackLabel[kind]}`}><Plus size={14} /></button>
          </div>
        ))}
        <div className={styles.playheadLine} style={{ left: pct(playhead) }} />
      </div>
    </div>
  );
}
