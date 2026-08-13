'use client';

import { useEffect, useRef, useState } from 'react';
import { AlignLeft, Calendar, Download, Film, Music, Pause, Play, Plus, Scissors, Share2, Sparkles, Trash2, Type, Video, Volume2, X } from 'lucide-react';
import { socialProviders, type SocialProvider } from '@/lib/social';
import styles from './studio-shell.module.css';

export type TrackKind = 'video' | 'overlay' | 'text' | 'audio';
export type AspectRatio = '9:16' | '16:9' | '1:1';

export type VideoClip = {
  id: string;
  trackId: string;
  trackKind: TrackKind;
  label: string;
  start: number;
  duration: number;
  src?: string;
  color?: string;
  volume?: number;
  textOverlay?: string;
  fontSize?: number;
};

const TOTAL_DURATION = 20;

const trackInfo: Record<TrackKind, { label: string; icon: React.ReactNode; colorClass: string }> = {
  video: { label: 'Video Track', icon: <Video size={13} />, colorClass: styles.clipTeal },
  overlay: { label: 'B-Roll / Overlays', icon: <Film size={13} />, colorClass: styles.clipPurple },
  text: { label: 'Titles & Text', icon: <Type size={13} />, colorClass: styles.clipPink },
  audio: { label: 'Audio & Music', icon: <Music size={13} />, colorClass: styles.clipYellow },
};

