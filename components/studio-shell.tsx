'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownRight,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  FolderOpen,
  Image as ImageIcon,
  Layers3,
  LayoutTemplate,
  MessageSquare,
  MoreHorizontal,
  Play,
  Plus,
  Send,
  Settings,
  Sparkles,
  Square,
  Type,
  Upload,
  Video,
  WandSparkles,
  X,
} from 'lucide-react';
import type { DesignNode, StudioMode } from '@/lib/types';
import { applyEditorActions } from '@/lib/editor-actions';
import { firebaseAuth, googleProvider } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { CalendarWorkspace } from './calendar-workspace';
import styles from './studio-shell.module.css';

const initialNodes: DesignNode[] = [
  { id: 'headline', kind: 'text', x: 86, y: 92, width: 310, height: 80, text: 'Make room for\nbetter ideas.', color: '#17171b' },
  { id: 'purple-card', kind: 'shape', x: 72, y: 210, width: 270, height: 174, color: '#7138e8' },
  { id: 'pink-star', kind: 'shape', x: 366, y: 236, width: 148, height: 148, color: '#ee4e9b' },
  { id: 'caption', kind: 'text', x: 86, y: 426, width: 350, height: 44, text: 'A visual workspace for the whole story.', color: '#68636f' },
];

const modes: Array<{ id: StudioMode; label: string; hint: string }> = [
  { id: 'agent', label: 'AI Agent', hint: 'Gemini Flash' },
  { id: 'graphic', label: 'Graphic Studio', hint: 'Resit Canvas' },
  { id: 'video', label: 'Video Studio', hint: 'Veo' },
  { id: 'calendar', label: 'Social Scheduler', hint: 'Calendar' },
];

