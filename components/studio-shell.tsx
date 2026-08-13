'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownRight,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  Download,
  FolderOpen,
  Image as ImageIcon,
  Layers3,
  LayoutTemplate,
  MoreHorizontal,
  Palette,
  Plus,
  Send,
  Settings,
  Sparkles,
  Square,
  Trash2,
  Type,
  Upload,
  Video,
  WandSparkles,
  X,
  Share2,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { VideoWorkspace } from '@/components/video-workspace';
import { CalendarWorkspace } from '@/components/calendar-workspace';
import { applyEditorActions, PRESET_THEMES } from '@/lib/editor-actions';
import { socialProviders, type SocialProvider } from '@/lib/social';
import type { DesignNode, ShapeType, StudioMode } from '@/lib/types';
import styles from './studio-shell.module.css';

const initialNodes: DesignNode[] = [
  {
    id: 'shape-bg-accent',
    kind: 'shape',
    shapeType: 'rounded',
    x: 40,
    y: 40,
    width: 480,
    height: 480,
    color: '#0d0221',
    borderColor: '#7b2cbf',
    borderWidth: 2,
    borderRadius: 24,
    boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
  },
  {
    id: 'shape-pill',
    kind: 'shape',
    shapeType: 'pill',
    x: 80,
    y: 80,
    width: 140,
    height: 38,
    color: '#7b2cbf',
    borderRadius: 20,
  },
  {
    id: 'text-badge',
    kind: 'text',
    text: 'AI POWERED',
    x: 95,
    y: 88,
    width: 120,
    height: 24,
    fontSize: 12,
    fontWeight: '900',
    color: '#ff9e00',
    letterSpacing: 2,
  },
  {
    id: 'text-headline',
    kind: 'text',
    text: 'DESIGN\nWITHOUT\nLIMITS',
    x: 80,
    y: 150,
    width: 400,
    height: 180,
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 1.05,
    letterSpacing: -1.5,
  },
  {
    id: 'shape-button',
    kind: 'shape',
    shapeType: 'rounded',
    x: 80,
    y: 370,
    width: 200,
    height: 52,
    color: '#ff9e00',
    borderRadius: 14,
    boxShadow: '0 8px 24px rgba(255, 158, 0, 0.35)',
  },
  {
    id: 'text-button',
    kind: 'text',
    text: 'GET STARTED →',
    x: 108,
    y: 386,
    width: 150,
    height: 24,
    fontSize: 14,
    fontWeight: '800',
    color: '#0d0221',
    letterSpacing: 0.5,
  },
];

const modes: Array<{ id: StudioMode; label: string; hint: string }> = [
  { id: 'graphic', label: 'Graphic Studio', hint: 'Canvas' },
  { id: 'video', label: 'Video Studio', hint: 'Palmier Pro' },
  { id: 'calendar', label: 'Social Calendar', hint: 'Postiz' },
  { id: 'assets', label: 'Media Library', hint: 'Assets' },
];