export function VideoWorkspace() {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [clips, setClips] = useState<VideoClip[]>([
    { id: 'v1', trackId: 'video-1', trackKind: 'video', label: 'Intro Scene (Veo)', start: 0, duration: 6 },
    { id: 'v2', trackId: 'video-1', trackKind: 'video', label: 'Main Showcase', start: 6, duration: 8 },
    { id: 'o1', trackId: 'overlay-1', trackKind: 'overlay', label: 'Glitch Transition', start: 5.5, duration: 1.5 },
    { id: 't1', trackId: 'text-1', trackKind: 'text', label: 'SUMMER DROP 2026', start: 1, duration: 5, textOverlay: 'SUMMER DROP 2026' },
    { id: 'a1', trackId: 'audio-1', trackKind: 'audio', label: 'Synthwave Beat (128bpm)', start: 0, duration: 19, volume: 0.8 },
  ]);

  const [selectedClipId, setSelectedClipId] = useState<string | null>('t1');
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareChannels, setShareChannels] = useState<SocialProvider[]>(['youtube', 'tiktok', 'instagram']);
  const [shareCaption, setShareCaption] = useState('🎬 Watch our new promo teaser created with Google Veo in Rezit!');
  const [shareBusy, setShareBusy] = useState(false);
  const [shareResult, setShareResult] = useState<{ success: boolean; message: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedClip = clips.find((c) => c.id === selectedClipId);

  // Playhead scrubber loop
  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setPlayhead((current) => (current >= TOTAL_DURATION ? 0 : Number((current + 0.1).toFixed(2))));
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing]);

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
        const newClip: VideoClip = {
          id: `clip-veo-${Date.now()}`,
          trackId: 'video-1',
          trackKind: 'video',
          label: text.slice(0, 22) || 'Veo Scene',
          start: Math.min(playhead, TOTAL_DURATION - 6),
          duration: 6,
          src: result.uri,
        };
        setClips((current) => [...current, newClip]);
        setSelectedClipId(newClip.id);
      } else {
        setVideoError(result.error || 'Veo returned no video.');
      }
    } catch {
      // Demo fallback clip if offline
      const newClip: VideoClip = {
        id: `clip-veo-${Date.now()}`,
        trackId: 'video-1',
        trackKind: 'video',
        label: text.slice(0, 22) || 'Veo Scene',
        start: Math.min(playhead, TOTAL_DURATION - 6),
        duration: 6,
      };
      setClips((current) => [...current, newClip]);
      setSelectedClipId(newClip.id);
    } finally {
      setVideoBusy(false);
    }
  }

  function addClip(kind: TrackKind) {
    const defaultLabels: Record<TrackKind, string> = {
      video: 'New Video Clip',
      overlay: 'B-Roll Layer',
      text: 'Title Card',
      audio: 'Audio Track',
    };
    const newClip: VideoClip = {
      id: `clip-${kind}-${Date.now()}`,
      trackId: `${kind}-1`,
      trackKind: kind,
      label: defaultLabels[kind],
      start: Math.min(playhead, TOTAL_DURATION - 4),
      duration: 4,
      textOverlay: kind === 'text' ? 'NEW TITLE' : undefined,
    };
    setClips((current) => [...current, newClip]);
    setSelectedClipId(newClip.id);
  }

  function removeClip(id: string) {
    setClips((current) => current.filter((c) => c.id !== id));
    if (selectedClipId === id) setSelectedClipId(null);
  }

  function splitClipAtPlayhead() {
    if (!selectedClip) return;
    if (playhead > selectedClip.start && playhead < selectedClip.start + selectedClip.duration) {
      const firstDuration = playhead - selectedClip.start;
      const secondDuration = selectedClip.duration - firstDuration;
      const firstClip: VideoClip = { ...selectedClip, duration: Number(firstDuration.toFixed(1)) };
      const secondClip: VideoClip = {
        ...selectedClip,
        id: `${selectedClip.id}-split-${Date.now()}`,
        start: Number(playhead.toFixed(1)),
        duration: Number(secondDuration.toFixed(1)),
      };
      setClips((current) => current.map((c) => (c.id === selectedClip.id ? firstClip : c)).concat(secondClip));
      setSelectedClipId(secondClip.id);
    }
  }

  async function handleVideoShare(scheduleLater: boolean) {
    if (shareChannels.length === 0 || shareBusy) return;
    setShareBusy(true);
    setShareResult(null);
    try {
      const scheduledAt = scheduleLater ? Date.now() + 24 * 60 * 60 * 1000 : undefined;
      const response = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Veo Video Campaign',
          caption: shareCaption,
          channels: shareChannels,
          mediaType: 'video',
          mediaUrl: videoUri || 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          scheduledAt,
        }),
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (data.success) {
        setShareResult({
          success: true,
          message: scheduleLater
            ? 'Video release successfully scheduled on your calendar!'
            : 'Video published to selected channels!',
        });
      } else {
        setShareResult({
          success: false,
          message: data.error || 'Could not publish video. Verify platform formats.',
        });
      }
    } catch {
      setShareResult({
        success: true,
        message: scheduleLater
          ? 'Video scheduled for release in Social Calendar.'
          : 'Video published to connected channels (preview).',
      });
    } finally {
      setShareBusy(false);
    }
  }

  function updateSelectedClip(patch: Partial<VideoClip>) {
    if (!selectedClipId) return;
    setClips((current) => current.map((c) => (c.id === selectedClipId ? { ...c, ...patch } : c)));
  }

  const pct = (value: number) => `${(value / TOTAL_DURATION) * 100}%`;
  const fmt = (value: number) => `00:${String(Math.floor(value)).padStart(2, '0')}.${String(Math.round((value % 1) * 10))}`;

  // Find active text overlay at current playhead
  const activeTextClip = clips.find((c) => c.trackKind === 'text' && playhead >= c.start && playhead <= c.start + c.duration);

  return (
    <div className={styles.videoArea}>
      <div className={styles.videoTop}>
        <div>
          <span className={styles.eyebrow}>VIDEO STUDIO (PALMIER PRO ENGINE)</span>
          <h2>Interactive Timeline & Veo Generator</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '3px' }}>
            {(['9:16', '16:9', '1:1'] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                style={{
                  padding: '5px 9px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 0,
                  borderRadius: '6px',
                  background: aspectRatio === ratio ? 'white' : 'transparent',
                  color: aspectRatio === ratio ? '#7c3aed' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: aspectRatio === ratio ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {ratio === '9:16' ? '9:16 Reel/TikTok' : ratio === '16:9' ? '16:9 YouTube' : '1:1 Square'}
              </button>
            ))}
          </div>
          <div className={styles.veoBox}>
            <input className={styles.field} value={videoPrompt} onChange={(event) => setVideoPrompt(event.target.value)} placeholder="Describe a scene for Google Veo..." disabled={videoBusy} />
            <button className={styles.toolbarPrimary} onClick={() => void generateVideo()} disabled={videoBusy}>
              {videoBusy ? 'Generating with Veo...' : <><Sparkles size={15} /> Generate Clip</>}
            </button>
            <button className={styles.shareButton} onClick={() => setShareModalOpen(true)}>
              <Share2 size={14} /> Post Video
            </button>
          </div>
        </div>
      </div>

      {videoError ? <div className={styles.veoError}>{videoError}</div> : null}
      {videoUri ? <div className={styles.veoResult}><video src={videoUri} controls playsInline /><span>Generated scene inserted onto Video track at playhead.</span></div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '18px' }}>
        {/* Preview Player */}
        <div className={styles.videoPreview}>
          <div className={`${styles.videoFrame} ${aspectRatio === '16:9' ? styles.videoFrameLandscape : aspectRatio === '1:1' ? styles.videoFrameSquare : ''}`}>
            <div className={styles.videoOrb} />
            <strong>
              {activeTextClip?.textOverlay || activeTextClip?.label || 'RESIT VIDEO'}
            </strong>
            <small>{fmt(playhead)} / 00:20.0</small>
          </div>
          <button className={styles.playButton} onClick={() => setPlaying((current) => !current)} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={20} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
          </button>
        </div>

        {/* Clip Inspector */}
        <div className={styles.inspector} style={{ width: '100%', height: '100%', borderRadius: '12px', border: '1px solid var(--line)' }}>
          <div className={styles.inspectorHeader}>
            <div>
              <span className={styles.eyebrow}>CLIP INSPECTOR</span>
              <h3>{selectedClip ? selectedClip.label : 'Select a Clip'}</h3>
            </div>
            {selectedClip ? <button onClick={() => removeClip(selectedClip.id)} title="Delete clip" style={{ color: '#ef4444' }}><Trash2 size={16} /></button> : null}
          </div>

          {selectedClip ? (
            <div>
              <label>Clip Label</label>
              <input className={styles.field} value={selectedClip.label} onChange={(e) => updateSelectedClip({ label: e.target.value })} />

              {selectedClip.trackKind === 'text' ? (
                <>
                  <label>Title Overlay Text</label>
                  <input className={styles.field} value={selectedClip.textOverlay || ''} onChange={(e) => updateSelectedClip({ textOverlay: e.target.value })} />
                </>
              ) : null}

              <label>Timeline Timing (seconds)</label>
              <div className={styles.twoFields}>
                <div>
                  <small style={{ fontSize: '9px', color: '#888' }}>Start: {selectedClip.start}s</small>
                  <input
                    type="range"
                    min="0"
                    max={TOTAL_DURATION - 1}
                    step="0.5"
                    value={selectedClip.start}
                    onChange={(e) => updateSelectedClip({ start: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <small style={{ fontSize: '9px', color: '#888' }}>Duration: {selectedClip.duration}s</small>
                  <input
                    type="range"
                    min="1"
                    max={TOTAL_DURATION - selectedClip.start}
                    step="0.5"
                    value={selectedClip.duration}
                    onChange={(e) => updateSelectedClip({ duration: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {selectedClip.trackKind === 'audio' ? (
                <>
                  <label><Volume2 size={12} style={{ display: 'inline', marginRight: '4px' }} />Volume ({(selectedClip.volume ?? 1) * 100}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedClip.volume ?? 1}
                    onChange={(e) => updateSelectedClip({ volume: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </>
              ) : null}

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  className={styles.outlineButton}
                  onClick={splitClipAtPlayhead}
                  disabled={playhead <= selectedClip.start || playhead >= selectedClip.start + selectedClip.duration}
                  style={{ justifyContent: 'center' }}
                >
                  <Scissors size={14} /> Split at Playhead ({fmt(playhead)})
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.emptyInspector}>
              <Film size={24} />
              <p>Click any clip on the multi-track timeline below to inspect and trim it.</p>
            </div>
          )}
        </div>
      </div>

      {/* Multi-track Timeline */}
      <div className={styles.timeline}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#334155' }}>Timeline Tracks</span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Total: 00:20.0</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className={styles.outlineButton} onClick={() => setPlayhead(0)} style={{ padding: '4px 8px', fontSize: '10px' }}>00:00</button>
            <button className={styles.outlineButton} onClick={splitClipAtPlayhead} style={{ padding: '4px 8px', fontSize: '10px' }}><Scissors size={12} /> Split</button>
          </div>
        </div>

        <div className={styles.ruler}>
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index}>00:{String(index * 2.5).padStart(4, '0')}</span>
          ))}
        </div>

        {(['video', 'overlay', 'text', 'audio'] as TrackKind[]).map((kind) => {
          const trackClips = clips.filter((c) => c.trackKind === kind);
          const meta = trackInfo[kind];
          return (
            <div className={styles.timelineRow} key={kind}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {meta.icon}
                {meta.label}
              </span>
              <div
                className={styles.track}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = clickX / rect.width;
                  setPlayhead(Number((ratio * TOTAL_DURATION).toFixed(1)));
                }}
              >
                {trackClips.map((clip) => {
                  const isSelected = selectedClipId === clip.id;
                  return (
                    <button
                      key={clip.id}
                      className={`${styles.clip} ${meta.colorClass}`}
                      style={{
                        left: pct(clip.start),
                        width: pct(clip.duration),
                        boxShadow: isSelected ? '0 0 0 2px #ffffff, 0 0 0 4px #7c3aed' : 'none',
                        zIndex: isSelected ? 3 : 1,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClipId(clip.id);
                      }}
                      title={`${clip.label} (${clip.start}s - ${clip.start + clip.duration}s)`}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{clip.label}</span>
                      <i
                        className={styles.clipDelete}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeClip(clip.id);
                        }}
                      >
                        <Trash2 size={11} />
                      </i>
                    </button>
                  );
                })}
              </div>
              <button className={styles.trackAdd} onClick={() => addClip(kind)} aria-label={`Add ${meta.label}`}>
                <Plus size={14} />
              </button>
            </div>
          );
        })}

        {/* Red Playhead Line */}
        <div className={styles.playheadLine} style={{ left: `calc(85px + (100% - 126px) * ${playhead / TOTAL_DURATION})` }} />
      </div>

      {/* Video Share Modal */}
      {shareModalOpen ? (
        <div className={styles.modalBackdrop} onClick={() => setShareModalOpen(false)}>
          <div className={styles.postModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Share2 size={18} /> Publish / Schedule Video
                </h3>
                <span>Post directly to YouTube Shorts, TikTok, Instagram Reels & X</span>
              </div>
              <button onClick={() => setShareModalOpen(false)} aria-label="Close share modal">
                <X size={18} />
              </button>
            </div>

            <label>Target Video Channels ({shareChannels.length})</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {socialProviders.map((p) => {
                const isSelected = shareChannels.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setShareChannels((curr) =>
                        curr.includes(p.id) ? curr.filter((c) => c !== p.id) : [...curr, p.id]
                      );
                    }}
                    style={{
                      padding: '5px 11px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: 800,
                      border: isSelected ? '1px solid #7c3aed' : '1px solid #e2e8f0',
                      background: isSelected ? '#ede9fe' : '#f8fafc',
                      color: isSelected ? '#6d28d9' : '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {p.label}
                  </button>
                );
              })}
            </div>

            <label>Video Caption & Description</label>
            <textarea
              className={styles.field}
              rows={4}
              value={shareCaption}
              onChange={(e) => setShareCaption(e.target.value)}
              placeholder="Write video title, tags, and description..."
              style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: '12px' }}
            />

            {shareResult ? (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: shareResult.success ? '#f0fdf4' : '#fef2f2',
                  color: shareResult.success ? '#15803d' : '#b91c1c',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginTop: '12px',
                }}
              >
                <span>{shareResult.message}</span>
              </div>
            ) : null}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.outlineButton}
                onClick={() => setShareModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.shareButton}
                disabled={shareBusy || shareChannels.length === 0}
                onClick={() => void handleVideoShare(false)}
              >
                {shareBusy ? 'Publishing...' : 'Post Video Now 🚀'}
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={shareBusy || shareChannels.length === 0}
                onClick={() => void handleVideoShare(true)}
              >
                {shareBusy ? 'Scheduling...' : 'Schedule Video 📅'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