export function StudioShell() {
  const [mode, setMode] = useState<StudioMode>('graphic');
  const [nodes, setNodes] = useState(initialNodes);
  const [selectedId, setSelectedId] = useState('headline');
  const [copilotOpen, setCopilotOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [copilotBusy, setCopilotBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageBusy, setImageBusy] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'I can work with the selected object, the whole page, or a rough annotation. Try asking me to change the layout.' },
  ]);

  const selected = nodes.find((node) => node.id === selectedId);

  useEffect(() => {
    if (!firebaseAuth) return;
    return onAuthStateChanged(firebaseAuth, setUser);
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('resit:untitled-campaign:nodes');
      if (stored) {
        const parsed = JSON.parse(stored) as DesignNode[];
        if (Array.isArray(parsed)) setNodes(parsed);
      }
    } catch {
      // Demo mode should remain usable when local storage is unavailable.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem('resit:untitled-campaign:nodes', JSON.stringify(nodes));
  }, [hydrated, nodes]);

  function addText() {
    const id = `text-${Date.now()}`;
    setNodes((current) => [...current, { id, kind: 'text', x: 180, y: 500, width: 250, height: 48, text: 'New text', color: '#17171b' }]);
    setSelectedId(id);
    setMode('graphic');
  }

  function addShape() {
    const id = `shape-${Date.now()}`;
    setNodes((current) => [...current, { id, kind: 'shape', x: 190, y: 500, width: 160, height: 100, color: '#18b8bd' }]);
    setSelectedId(id);
    setMode('graphic');
  }

  function updateSelected(patch: Partial<DesignNode>) {
    setNodes((current) => current.map((node) => node.id === selectedId ? { ...node, ...patch } : node));
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
      const result = await response.json() as { dataUrl?: string; error?: string };
      if (!result.dataUrl) {
        setMessages((current) => [...current, { role: 'assistant', text: result.error || 'Image generation failed.' }]);
        return;
      }
      const id = `image-${Date.now()}`;
      setNodes((current) => [...current, { id, kind: 'image', x: 120, y: 130, width: 320, height: 320, src: result.dataUrl }]);
      setSelectedId(id);
      setMode('graphic');
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: 'Image generation is unavailable. Check the server configuration.' }]);
    } finally {
      setImageBusy(false);
    }
  }

  async function handleSignIn() {
    if (!firebaseAuth || !googleProvider) return;
    try { await signInWithPopup(firebaseAuth, googleProvider); } catch { /* user cancelled or configuration issue */ }
  }

  async function handleSignOut() {
    if (!firebaseAuth) return;
    await signOut(firebaseAuth);
  }

  function addImageFromFile(file: File) {
    const url = URL.createObjectURL(file);
    const id = `upload-${Date.now()}`;
    setNodes((current) => [...current, { id, kind: 'image', x: 120, y: 130, width: 320, height: 320, src: url }]);
    setSelectedId(id);
    setMode('graphic');
  }

  async function sendPrompt() {
    const text = prompt.trim();
    if (!text || copilotBusy) return;
    setMessages((current) => [...current, { role: 'user', text }]);
    setPrompt('');
    setCopilotBusy(true);
    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: text, selected, nodes }),
      });
      const result = await response.json() as { text?: string; error?: string; actions?: unknown[] };
      const changes = applyEditorActions(nodes, result.actions || []);
      if (changes.applied) {
        setNodes(changes.nodes);
        const newSelection = changes.nodes.find((node) => !nodes.some((previous) => previous.id === node.id));
        if (newSelection) setSelectedId(newSelection.id);
      }
      setMessages((current) => [...current, {
        role: 'assistant',
        text: result.text || result.error || 'The Copilot could not complete that request.',
      }]);
    } catch {
      setMessages((current) => [...current, {
        role: 'assistant',
        text: 'The Copilot is unavailable. Check the server configuration and try again.',
      }]);
    } finally {
      setCopilotBusy(false);
    }
  }

  return (
    <main className={styles.appShell}>
      <header className={styles.topbar}>
        <div className={styles.brandBlock}>
          <div className={styles.logo}><Sparkles size={19} strokeWidth={2.6} /></div>
          <div><strong>Resit</strong><span>Creative Studio</span></div>
          <span className={styles.proBadge}>OPEN SOURCE</span>
        </div>
        <nav className={styles.modeNav} aria-label="Studio modes">
          {modes.map((item) => (
            <button key={item.id} className={`${styles.modeButton} ${mode === item.id ? styles.modeActive : ''}`} onClick={() => setMode(item.id)}>
              {item.id === 'agent' ? <Sparkles size={16} /> : item.id === 'graphic' ? <Layers3 size={16} /> : item.id === 'video' ? <Video size={16} /> : <CalendarDays size={16} />}
              <span>{item.label}</span><small>{item.hint}</small>
            </button>
          ))}
        </nav>
        <div className={styles.topActions}>
          {user ? <button className={styles.authChip} onClick={() => void handleSignOut()} title={`Signed in as ${user.displayName || user.email || 'Resit user'}`}>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</button> : firebaseAuth ? <button className={styles.outlineButton} onClick={() => void handleSignIn()}><span className={styles.authDot} /> Sign in</button> : null}
          <button className={styles.outlineButton}><Settings size={16} /> Settings</button>
          <button className={styles.copilotButton} onClick={() => setCopilotOpen((current) => !current)}><Sparkles size={17} /> AI Copilot <span>{copilotOpen ? 'Hide' : 'Show'}</span></button>
        </div>
      </header>

      <div className={styles.workspaceBar}>
        <div className={styles.workspaceTitle}><FolderOpen size={17} /> Untitled campaign <ChevronDown size={15} /></div>
        <div className={styles.workspaceMeta}><span className={styles.saved}><Check size={13} /> Saved locally</span><span>Instagram Post 1:1</span></div>
        <div className={styles.workspaceActions}><button><Download size={16} /> Export</button><button className={styles.shareButton}>Share</button></div>
      </div>

      <section className={`${styles.body} ${copilotOpen ? '' : styles.bodyWide}`}>
        <aside className={styles.leftRail}>
          <RailButton icon={<LayoutTemplate />} label="Templates" active={mode === 'graphic'} onClick={() => setMode('graphic')} />
          <RailButton icon={<Square />} label="Elements" onClick={addShape} />
          <RailButton icon={<Type />} label="Text" onClick={addText} />
          <RailButton icon={<WandSparkles />} label="AI Tools" onClick={() => setMode('agent')} />
          <RailButton icon={<Upload />} label="Uploads" onClick={() => setMode('assets')} />
          <RailButton icon={<FolderOpen />} label="Projects" onClick={() => setMode('assets')} />
          <div className={styles.railSpacer} />
          <RailButton icon={<Settings />} label="Settings" onClick={() => undefined} />
        </aside>

        {mode === 'graphic' || mode === 'agent' ? <GraphicWorkspace nodes={nodes} selectedId={selectedId} setSelectedId={setSelectedId} selected={selected} updateSelected={updateSelected} addText={addText} addShape={addShape} imagePrompt={imagePrompt} setImagePrompt={setImagePrompt} generateImage={generateImage} imageBusy={imageBusy} addImageFromFile={addImageFromFile} /> : null}
        {mode === 'video' ? <VideoWorkspace /> : null}
        {mode === 'calendar' ? <CalendarWorkspace /> : null}
        {mode === 'assets' ? <AssetsWorkspace nodes={nodes} /> : null}

        {copilotOpen ? <aside className={styles.copilot}>
          <div className={styles.copilotHeader}><div><Sparkles size={17} /><strong>Studio AI Copilot</strong><span>Gemini Flash</span></div><button aria-label="Close copilot" onClick={() => setCopilotOpen(false)}><X size={18} /></button></div>
          <div className={styles.copilotTabs}><button className={styles.tabActive}>Agent</button><button>Brand Kit</button><button>Style Catalog</button></div>
          <div className={styles.chatLog}>
            <div className={styles.contextCard}><span className={styles.contextDot} /> Editing <strong>{selected?.text ? 'selected text' : 'current page'}</strong></div>
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={message.role === 'user' ? styles.userMessage : styles.assistantMessage}>{message.text}{message.role === 'assistant' && index > 0 ? <small><ArrowDownRight size={13} /> proposed action</small> : null}</div>)}
          </div>
          <div className={styles.promptArea}><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendPrompt(); } }} placeholder={copilotBusy ? 'Gemini is thinking...' : 'Ask AI to edit the design...'} disabled={copilotBusy} /><button onClick={() => void sendPrompt()} aria-label="Send prompt" disabled={copilotBusy}><Send size={17} /></button><div className={styles.promptHint}><span>Enter to send</span><span>Shift + Enter for a new line</span></div></div>
        </aside> : <button className={styles.floatingCopilot} onClick={() => setCopilotOpen(true)}><Sparkles size={17} /> Copilot</button>}
      </section>
    </main>
  );
}

function RailButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return <button className={`${styles.railButton} ${active ? styles.railActive : ''}`} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function GraphicWorkspace({ nodes, selectedId, setSelectedId, selected, updateSelected, addText, addShape, imagePrompt, setImagePrompt, generateImage, imageBusy, addImageFromFile }: { nodes: DesignNode[]; selectedId: string; setSelectedId: (id: string) => void; selected?: DesignNode; updateSelected: (patch: Partial<DesignNode>) => void; addText: () => void; addShape: () => void; imagePrompt: string; setImagePrompt: (value: string) => void; generateImage: () => void; imageBusy: boolean; addImageFromFile: (file: File) => void }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  return <div className={styles.editorArea}>
    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) addImageFromFile(file); event.target.value = ''; }} />
    <aside className={styles.toolPanel}>
      <div className={styles.panelHeading}><div><span className={styles.eyebrow}>GRAPHIC STUDIO</span><h2>Build a visual</h2></div><button><MoreHorizontal size={17} /></button></div>
      <div className={styles.searchBox}><span>Search templates, photos, styles</span><span>/</span></div>
      <div className={styles.panelSection}><div className={styles.sectionTitle}>Quick add</div><div className={styles.quickGrid}><button onClick={addText}><Type size={19} /><span>Text</span></button><button onClick={addShape}><Square size={19} /><span>Shape</span></button><button><ImageIcon size={19} /><span>Image</span></button><button onClick={() => setSelectedId('')}><WandSparkles size={19} /><span>AI edit</span></button></div></div>
      <div className={styles.panelSection}><div className={styles.sectionTitle}>Generate with Nano Banana</div><div className={styles.genBox}><textarea value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} placeholder="Describe an image..." /><button onClick={() => void generateImage()} disabled={imageBusy}>{imageBusy ? 'Generating...' : 'Generate'}</button></div></div>
      <div className={styles.panelSection}><div className={styles.sectionTitle}>Templates</div><div className={styles.templateGrid}><div className={`${styles.templateTile} ${styles.templateOne}`}><b>SUMMER<br />STUDIO</b></div><div className={`${styles.templateTile} ${styles.templateTwo}`}><b>make<br />space</b></div><div className={`${styles.templateTile} ${styles.templateThree}`}><b>NEW<br />DROP</b></div><div className={`${styles.templateTile} ${styles.templateFour}`}><b>good<br />things</b></div></div></div>
      <div className={styles.panelSection}><div className={styles.sectionTitle}>Design system</div><div className={styles.brandRow}><span className={styles.brandSwatch} /><div><strong>Resit Studio</strong><small>4 colors, 3 type styles</small></div><ChevronDown size={15} /></div></div>
    </aside>
    <div className={styles.canvasStage}>
      <div className={styles.canvasToolbar}><button className={styles.toolbarPrimary}><Sparkles size={16} /> Ask Resit</button><span className={styles.toolbarDivider} /><button onClick={addText}><Type size={15} /> Text</button><button onClick={addShape}><Square size={15} /> Shape</button><button onClick={() => fileInputRef.current?.click()}><Upload size={15} /> Upload</button><span className={styles.toolbarDivider} /><button>Undo</button><button>Redo</button></div>
      <div className={styles.artboardWrap}><div className={styles.artboard} onClick={() => setSelectedId('')}>
        {nodes.map((node) => {
          const isImage = node.kind === 'image';
          return <button key={node.id} className={`${styles.designNode} ${isImage ? styles.imageNode : node.kind === 'text' ? styles.textNode : node.kind === 'annotation' ? styles.annotationNode : styles.shapeNode} ${selectedId === node.id ? styles.nodeSelected : ''}`} style={{ left: node.x, top: node.y, width: node.width, height: node.height, background: isImage ? `url(${node.src}) center/cover no-repeat` : node.kind === 'shape' ? node.color : undefined, color: node.color }} onClick={(event) => { event.stopPropagation(); setSelectedId(node.id); }}><span>{node.text}</span>{selectedId === node.id ? <i className={styles.resizeHandle} /> : null}</button>;
        })}
        <div className={styles.annotationArrow}><ArrowDownRight size={36} /><span>AI reads this too</span></div>
      </div></div>
      <div className={styles.pageControls}><button><Plus size={15} /> Add page</button><span>Page 1 of 1</span><div className={styles.zoom}><span>-</span><div><i /></div><span>72%</span><span>+</span></div></div>
    </div>
    <aside className={styles.inspector}>
      <div className={styles.inspectorHeader}><div><span className={styles.eyebrow}>INSPECTOR</span><h3>{selected ? selected.kind === 'text' ? 'Text layer' : 'Shape layer' : 'Page'}</h3></div><Layers3 size={18} /></div>
      {selected ? <><label>Content</label>{selected.kind === 'text' ? <textarea className={styles.field} value={selected.text || ''} onChange={(event) => updateSelected({ text: event.target.value })} /> : selected.kind === 'image' ? <div className={styles.imageNote}>Generated image layer. Resize or reposition it on the canvas.</div> : <div className={styles.colorField}><span style={{ background: selected.color }} /><input value={selected.color || ''} onChange={(event) => updateSelected({ color: event.target.value })} /></div>}<label>Position</label><div className={styles.twoFields}><input className={styles.field} value={Math.round(selected.x)} onChange={(event) => updateSelected({ x: Number(event.target.value) || 0 })} /><input className={styles.field} value={Math.round(selected.y)} onChange={(event) => updateSelected({ y: Number(event.target.value) || 0 })} /></div><label>Quick style</label><div className={styles.styleRow}><button onClick={() => updateSelected({ color: '#17171b' })}><span style={{ background: '#17171b' }} /></button><button onClick={() => updateSelected({ color: '#7138e8' })}><span style={{ background: '#7138e8' }} /></button><button onClick={() => updateSelected({ color: '#ee4e9b' })}><span style={{ background: '#ee4e9b' }} /></button><button onClick={() => updateSelected({ color: '#18b8bd' })}><span style={{ background: '#18b8bd' }} /></button></div></> : <div className={styles.emptyInspector}><Sparkles size={22} /><p>Select an element to edit it manually, or ask the Copilot to make a change.</p></div>}
    </aside>
  </div>;
}