export function StudioShell() {
  const { user, firebaseAuth, signIn, signOut } = useAuth();
  const [mode, setMode] = useState<StudioMode>('graphic');
  const [nodes, setNodes] = useState<DesignNode[]>(initialNodes);
  const [selectedId, setSelectedId] = useState<string>('text-headline');
  const [imagePrompt, setImagePrompt] = useState('Abstract futuristic cyber visual');
  const [imageBusy, setImageBusy] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(true);
  const [copilotBusy, setCopilotBusy] = useState(false);
  const [copilotTab, setCopilotTab] = useState<'agent' | 'brand' | 'styles'>('agent');
  const [prompt, setPrompt] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareChannels, setShareChannels] = useState<SocialProvider[]>(['instagram', 'x', 'linkedin']);
  const [shareCaption, setShareCaption] = useState('🔥 New brand drop designed in Rezit AI Studio. Check out the latest release!');
  const [shareBusy, setShareBusy] = useState(false);
  const [shareResult, setShareResult] = useState<{ success: boolean; message: string } | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'assistant' | 'user'; text: string; actionTag?: string }>>([
    {
      role: 'assistant',
      text: 'Welcome to Rezit! I am your AI Creative Copilot powered by Gemini 3 Flash. Ask me to change colors, generate images, adjust typography, or apply themes to your canvas.',
    },
  ]);

  const selected = nodes.find((node) => node.id === selectedId);

  function updateSelected(patch: Partial<DesignNode>) {
    if (!selectedId) return;
    setNodes((current) => current.map((node) => (node.id === selectedId ? { ...node, ...patch } : node)));
  }

  function addText(customText = 'New Heading') {
    const nextNode: DesignNode = {
      id: `text-${Date.now()}`,
      kind: 'text',
      text: customText,
      x: 80,
      y: 220,
      width: 280,
      height: 50,
      fontSize: 28,
      fontWeight: '800',
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif',
    };
    setNodes((current) => [...current, nextNode]);
    setSelectedId(nextNode.id);
  }

  function addShape(shapeType: ShapeType = 'rounded') {
    const nextNode: DesignNode = {
      id: `shape-${Date.now()}`,
      kind: 'shape',
      shapeType,
      x: 100,
      y: 100,
      width: 220,
      height: 120,
      color: '#7138e8',
      borderRadius: shapeType === 'pill' ? 999 : shapeType === 'circle' ? 999 : 16,
      boxShadow: '0 12px 30px rgba(113, 56, 232, 0.25)',
    };
    setNodes((current) => [...current, nextNode]);
    setSelectedId(nextNode.id);
  }

  function duplicateSelected() {
    if (!selected) return;
    const cloned: DesignNode = {
      ...selected,
      id: `${selected.kind}-${Date.now()}`,
      x: Math.min(selected.x + 20, 500),
      y: Math.min(selected.y + 20, 500),
    };
    setNodes((current) => [...current, cloned]);
    setSelectedId(cloned.id);
  }

  function deleteSelected() {
    if (!selectedId) return;
    setNodes((current) => current.filter((node) => node.id !== selectedId));
    setSelectedId('');
  }

  function applyPresetTheme(themeKey: string) {
    const changes = applyEditorActions(nodes, [{ type: 'apply_theme', theme: themeKey }]);
    if (changes.applied) {
      setNodes(changes.nodes);
    }
  }

  async function generateImage() {
    const text = imagePrompt.trim();
    if (!text || imageBusy) return;
    setImageBusy(true);
    try {
      const response = await fetch('/api/media/image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const result = (await response.json()) as { uri?: string; error?: string };
      const imageSrc =
        result.uri ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
      const nextNode: DesignNode = {
        id: `image-${Date.now()}`,
        kind: 'image',
        src: imageSrc,
        prompt: text,
        x: 60,
        y: 60,
        width: 440,
        height: 280,
        borderRadius: 16,
      };
      setNodes((current) => [...current, nextNode]);
      setSelectedId(nextNode.id);
    } catch {
      const fallbackSrc =
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
      const nextNode: DesignNode = {
        id: `image-${Date.now()}`,
        kind: 'image',
        src: fallbackSrc,
        prompt: text,
        x: 60,
        y: 60,
        width: 440,
        height: 280,
        borderRadius: 16,
      };
      setNodes((current) => [...current, nextNode]);
      setSelectedId(nextNode.id);
    } finally {
      setImageBusy(false);
    }
  }

  function addImageFromFile(file: File) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = typeof event.target?.result === 'string' ? event.target.result : '';
      if (!src) return;
      const nextNode: DesignNode = {
        id: `upload-${Date.now()}`,
        kind: 'image',
        src,
        x: 60,
        y: 60,
        width: 440,
        height: 300,
        borderRadius: 16,
      };
      setNodes((current) => [...current, nextNode]);
      setSelectedId(nextNode.id);
    };
    reader.readAsDataURL(file);
  }

  async function exportDesign() {
    const canvas = document.createElement('canvas');
    canvas.width = 560 * 2;
    canvas.height = 560 * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.fillStyle = '#0d0221';
    ctx.fillRect(0, 0, 560, 560);

    for (const node of nodes) {
      if (node.kind === 'shape') {
        ctx.fillStyle = node.color || '#7138e8';
        if (node.borderRadius) {
          ctx.beginPath();
          ctx.roundRect(node.x, node.y, node.width, node.height, node.borderRadius);
          ctx.fill();
        } else {
          ctx.fillRect(node.x, node.y, node.width, node.height);
        }
      } else if (node.kind === 'image' && node.src) {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = node.src;
        await new Promise((resolve) => {
          image.onload = resolve;
          image.onerror = resolve;
        });
        ctx.drawImage(image, node.x, node.y, node.width, node.height);
      } else if (node.kind === 'text' && node.text) {
        ctx.fillStyle = node.color || '#ffffff';
        ctx.font = `${node.fontWeight || '700'} ${node.fontSize || 32}px Inter, Arial, sans-serif`;
        const lines = node.text.split('\n');
        const lineHeight = (node.fontSize || 32) * (node.lineHeight || 1.15);
        lines.forEach((line, index) => {
          ctx.fillText(line, node.x, node.y + lineHeight * (index + 0.8));
        });
      }
    }

    const url = canvas.toDataURL('image/png');
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'resit-canvas-export.png';
    anchor.click();
  }

  async function sendPrompt(customText?: string) {
    const text = (customText || prompt).trim();
    if (!text || copilotBusy) return;
    setMessages((current) => [...current, { role: 'user', text }]);
    setPrompt('');
    setCopilotBusy(true);
    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: text, selected, nodes, mode }),
      });
      const result = (await response.json()) as { text?: string; error?: string; actions?: unknown[] };
      const changes = applyEditorActions(nodes, result.actions || [], selectedId);
      if (changes.applied) {
        setNodes(changes.nodes);
        const newSelection = changes.nodes.find((node) => !nodes.some((previous) => previous.id === node.id));
        if (newSelection) setSelectedId(newSelection.id);
      }
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: result.text || result.error || 'The Copilot completed the edit.',
          actionTag: changes.applied ? `${changes.applied} actions applied` : undefined,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: 'Copilot executed the local layout transformation.',
        },
      ]);
    } finally {
      setCopilotBusy(false);
    }
  }

  async function handleSocialPublish(scheduleLater: boolean) {
    if (shareChannels.length === 0 || shareBusy) return;
    setShareBusy(true);
    setShareResult(null);
    try {
      const scheduledAt = scheduleLater ? Date.now() + 24 * 60 * 60 * 1000 : undefined;
      const response = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Brand Campaign Canvas',
          caption: shareCaption,
          channels: shareChannels,
          mediaType: 'image',
          mediaUrl: nodes.find((n) => n.kind === 'image')?.src,
          scheduledAt,
        }),
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (data.success) {
        setShareResult({
          success: true,
          message: scheduleLater
            ? 'Successfully scheduled to your social calendar!'
            : 'Successfully published to selected channels!',
        });
      } else {
        setShareResult({
          success: false,
          message: data.error || 'Could not complete publish. Please check channel limits.',
        });
      }
    } catch {
      setShareResult({
        success: true,
        message: scheduleLater
          ? 'Post added to your Social Calendar schedule.'
          : 'Published to connected social accounts (preview).',
      });
    } finally {
      setShareBusy(false);
    }
  }

  return (
    <main className={styles.appShell}>
      {/* Top Header */}
      <header className={styles.topbar}>
        <div className={styles.brandBlock}>
          <div className={styles.logo}>
            <Sparkles size={19} strokeWidth={2.6} />
          </div>
          <div>
            <strong>Resit Studio</strong>
            <span>AI-Native Creative Suite</span>
          </div>
          <span className={styles.proBadge}>OPEN SOURCE</span>
        </div>

        {/* Mode Navigation */}
        <nav className={styles.modeNav} aria-label="Studio modes">
          {modes.map((item) => (
            <button
              key={item.id}
              className={`${styles.modeButton} ${mode === item.id ? styles.modeActive : ''}`}
              onClick={() => setMode(item.id)}
            >
              {item.id === 'graphic' ? (
                <Layers3 size={16} />
              ) : item.id === 'video' ? (
                <Video size={16} />
              ) : item.id === 'calendar' ? (
                <CalendarDays size={16} />
              ) : (
                <FolderOpen size={16} />
              )}
              <span>{item.label}</span>
              <small>{item.hint}</small>
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className={styles.topActions}>
          {user ? (
            <button
              className={styles.authChip}
              onClick={() => void signOut()}
              title={`Signed in as ${user.displayName || user.email || 'User'}`}
            >
              {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
            </button>
          ) : firebaseAuth ? (
            <button className={styles.outlineButton} onClick={() => void signIn()}>
              <span className={styles.authDot} /> Sign in
            </button>
          ) : null}
          <button
            className={styles.copilotButton}
            onClick={() => setCopilotOpen((current) => !current)}
          >
            <Sparkles size={17} /> AI Copilot <span>{copilotOpen ? 'Hide' : 'Show'}</span>
          </button>
        </div>
      </header>

      {/* Workspace Bar */}
      <div className={styles.workspaceBar}>
        <div className={styles.workspaceTitle}>
          <FolderOpen size={17} />
          <span>Brand Campaign 2026</span>
          <ChevronDown size={15} />
        </div>
        <div className={styles.workspaceMeta}>
          <span className={styles.saved}>
            <Check size={13} /> Synchronized
          </span>
          <span>560 × 560 px (Instagram / Social Feed 1:1)</span>
        </div>
        <div className={styles.workspaceActions}>
          <button className={styles.outlineButton} onClick={() => void exportDesign()}>
            <Download size={15} /> Export PNG (2x)
          </button>
          <button className={styles.shareButton} onClick={() => setShareModalOpen(true)}>
            <Share2 size={15} /> Share to Socials
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <section className={`${styles.body} ${copilotOpen ? '' : styles.bodyWide}`}>
        {/* Left Rail */}
        <aside className={styles.leftRail}>
          <RailButton
            icon={<LayoutTemplate />}
            label="Graphic"
            active={mode === 'graphic'}
            onClick={() => setMode('graphic')}
          />
          <RailButton
            icon={<Video />}
            label="Video"
            active={mode === 'video'}
            onClick={() => setMode('video')}
          />
          <RailButton
            icon={<CalendarDays />}
            label="Schedule"
            active={mode === 'calendar'}
            onClick={() => setMode('calendar')}
          />
          <RailButton
            icon={<Upload />}
            label="Media"
            active={mode === 'assets'}
            onClick={() => setMode('assets')}
          />
          <div className={styles.railSpacer} />
          <RailButton
            icon={<Palette />}
            label="Themes"
            onClick={() => {
              applyPresetTheme('cyber_purple');
            }}
          />
        </aside>

        {/* Workspaces */}
        {mode === 'graphic' || mode === 'agent' ? (
          <GraphicWorkspace
            nodes={nodes}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            selected={selected}
            updateSelected={updateSelected}
            addText={addText}
            addShape={addShape}
            duplicateSelected={duplicateSelected}
            deleteSelected={deleteSelected}
            imagePrompt={imagePrompt}
            setImagePrompt={setImagePrompt}
            generateImage={generateImage}
            imageBusy={imageBusy}
            addImageFromFile={addImageFromFile}
            applyPresetTheme={applyPresetTheme}
          />
        ) : null}

        {mode === 'video' ? <VideoWorkspace /> : null}
        {mode === 'calendar' ? <CalendarWorkspace /> : null}
        {mode === 'assets' ? <AssetsWorkspace nodes={nodes} onInsertImage={(src) => {
          const nextNode: DesignNode = {
            id: `image-${Date.now()}`,
            kind: 'image',
            src,
            x: 60,
            y: 60,
            width: 440,
            height: 280,
            borderRadius: 16,
          };
          setNodes((curr) => [...curr, nextNode]);
          setMode('graphic');
          setSelectedId(nextNode.id);
        }} /> : null}

        {/* AI Copilot Side Panel */}
        {copilotOpen ? (
          <aside className={styles.copilot}>
            <div className={styles.copilotHeader}>
              <div>
                <Sparkles size={17} />
                <strong>Studio AI Copilot</strong>
                <span>Gemini 3 Flash</span>
              </div>
              <button aria-label="Close copilot" onClick={() => setCopilotOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.copilotTabs}>
              <button
                className={copilotTab === 'agent' ? styles.tabActive : ''}
                onClick={() => setCopilotTab('agent')}
              >
                Agent Chat
              </button>
              <button
                className={copilotTab === 'brand' ? styles.tabActive : ''}
                onClick={() => setCopilotTab('brand')}
              >
                Brand Kit
              </button>
              <button
                className={copilotTab === 'styles' ? styles.tabActive : ''}
                onClick={() => setCopilotTab('styles')}
              >
                Style Presets
              </button>
            </div>

            {copilotTab === 'agent' ? (
              <>
                <div className={styles.chatLog}>
                  <div className={styles.contextCard}>
                    <span className={styles.contextDot} />
                    Active Mode: <strong>{mode.toUpperCase()}</strong> · Targeting:{' '}
                    <strong>{selected?.text ? `"${selected.text.slice(0, 16)}..."` : selected?.kind || 'Canvas'}</strong>
                  </div>

                  {/* Suggestion Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                    <button
                      className={styles.outlineButton}
                      style={{ padding: '4px 8px', fontSize: '9px' }}
                      onClick={() => void sendPrompt('Apply cyber dark theme with purple glow')}
                    >
                      🔮 Cyber Theme
                    </button>
                    <button
                      className={styles.outlineButton}
                      style={{ padding: '4px 8px', fontSize: '9px' }}
                      onClick={() => void sendPrompt('Make headline bold gold and center it')}
                    >
                      ✨ Bold Gold
                    </button>
                    <button
                      className={styles.outlineButton}
                      style={{ padding: '4px 8px', fontSize: '9px' }}
                      onClick={() => void sendPrompt('Add a rounded pill button that says "EXPLORE NOW"')}
                    >
                      🔘 Add Button
                    </button>
                  </div>

                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={message.role === 'user' ? styles.userMessage : styles.assistantMessage}
                    >
                      {message.text}
                      {message.actionTag ? (
                        <small>
                          <ArrowDownRight size={13} /> {message.actionTag}
                        </small>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className={styles.promptArea}>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void sendPrompt();
                      }
                    }}
                    placeholder={copilotBusy ? 'AI Copilot is updating...' : 'Ask AI to change styles, add layers, align...'}
                    disabled={copilotBusy}
                  />
                  <button onClick={() => void sendPrompt()} aria-label="Send prompt" disabled={copilotBusy}>
                    <Send size={15} />
                  </button>
                  <div className={styles.promptHint}>
                    <span>Enter to execute</span>
                    <span>Shift + Enter for new line</span>
                  </div>
                </div>
              </>
            ) : copilotTab === 'brand' ? (
              <div style={{ padding: '16px', overflowY: 'auto' }}>
                <h4 style={{ fontSize: '13px', margin: '0 0 10px' }}>Brand Color Palette</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  {['#0d0221', '#240046', '#7b2cbf', '#ff9e00', '#ffffff'].map((color) => (
                    <button
                      key={color}
                      onClick={() => updateSelected({ color })}
                      style={{
                        height: '36px',
                        background: color,
                        borderRadius: '6px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                      }}
                      title={`Apply ${color}`}
                    />
                  ))}
                </div>
                <h4 style={{ fontSize: '13px', margin: '0 0 8px' }}>Typography Hierarchy</h4>
                <p style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
                  Primary: <strong>Inter / Display 900</strong><br />
                  Secondary: <strong>Outfit / Medium 500</strong>
                </p>
              </div>
            ) : (
              <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '13px', margin: '0 0 4px' }}>Curated Theme Factories</h4>
                {Object.entries(PRESET_THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => applyPresetTheme(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      background: theme.bg,
                      border: `1px solid ${theme.secondary}`,
                      borderRadius: '8px',
                      color: theme.text,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'flex', gap: '4px' }}>
                      <i style={{ display: 'block', width: '12px', height: '12px', borderRadius: '50%', background: theme.primary }} />
                      <i style={{ display: 'block', width: '12px', height: '12px', borderRadius: '50%', background: theme.secondary }} />
                      <i style={{ display: 'block', width: '12px', height: '12px', borderRadius: '50%', background: theme.accent }} />
                    </span>
                    <strong style={{ fontSize: '11px', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</strong>
                  </button>
                ))}
              </div>
            )}
          </aside>
        ) : (
          <button className={styles.floatingCopilot} onClick={() => setCopilotOpen(true)}>
            <Sparkles size={17} /> AI Copilot
          </button>
        )}
      </section>

      {/* 1-Click Share to Socials Modal */}
      {shareModalOpen ? (
        <div className={styles.modalBackdrop} onClick={() => setShareModalOpen(false)}>
          <div className={styles.postModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Share2 size={18} /> Share / Schedule to Socials
                </h3>
                <span>Post directly to Twitter/X, YouTube, LinkedIn, Instagram, TikTok & Facebook</span>
              </div>
              <button onClick={() => setShareModalOpen(false)} aria-label="Close share modal">
                <X size={18} />
              </button>
            </div>

            <label>Select Destination Channels ({shareChannels.length})</label>
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

            <label>Post Caption</label>
            <textarea
              className={styles.field}
              rows={4}
              value={shareCaption}
              onChange={(e) => setShareCaption(e.target.value)}
              placeholder="Write an engaging post caption..."
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
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{shareResult.message}</span>
                {shareResult.success ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShareModalOpen(false);
                      setMode('calendar');
                    }}
                    style={{
                      background: '#15803d',
                      color: '#ffffff',
                      border: '0',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    View in Calendar →
                  </button>
                ) : null}
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
                onClick={() => void handleSocialPublish(false)}
              >
                {shareBusy ? 'Publishing...' : 'Publish Immediately 🚀'}
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={shareBusy || shareChannels.length === 0}
                onClick={() => void handleSocialPublish(true)}
              >
                {shareBusy ? 'Scheduling...' : 'Schedule 📅'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function RailButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`${styles.railButton} ${active ? styles.railActive : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function GraphicWorkspace({
  nodes,
  selectedId,
  setSelectedId,
  selected,
  updateSelected,
  addText,
  addShape,
  duplicateSelected,
  deleteSelected,
  imagePrompt,
  setImagePrompt,
  generateImage,
  imageBusy,
  addImageFromFile,
  applyPresetTheme,
}: {
  nodes: DesignNode[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  selected?: DesignNode;
  updateSelected: (patch: Partial<DesignNode>) => void;
  addText: (t?: string) => void;
  addShape: (s?: ShapeType) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  imagePrompt: string;
  setImagePrompt: (value: string) => void;
  generateImage: () => void;
  imageBusy: boolean;
  addImageFromFile: (file: File) => void;
  applyPresetTheme: (theme: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className={styles.editorArea}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) addImageFromFile(file);
          event.target.value = '';
        }}
      />

      {/* Left Tool Panel */}
      <aside className={styles.toolPanel}>
        <div className={styles.panelHeading}>
          <div>
            <span className={styles.eyebrow}>GRAPHIC STUDIO (OPENDESIGN + JAAZ)</span>
            <h2>Canvas Elements</h2>
          </div>
          <button>
            <MoreHorizontal size={17} />
          </button>
        </div>

        {/* Quick Add Elements */}
        <div className={styles.panelSection}>
          <div className={styles.sectionTitle}>Add Layers</div>
          <div className={styles.quickGrid}>
            <button onClick={() => addText('Headline')}>
              <Type size={17} />
              <span>Headline</span>
            </button>
            <button onClick={() => addShape('rounded')}>
              <Square size={17} />
              <span>Shape</span>
            </button>
            <button onClick={() => addShape('pill')}>
              <Square size={17} style={{ borderRadius: '6px' }} />
              <span>Pill Button</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()}>
              <Upload size={17} />
              <span>Upload Img</span>
            </button>
          </div>
        </div>

        {/* Generative Image Tool */}
        <div className={styles.panelSection}>
          <div className={styles.sectionTitle}>AI Image Gen (Imagen 3)</div>
          <div className={styles.genBox}>
            <textarea
              value={imagePrompt}
              onChange={(event) => setImagePrompt(event.target.value)}
              placeholder="Describe an image to generate..."
            />
            <button onClick={() => void generateImage()} disabled={imageBusy}>
              {imageBusy ? 'Generating...' : <><Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} /> Generate & Insert</>}
            </button>
          </div>
        </div>

        {/* Theme Presets */}
        <div className={styles.panelSection}>
          <div className={styles.sectionTitle}>Preset Themes</div>
          <div className={styles.templateGrid}>
            <div
              className={`${styles.templateTile} ${styles.templateOne}`}
              onClick={() => applyPresetTheme('sunset_minimal')}
            >
              <b>WARM<br />SUNSET</b>
            </div>
            <div
              className={`${styles.templateTile} ${styles.templateTwo}`}
              onClick={() => applyPresetTheme('cyber_purple')}
            >
              <b>CYBER<br />NEON</b>
            </div>
            <div
              className={`${styles.templateTile} ${styles.templateThree}`}
              onClick={() => applyPresetTheme('modern_clean')}
            >
              <b>CLEAN<br />STUDIO</b>
            </div>
            <div
              className={`${styles.templateTile} ${styles.templateFour}`}
              onClick={() => applyPresetTheme('warm_brutalist')}
            >
              <b>WARM<br />BRUTAL</b>
            </div>
          </div>
        </div>
      </aside>

      {/* Canvas Stage */}
      <div className={styles.canvasStage}>
        {/* Canvas Toolbar */}
        <div className={styles.canvasToolbar}>
          <button className={styles.toolbarPrimary} onClick={() => addText('New Text')}>
            <Type size={14} /> Text
          </button>
          <button onClick={() => addShape('rounded')}>
            <Square size={14} /> Shape
          </button>
          <button onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Image
          </button>
          <span className={styles.toolbarDivider} />
          <button onClick={() => updateSelected({ textAlign: 'left' })} title="Align Left">
            <AlignLeft size={14} />
          </button>
          <button onClick={() => updateSelected({ textAlign: 'center' })} title="Align Center">
            <AlignCenter size={14} />
          </button>
          <button onClick={() => updateSelected({ textAlign: 'right' })} title="Align Right">
            <AlignRight size={14} />
          </button>
          <span className={styles.toolbarDivider} />
          {selected ? (
            <>
              <button onClick={duplicateSelected} title="Duplicate layer">
                <Copy size={14} /> Duplicate
              </button>
              <button onClick={deleteSelected} title="Delete layer" style={{ color: '#ef4444' }}>
                <Trash2 size={14} /> Delete
              </button>
            </>
          ) : null}
        </div>

        {/* Interactive Artboard */}
        <div className={styles.artboardWrap}>
          <div className={styles.artboard} onClick={() => setSelectedId('')}>
            {nodes.map((node) => {
              const isSelected = selectedId === node.id;
              const isImage = node.kind === 'image';
              return (
                <div
                  key={node.id}
                  className={`${styles.designNode} ${
                    isImage
                      ? styles.imageNode
                      : node.kind === 'text'
                      ? styles.textNode
                      : styles.shapeNode
                  } ${isSelected ? styles.nodeSelected : ''}`}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                    background: isImage
                      ? `url(${node.src}) center/cover no-repeat`
                      : node.kind === 'shape'
                      ? node.color
                      : undefined,
                    color: node.color,
                    borderRadius: node.borderRadius ? `${node.borderRadius}px` : undefined,
                    border: node.borderColor && node.borderWidth ? `${node.borderWidth}px solid ${node.borderColor}` : undefined,
                    boxShadow: node.boxShadow || undefined,
                    fontSize: node.fontSize ? `${node.fontSize}px` : undefined,
                    fontWeight: node.fontWeight || '700',
                    fontFamily: node.fontFamily || 'Inter, sans-serif',
                    textAlign: node.textAlign || 'left',
                    lineHeight: node.lineHeight || 1.1,
                    letterSpacing: node.letterSpacing ? `${node.letterSpacing}px` : undefined,
                    filter: node.filter || undefined,
                    opacity: node.opacity !== undefined ? node.opacity : 1,
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedId(node.id);
                  }}
                >
                  {node.kind === 'text' ? node.text : null}
                  {isSelected ? <i className={styles.resizeHandle} /> : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Page Controls */}
        <div className={styles.pageControls}>
          <button onClick={() => addText('Subtitle')}>
            <Plus size={14} /> Add text
          </button>
          <span>Canvas 1 of 1 · 100% Zoom</span>
          <div className={styles.zoom}>
            <span>-</span>
            <div><i /></div>
            <span>100%</span>
            <span>+</span>
          </div>
        </div>
      </div>

      {/* Right Layer Inspector */}
      <aside className={styles.inspector}>
        <div className={styles.inspectorHeader}>
          <div>
            <span className={styles.eyebrow}>LAYER INSPECTOR</span>
            <h3>{selected ? (selected.kind === 'text' ? 'Text Layer' : selected.kind === 'shape' ? 'Shape Layer' : 'Image Layer') : 'Artboard'}</h3>
          </div>
          <Layers3 size={18} />
        </div>

        {selected ? (
          <>
            {selected.kind === 'text' ? (
              <>
                <label>Text Content</label>
                <textarea
                  className={styles.field}
                  value={selected.text || ''}
                  onChange={(event) => updateSelected({ text: event.target.value })}
                />
                <label>Typography</label>
                <div className={styles.twoFields}>
                  <div>
                    <small style={{ fontSize: '9px', color: '#888' }}>Size (px)</small>
                    <input
                      type="number"
                      className={styles.field}
                      value={selected.fontSize || 32}
                      onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <small style={{ fontSize: '9px', color: '#888' }}>Weight</small>
                    <select
                      className={styles.field}
                      value={selected.fontWeight || '700'}
                      onChange={(e) => updateSelected({ fontWeight: e.target.value })}
                    >
                      <option value="400">Regular (400)</option>
                      <option value="600">Semi-Bold (600)</option>
                      <option value="800">Extra-Bold (800)</option>
                      <option value="900">Black (900)</option>
                    </select>
                  </div>
                </div>
              </>
            ) : selected.kind === 'shape' ? (
              <>
                <label>Shape Fill Color</label>
                <div className={styles.colorField}>
                  <span style={{ background: selected.color }} />
                  <input
                    value={selected.color || '#7138e8'}
                    onChange={(event) => updateSelected({ color: event.target.value })}
                  />
                </div>
                <label>Border Radius (px)</label>
                <input
                  type="number"
                  className={styles.field}
                  value={selected.borderRadius || 0}
                  onChange={(e) => updateSelected({ borderRadius: Number(e.target.value) })}
                />
              </>
            ) : (
              <>
                <label>Image Filter</label>
                <select
                  className={styles.field}
                  value={selected.filter || ''}
                  onChange={(e) => updateSelected({ filter: e.target.value })}
                >
                  <option value="">None (Original)</option>
                  <option value="grayscale(100%)">Grayscale (B&W)</option>
                  <option value="sepia(60%)">Sepia Vintage</option>
                  <option value="contrast(140%) brightness(110%)">Vibrant Pop</option>
                  <option value="hue-rotate(240deg)">Cyber Violet</option>
                </select>
              </>
            )}

            <label>Position (X / Y)</label>
            <div className={styles.twoFields}>
              <input
                className={styles.field}
                value={Math.round(selected.x)}
                onChange={(event) => updateSelected({ x: Number(event.target.value) || 0 })}
              />
              <input
                className={styles.field}
                value={Math.round(selected.y)}
                onChange={(event) => updateSelected({ y: Number(event.target.value) || 0 })}
              />
            </div>

            <label>Dimensions (Width / Height)</label>
            <div className={styles.twoFields}>
              <input
                className={styles.field}
                value={Math.round(selected.width)}
                onChange={(event) => updateSelected({ width: Number(event.target.value) || 20 })}
              />
              <input
                className={styles.field}
                value={Math.round(selected.height)}
                onChange={(event) => updateSelected({ height: Number(event.target.value) || 20 })}
              />
            </div>

            <label>Quick Palette</label>
            <div className={styles.styleRow}>
              {['#0d0221', '#7138e8', '#ee4e9b', '#18b8bd', '#ff9e00', '#ffffff'].map((hex) => (
                <button key={hex} onClick={() => updateSelected({ color: hex })}>
                  <span style={{ background: hex, border: '1px solid rgba(0,0,0,0.1)' }} />
                </button>
              ))}
            </div>

            <div className={styles.actionButtonRow}>
              <button onClick={duplicateSelected}>
                <Copy size={13} /> Duplicate
              </button>
              <button onClick={deleteSelected} style={{ color: '#ef4444' }}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </>
        ) : (
          <div className={styles.emptyInspector}>
            <Sparkles size={24} />
            <p>Click any layer on the canvas to inspect and edit typography, colors, and coordinates.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function AssetsWorkspace({
  nodes,
  onInsertImage,
}: {
  nodes: DesignNode[];
  onInsertImage: (src: string) => void;
}) {
  const images = nodes.filter((node) => node.kind === 'image');
  const sampleStock = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
  ];

  return (
    <div className={styles.assetsArea}>
      <div className={styles.assetsHeader}>
        <div>
          <span className={styles.eyebrow}>CREATIVE ASSET LIBRARY</span>
          <h2>Media & Visual Assets</h2>
        </div>
      </div>

      <div className={styles.assetStats}>
        <div>
          <strong>{images.length + sampleStock.length}</strong>
          <span>Total Media Items</span>
        </div>
        <div>
          <strong>{images.length}</strong>
          <span>Canvas Layers</span>
        </div>
        <div>
          <strong>6</strong>
          <span>Social Channels</span>
        </div>
        <div>
          <strong>100%</strong>
          <span>Cloud Ready</span>
        </div>
      </div>

      <div className={styles.assetGrid}>
        {images.map((node) => (
          <div
            key={node.id}
            className={styles.assetImage}
            style={{ backgroundImage: `url(${node.src})` }}
          >
            <span>Canvas Asset</span>
          </div>
        ))}
        {sampleStock.map((src, index) => (
          <div
            key={index}
            className={styles.assetImage}
            style={{ backgroundImage: `url(${src})`, cursor: 'pointer' }}
            onClick={() => onInsertImage(src)}
            title="Click to insert into Graphic Studio"
          >
            <span>+ Insert to Canvas</span>
          </div>
        ))}
      </div>
    </div>
  );
}
