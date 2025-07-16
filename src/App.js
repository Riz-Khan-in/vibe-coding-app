import React, { useState, useRef, useEffect } from "react";
import MonacoEditor from "react-monaco-editor";
import Modal from "react-modal";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import "@vscode/codicons/dist/codicon.css";

// VS Code sidebar icons
const SIDEBAR_ICONS = [
  { icon: "codicon codicon-files", label: "Files" },
  { icon: "codicon codicon-search", label: "Search" },
  { icon: "codicon codicon-git-branch", label: "Source Control" },
  { icon: "codicon codicon-run-all", label: "Run/Debug" },
  { icon: "codicon codicon-settings-gear", label: "Settings" },
];

// File templates
const LANGUAGES = [
  { type: "html", label: "HTML", icon: "codicon codicon-code", ext: ".html", sample: "<h1>Hello, Vibe!</h1>" },
  { type: "css", label: "CSS", icon: "codicon codicon-symbol-color", ext: ".css", sample: "h1 { color: #0099ff; }" },
  { type: "js", label: "JS", icon: "codicon codicon-symbol-variable", ext: ".js", sample: "console.log('Hello, JS!')" },
  { type: "py", label: "Python", icon: "codicon codicon-symbol-method", ext: ".py", sample: "print('Hello, Python!')" },
  { type: "md", label: "Markdown", icon: "codicon codicon-markdown", ext: ".md", sample: "# Hello, Markdown!" }
];

function renderMarkdown(md) {
  let html = md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
    .replace(/\*(.*)\*/gim, '<i>$1</i>')
    .replace(/\n$/gim, '<br />');
  return html;
}