function VideoWorkspace() {
  return <div className={styles.videoArea}><div className={styles.videoTop}><div><span className={styles.eyebrow}>VIDEO STUDIO</span><h2>Product launch / vertical cut</h2></div><button className={styles.toolbarPrimary}><Sparkles size={16} /> Generate with Veo</button></div><div className={styles.videoPreview}><div className={styles.videoFrame}><div className={styles.videoOrb} /><strong>YOUR<br />NEXT<br />FRAME</strong><small>00:04.8</small></div><button className={styles.playButton}><Play size={22} fill="currentColor" /></button></div><div className={styles.timeline}><div className={styles.ruler}><span>00:00</span><span>00:05</span><span>00:10</span><span>00:15</span><span>00:20</span></div><TimelineRow label="Elements"><div className={`${styles.clip} ${styles.clipPurple}`}>Headline reveal</div><div className={`${styles.clip} ${styles.clipPink}`}>Product shot</div></TimelineRow><TimelineRow label="Media"><div className={`${styles.clip} ${styles.clipTeal}`}>Generated video / Veo</div><div className={`${styles.clip} ${styles.clipBlue}`}>Logo outro</div></TimelineRow><TimelineRow label="Audio"><div className={`${styles.clip} ${styles.clipAudio}`}>Voiceover and captions</div></TimelineRow></div></div>;
}

function TimelineRow({ label, children }: { label: string; children: React.ReactNode }) { return <div className={styles.timelineRow}><span>{label}</span><div className={styles.track}>{children}</div></div>; }

function AssetsWorkspace({ nodes }: { nodes: DesignNode[] }) {
  const images = nodes.filter((node) => node.kind === 'image');
  const generated = images.filter((node) => node.id.startsWith('image-')).length;
  const uploaded = images.length - generated;
  return (
    <div className={styles.assetsArea}>
      <div className={styles.assetsHeader}>
        <div><span className={styles.eyebrow}>MEDIA ASSETS</span><h2>Your creative library</h2></div>
        <button className={styles.toolbarPrimary}><Upload size={16} /> Upload media</button>
      </div>
      <div className={styles.assetStats}>
        <div><strong>{images.length}</strong><span>Canvas images</span></div>
        <div><strong>{uploaded}</strong><span>Uploaded</span></div>
        <div><strong>{generated}</strong><span>Generated</span></div>
        <div><strong>{nodes.length}</strong><span>Design layers</span></div>
      </div>
      <div className={styles.assetGrid}>
        {images.length ? images.map((node) => (
          <div key={node.id} className={styles.assetImage} style={{ backgroundImage: `url(${node.src})` }}><span>{node.id.startsWith('image-') ? 'Generated' : 'Uploaded'}</span></div>
        )) : <div className={styles.assetEmpty}><ImageIcon size={26} /><p>Generate or upload an image in the Graphic Studio to see it here.</p></div>}
      </div>
    </div>
  );
}

function AssetTile({ tone, title }: { tone: string; title: string }) { return <div className={`${styles.assetTile} ${styles[`asset${tone}`]}`}><div><ImageIcon size={22} /></div><strong>{title}</strong><small>Updated just now</small></div>; }