function App() {
  // --- Persistent Files Setup ---
  const DEFAULT_FILES = [
    { name: "index.html", type: "html", code: "<h1>Hello, Vibe!</h1>" },
    { name: "style.css", type: "css", code: "h1 { color: #0099ff; }" },
    { name: "main.js", type: "js", code: "console.log('Hello, JS!')" }
  ];
  const [files, setFiles] = useState(() => {
    try {
      const saved = localStorage.getItem("vibe_files");
      return saved ? JSON.parse(saved) : DEFAULT_FILES;
    } catch {
      return DEFAULT_FILES;
    }
  });
  const [activeFileIdx, setActiveFileIdx] = useState(() => {
    const saved = localStorage.getItem("vibe_active");
    return saved ? Number(saved) : 0;
  });

  // Autosave files
  useEffect(() => {
    try {
      localStorage.setItem("vibe_files", JSON.stringify(files));
    } catch {}
  }, [files]);
  useEffect(() => {
    localStorage.setItem("vibe_active", activeFileIdx);
  }, [activeFileIdx]);

  // UI State
  const [showSidebar, setShowSidebar] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Fonts & themes
  const FONT_OPTIONS = [
    "Fira Mono", "Fira Code", "JetBrains Mono",
    "Cascadia Mono", "Consolas", "Menlo", "monospace"
  ];
  const [font, setFont] = useState("Fira Mono");
  const [fontSize, setFontSize] = useState(16);
  const [editorTheme, setEditorTheme] = useState("vs-dark");

  // Python/Markdown
  const [pyOutput, setPyOutput] = useState("");
  const [mdPreview, setMdPreview] = useState(renderMarkdown(files.find(f=>f.type==="md")?.code||""));

  // VS Code-like UI
  const [sidebarWidth] = useState(55);
  const [explorerWidth, setExplorerWidth] = useState(220);

  // Monaco Editor refs
  const iframeRef = useRef();
  const pyodideRef = useRef(null);

  // Command Palette
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const paletteInputRef = useRef();

  // Drag and drop state
  const [dragOver, setDragOver] = useState(false);

  // VS Code-like background
  useEffect(() => {
    document.body.style.background = darkMode
      ? "#1e1e1e"
      : "#fff";
  }, [darkMode]);

  // Markdown live preview
  useEffect(() => {
    const file = files[activeFileIdx];
    if (file?.type === "md") setMdPreview(renderMarkdown(file.code));
  }, [files, activeFileIdx]);

  // Pyodide load (Python runner)
  async function loadPyodide() {
    if (!window.loadPyodide) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
        script.onload = resolve;
        document.body.appendChild(script);
      });
    }
    if (!pyodideRef.current) {
      pyodideRef.current = await window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/" });
    }
    return pyodideRef.current;
  }
  const runPython = async () => {
    setPyOutput("Running...");
    try {
      const file = files[activeFileIdx];
      const pyodide = await loadPyodide();
      let result = await pyodide.runPythonAsync(file.code);
      setPyOutput(result !== undefined ? String(result) : "(no output)");
    } catch (e) {
      setPyOutput(String(e));
    }
  };

  // File helpers
  function addFile(type) {
    let base = LANGUAGES.find(l=>l.type===type);
    let num = files.filter(f=>f.type===type).length+1;
    let name = `${base.label.toLowerCase()}${num>1?num:""}${base.ext}`;
    setFiles([...files, {name, type, code: base.sample}]);
    setActiveFileIdx(files.length);
  }
  function removeFile(idx) {
    if (files.length === 1) return;
    setFiles(files.filter((_,i)=>i!==idx));
    setActiveFileIdx(0);
  }
  function renameFile(idx, newName) {
    setFiles(files.map((f,i)=>i===idx ? {...f, name: newName} : f));
  }

  // HTML/CSS/JS live preview
  function buildSrcDoc() {
    let html = files.filter(f=>f.type==="html").map(f=>f.code).join("\n");
    let css = files.filter(f=>f.type==="css").map(f=>f.code).join("\n");
    let js = files.filter(f=>f.type==="js").map(f=>f.code).join("\n");
    return `
      <!DOCTYPE html>
      <html lang="en"><head>
        <meta charset="UTF-8"><title>Preview</title>
        <style>${css}</style>
      </head><body>
        ${html}
        <script>
        try { ${js} }
        catch(e) { document.body.innerHTML += "<pre style='color:red'>" + e + "</pre>"; }
        <\/script>
      </body></html>
    `;
  }
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (iframeRef.current) iframeRef.current.srcdoc = buildSrcDoc();
    }, 400);
    return () => clearTimeout(timeout);
  }, [files]);

  // --- Download Project as ZIP ---
  async function downloadZip() {
    const zip = new JSZip();
    files.forEach(f => {
      zip.file(f.name, f.code);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "vibe-project.zip");
  }

  // --- Upload/Restore ZIP ---
  async function handleZipUpload(file) {
    try {
      const zip = await JSZip.loadAsync(file);
      const filePromises = [];
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          filePromises.push(
            zipEntry.async("string").then(code => {
              let ext = relativePath.split('.').pop().toLowerCase();
              let type = ["html","css","js","py","md"].includes(ext) ? ext : "txt";
              let fname = zipEntry.name;
              return { name: fname, type, code };
            })
          );
        }
      });
      const newFiles = await Promise.all(filePromises);
      if (newFiles.length > 0) {
        setFiles(newFiles);
        setActiveFileIdx(0);
      } else {
        alert("No valid files found in the ZIP!");
      }
    } catch (err) {
      alert("Failed to load ZIP: " + err);
    }
  }

  // --- Command Palette logic ---
  const COMMANDS = [
    {name: "Toggle Dark/Light Theme", action: () => setDarkMode(d => !d)},
    {name: "Add HTML File", action: () => addFile("html")},
    {name: "Add CSS File", action: () => addFile("css")},
    {name: "Add JS File", action: () => addFile("js")},
    {name: "Add Python File", action: () => addFile("py")},
    {name: "Add Markdown File", action: () => addFile("md")},
    {name: "Show/Hide Status Bar", action: () => setShowStatus(s => !s)},
    {name: "Show/Hide Sidebar", action: () => setShowSidebar(s => !s)},
  ];
  function runPaletteCommand(idx) {
    if (filteredCommands[idx]) filteredCommands[idx].action();
    setPaletteOpen(false);
    setPaletteQuery("");
  }
  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.name.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  // Keyboard shortcut for Command Palette
  useEffect(() => {
    function handleKeydown(e) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        setPaletteOpen(true);
        setTimeout(() => paletteInputRef.current?.focus(), 80);
      }
      if (paletteOpen && e.key === "Escape") setPaletteOpen(false);
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [paletteOpen]);

  // --- Drag and drop wrapper ---
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
      onDrop={e => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          if (file.name.endsWith('.zip')) handleZipUpload(file);
          else alert("Please drop a .zip file!");
        }
      }}
      style={{
        position: "relative", height: "100vh", width: "100vw",
        background: dragOver ? "rgba(36,224,143,0.07)" : undefined,
        transition: "background 0.2s"
      }}
    >
      {dragOver &&
        <div style={{
          position:"absolute",top:0,left:0,right:0,bottom:0,
          background:"rgba(36,224,143,0.25)",
          zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:36,color:"#176a41",fontWeight:"bold",pointerEvents:"none"
        }}>
          Drop ZIP to Import Project
        </div>
      }
      {/* VS Code-style Title Bar */}
      <div style={{
        height: 34, background: "#24292e",
        display: "flex", alignItems: "center", color: "#eee", fontWeight:600, fontSize:18,
        letterSpacing:".5px", userSelect:"none", paddingLeft:sidebarWidth+8
      }}>
        <span style={{fontFamily:"Consolas,monospace", fontWeight:700, letterSpacing:1, color:"#43c7ff"}}>Vibe Code</span>
        <span style={{marginLeft:12, color:"#e3e3e3",fontSize:15,fontWeight:400}}>Playground</span>
        <div style={{flex:1}}/>
        <button onClick={()=>setDarkMode(d=>!d)}
          style={{background:"none",color:"#fff",border:"none",fontSize:19,marginRight:16,cursor:"pointer"}} title="Toggle dark/light">
          {darkMode ? "🌙" : "☀️"}
        </button>
        <button
          onClick={()=>setPaletteOpen(true)}
          style={{background:"none",color:"#6ee9fa",border:"none",fontSize:18,marginRight:8,cursor:"pointer"}}
          title="Command Palette (Ctrl+Shift+P)"
        >
          <span className="codicon codicon-search" /> <span style={{fontSize:15,marginLeft:2}}>Cmd Palette</span>
        </button>
      </div>
      <div style={{flex:1,display:"flex",minHeight:0}}>
        {/* Sidebar */}
        {showSidebar &&
        <div style={{
          width:sidebarWidth, background:"#2c2c32",
          display:"flex", flexDirection:"column", alignItems:"center", paddingTop:8
        }}>
          {SIDEBAR_ICONS.map((ic,i)=>
            <button key={i} style={{
              background:"none", border:"none", color:"#9da5b4", fontSize:26,
              margin:"8px 0",cursor:"pointer"
            }} title={ic.label}>
              <span className={ic.icon}/>
            </button>
          )}
        </div>}
        {/* Explorer */}
        <div style={{
          width:explorerWidth,
          background:darkMode ? "#22252b":"#f6f7fb",
          borderRight:"1.5px solid #292e37",
          padding:"8px 0 0 0"
        }}>
          <div style={{
            fontWeight:700, fontSize:16, letterSpacing:".7px",
            color:darkMode?"#8cdcf5":"#0a3550", margin:"8px 10px"
          }}>EXPLORER</div>
          {LANGUAGES.map(lang=>
            <div key={lang.type} style={{margin:"10px 0 0 12px"}}>
              <div style={{color:"#888",fontWeight:600,fontSize:13,marginBottom:3}}>{lang.label} Files</div>
              {files.map((f,idx)=>f.type===lang.type && (
                <div
                  key={idx}
                  onClick={()=>setActiveFileIdx(idx)}
                  style={{
                    display:"flex",alignItems:"center",gap:8,padding:"4px 8px 4px 2px",
                    borderRadius:6,marginBottom:2,
                    background:activeFileIdx===idx? "#28456a": "none",
                    color:activeFileIdx===idx?"#fff":darkMode?"#d7e3ef":"#223"
                  }}>
                  <span className={lang.icon} style={{fontSize:18}}/>
                  <span>{f.name}</span>
                  <button onClick={e=>{e.stopPropagation();removeFile(idx);}}
                    style={{marginLeft:"auto",background:"none",border:"none",color:"#888",fontSize:18,cursor:"pointer"}} title="Delete">&times;</button>
                </div>
              ))}
              <button onClick={()=>addFile(lang.type)}
                style={{margin:"0 0 0 6px",background:"none",color:"#2ac",border:"none",fontSize:20,cursor:"pointer"}}
                title={`Add new ${lang.label} file`}>＋</button>
            </div>
          )}
        </div>
        {/* Main Editor Area */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,background:darkMode?"#1e1e1e":"#f4f8fa"}}>
          {/* --- Toolbar: Font/Theme Selector + Download & Upload ZIP --- */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: darkMode ? "#181c23" : "#ddebf7",
            borderBottom: darkMode ? "1.5px solid #26292e" : "1.5px solid #e2effa",
            padding: "6px 22px 6px 14px"
          }}>
            <label style={{color:darkMode ? "#b0e6ff" : "#253f5a", fontWeight:600}}>Font:
              <select value={font} onChange={e => setFont(e.target.value)} style={{marginLeft:6}}>
                {FONT_OPTIONS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
            <label style={{color:darkMode ? "#b0e6ff" : "#253f5a", fontWeight:600}}>Font Size:
              <select value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{marginLeft:6}}>
                {[13,14,15,16,18,20,22,24].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <label style={{color:darkMode ? "#b0e6ff" : "#253f5a", fontWeight:600}}>Theme:
              <select value={editorTheme} onChange={e => setEditorTheme(e.target.value)} style={{marginLeft:6}}>
                <option value="vs-dark">VS Code Dark</option>
                <option value="vs-light">VS Code Light</option>
                <option value="hc-black">High Contrast</option>
                <option value="hc-light">High Contrast Light</option>
              </select>
            </label>
            <button onClick={downloadZip} style={{
              background:"#079afc",color:"#fff",border:"none",padding:"7px 17px",
              borderRadius:8,fontWeight:"bold",marginLeft:18,cursor:"pointer"
            }}>Download ZIP</button>
            <label style={{
              background:"#45e399", color:"#144928", fontWeight:"bold",
              padding:"7px 17px", borderRadius:8, marginLeft:12, cursor:"pointer"
            }}>
              Upload ZIP
              <input
                type="file"
                accept=".zip"
                style={{ display:"none" }}
                onChange={e => {
                  if (e.target.files && e.target.files[0]) handleZipUpload(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {/* --- Tab Bar --- */}
          <div style={{
            display:"flex",alignItems:"center",height:36,background:"#23272e",borderBottom:"1.5px solid #25282f"
          }}>
            {files.map((f,idx)=>{
              let lang = LANGUAGES.find(l=>l.type===f.type);
              return (
                <div
                  key={idx}
                  onClick={()=>setActiveFileIdx(idx)}
                  style={{
                    display:"flex",alignItems:"center",gap:8,padding:"4px 16px",
                    background:activeFileIdx===idx?"#232946":"none",
                    borderRight:"1px solid #1d2128",
                    fontWeight:600,color:activeFileIdx===idx?"#0ff":"#d7e3ef",cursor:"pointer"
                  }}>
                  <span className={lang.icon} style={{fontSize:16}}/>
                  <input value={f.name}
                    style={{
                      background:"none",border:"none",color:"inherit",fontWeight:"bold",fontSize:"1em",width:90
                    }}
                    onChange={e=>renameFile(idx,e.target.value)}
                  />
                  <button onClick={e=>{e.stopPropagation();removeFile(idx);}}
                    style={{marginLeft:2,background:"none",border:"none",color:"#888",fontSize:16,cursor:"pointer"}} title="Close">&times;</button>
                </div>
              );
            })}
          </div>
          {/* --- Monaco Editor and Preview --- */}
          <div style={{flex:1,display:"flex",minHeight:0}}>
            {/* Monaco Editor */}
            <div style={{flex:2,minWidth:0,background:"#1e1e1e",display:"flex",flexDirection:"column"}}>
              <MonacoEditor
                height="100%"
                width="100%"
                language={LANGUAGES.find(l=>l.type===files[activeFileIdx].type).type==="js" ? "javascript" : files[activeFileIdx].type}
                theme={editorTheme}
                value={files[activeFileIdx].code}
                options={{
                  fontSize: fontSize,
                  fontFamily: font,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on"
                }}
                onChange={code =>
                  setFiles(files.map((f, idx) => idx === activeFileIdx ? { ...f, code } : f))
                }
              />
              {/* For Python and Markdown: Run/Preview output */}
              {files[activeFileIdx].type==="py" && (
                <div style={{
                  background:"#191e26",color:"#0ff",padding:"6px 12px",borderTop:"1.5px solid #223",fontFamily:"monospace"
                }}>
                  <button onClick={runPython} style={{
                    background:"#2ac",color:"#fff",border:"none",borderRadius:7,padding:"3px 15px",fontWeight:"bold",cursor:"pointer"
                  }}>Run ▶️</button>
                  <span style={{marginLeft:12,fontWeight:600}}>Output:</span>
                  <pre style={{display:"inline",marginLeft:12,color:"#0ff"}}>{pyOutput}</pre>
                </div>
              )}
              {files[activeFileIdx].type==="md" && (
                <div style={{
                  background:"#fff",color:"#111",padding:"10px 18px",borderTop:"1.5px solid #223",
                  minHeight:45,borderRadius:"0 0 8px 8px"
                }}>
                  <div dangerouslySetInnerHTML={{__html: mdPreview}}/>
                </div>
              )}
            </div>
            {/* Preview for HTML/CSS/JS */}
            {["html","css","js"].includes(files[activeFileIdx].type) && (
              <div style={{
                flex:1,minWidth:0,background:"#151a1e",display:"flex",flexDirection:"column"
              }}>
                <div style={{
                  fontWeight:700,fontSize:14,color:"#09f",padding:"10px 8px",background:"#181e22"
                }}>Live Preview</div>
                <iframe
                  ref={iframeRef}
                  title="Live Preview"
                  sandbox="allow-scripts allow-same-origin"
                  style={{
                    width:"100%",height:"100%",border:"none",background:"#f8fafc"
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* VS Code Status Bar */}
      {showStatus &&
      <div style={{
        height:26,background:"#26292e",color:"#bbb",display:"flex",alignItems:"center",
        fontSize:13,letterSpacing:".5px",fontFamily:"monospace",paddingLeft:sidebarWidth+6
      }}>
        <span style={{marginRight:14}}>Ln {1}, Col {1}</span>
        <span style={{marginRight:16}}>{files[activeFileIdx]?.type?.toUpperCase()||"?"}</span>
        <span style={{marginRight:16}}>Spaces: 2</span>
        <span style={{marginRight:16}}>UTF-8</span>
        <span style={{marginRight:16}}>LF</span>
        <span style={{marginRight:16}}>Vibe Code Theme</span>
        <span style={{flex:1}}/>
        <span style={{marginRight:15,fontWeight:700,color:"#35e6b6"}}>VS Code Style • {darkMode?"Dark":"Light"}</span>
      </div>}
      {/* ----- COMMAND PALETTE MODAL ----- */}
      <Modal
        isOpen={paletteOpen}
        onRequestClose={()=>setPaletteOpen(false)}
        style={{
          overlay: {background:"rgba(0,0,0,0.27)",zIndex:150},
          content: {
            top:"20%",left:"50%",right:"auto",bottom:"auto",transform:"translate(-50%,0)",
            background:darkMode?"#1e1e2e":"#f3f4f6",borderRadius:10,padding:0,
            boxShadow:"0 12px 44px #222a",width:440,maxWidth:"98vw"
          }
        }}
        ariaHideApp={false}
      >
        <div style={{padding:"15px 18px 10px 18px"}}>
          <input
            ref={paletteInputRef}
            value={paletteQuery}
            onChange={e=>setPaletteQuery(e.target.value)}
            onKeyDown={e=>{
              if (e.key === "Enter" && filteredCommands.length>0) runPaletteCommand(0);
            }}
            style={{
              width:"100%",fontSize:20,padding:"8px 10px",borderRadius:7,border:"1.5px solid #7ae",
              outline:"none",marginBottom:10,background:darkMode?"#23223a":"#f9f9fc",color:darkMode?"#fff":"#232"
            }}
            placeholder="Type a command..."
          />
          <div>
            {filteredCommands.length === 0 && <div style={{color:"#bbb"}}>No commands found</div>}
            {filteredCommands.map((cmd,i) => (
              <div
                key={i}
                style={{
                  padding:"7px 6px",cursor:"pointer",borderRadius:6,
                  background:i===0?"#27c6e4":"none",color:i===0?"#fff":darkMode?"#aeefff":"#165"
                }}
                onClick={()=>runPaletteCommand(i)}
              >
                {cmd.name}
              </div>
            ))}
          </div>
          <div style={{color:"#aaa",marginTop:12,fontSize:12}}>Press <b>ESC</b> to close.</div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
