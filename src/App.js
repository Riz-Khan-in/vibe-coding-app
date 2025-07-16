import React, { useState, useRef, useEffect } from "react";
import MonacoEditor from "react-monaco-editor";

// File icons
const FILE_ICONS = {
  html: "🟧",
  js: "🟨",
  css: "🟦"
};

// Default files
const defaultHtmlFile = i => ({ name: `index${i > 1 ? i : ""}.html`, language: "html", code: `<h1>Hello, Vibe ${i}!</h1>` });
const defaultJsFile = i => ({ name: `script${i > 1 ? i : ""}.js`, language: "javascript", code: `console.log("Vibe JS ${i}!");` });
const defaultCssFile = i => ({ name: `style${i > 1 ? i : ""}.css`, language: "css", code: `h1 { color: #0099ff; text-align:center; }` });

// Vertical resize
function useResizable(defaultHeight = 220) {
  const [height, setHeight] = useState(defaultHeight);
  const ref = useRef();
  useEffect(() => {
    const handle = ref.current;
    if (!handle) return;
    let startY, startHeight;
    const onMouseMove = e => setHeight(Math.max(120, startHeight + (e.clientY - startY)));
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    const onMouseDown = e => {
      startY = e.clientY; startHeight = height;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    handle.addEventListener('mousedown', onMouseDown);
    return () => handle.removeEventListener('mousedown', onMouseDown);
  }, [height]);
  return [height, ref];
}

// Horizontal resize for preview
function useHorizontalResizable(defaultWidth = 450, min = 280, max = 900) {
  const [width, setWidth] = useState(defaultWidth);
  const ref = useRef();
  useEffect(() => {
    const handle = ref.current;
    if (!handle) return;
    let startX, startWidth;
    const onMouseMove = e => setWidth(Math.max(min, Math.min(max, startWidth - (e.clientX - startX))));
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    const onMouseDown = e => {
      startX = e.clientX; startWidth = width;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    };
    handle.addEventListener('mousedown', onMouseDown);
    return () => handle.removeEventListener('mousedown', onMouseDown);
  }, [width]);
  return [width, ref];
}

const FONT_OPTIONS = [
  "Fira Mono", "Source Code Pro", "JetBrains Mono", "Roboto Mono",
  "Cascadia Mono", "Ubuntu Mono", "Monaco", "Menlo", "Consolas", "monospace"
];
const THEME_OPTIONS = [
  { label: "VS Code Dark (vs-dark)", value: "vs-dark" },
  { label: "VS Code Light (vs-light)", value: "vs-light" },
  { label: "Solarized Dark", value: "solarized-dark" },
  { label: "Solarized Light", value: "solarized-light" },
  { label: "High Contrast Black", value: "hc-black" },
  { label: "High Contrast Light", value: "hc-light" }
];

// Tab style
const tabStyle = (active, color, darkMode) => ({
  padding: "5px 14px 6px 12px",
  marginRight: 4,
  borderRadius: "8px 8px 0 0",
  background: active
    ? color
    : (darkMode ? "#222c" : "#e8e8e8"),
  color: active ? "#fff" : (darkMode ? "#aaa" : "#333"),
  fontWeight: active ? 700 : 500,
  border: "none",
  outline: "none",
  cursor: "pointer",
  display: "inline-flex", alignItems: "center",
  fontSize: "1.07rem",
  position: "relative",
  marginBottom: 0,
  transition: ".13s"
});

function App() {
  // File states
  const [htmlFiles, setHtmlFiles] = useState([defaultHtmlFile(1)]);
  const [activeHtml, setActiveHtml] = useState(0);
  const [jsFiles, setJsFiles] = useState([defaultJsFile(1)]);
  const [activeJs, setActiveJs] = useState(0);
  const [cssFiles, setCssFiles] = useState([defaultCssFile(1)]);
  const [activeCss, setActiveCss] = useState(0);

  // UI states
  const [darkMode, setDarkMode] = useState(true);
  const [fullScreen, setFullScreen] = useState(null);
  const [layout, setLayout] = useState("row"); // row = editors side by side, preview below; column = editors stacked, preview right
  const [font, setFont] = useState("Fira Mono");
  const [fontSize, setFontSize] = useState(15);
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [heightHTML, refHTML] = useResizable(220);
  const [heightCSS, refCSS] = useResizable(220);
  const [heightJS, refJS] = useResizable(220);
  const [previewWidth, refPreview] = useHorizontalResizable(400, 280, 900);
  const [renamingHtml, setRenamingHtml] = useState(-1);
  const [renamingJs, setRenamingJs] = useState(-1);
  const [renamingCss, setRenamingCss] = useState(-1);

  const iframeRef = useRef(null);

  // Monaco themes registration (solarized etc)
  useEffect(() => {
    if (window.monaco && window.monaco.editor) {
      try {
        window.monaco.editor.defineTheme('solarized-dark', {
          base: 'vs-dark', inherit: true, rules: [],
          colors: {
            'editor.background': '#002b36',
            'editor.foreground': '#93a1a1',
            'editorLineNumber.foreground': '#586e75',
            'editorCursor.foreground': '#d33682',
            'editor.selectionBackground': '#073642'
          }
        });
        window.monaco.editor.defineTheme('solarized-light', {
          base: 'vs', inherit: true, rules: [],
          colors: {
            'editor.background': '#fdf6e3',
            'editor.foreground': '#657b83',
            'editorLineNumber.foreground': '#93a1a1',
            'editorCursor.foreground': '#d33682',
            'editor.selectionBackground': '#eee8d5'
          }
        });
      } catch {}
    }
  }, [editorTheme]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      body {
        min-height:100vh; margin:0;
        background: ${darkMode
          ? "linear-gradient(-45deg, #222831, #313a52, #0093e9, #80d0c7)"
          : "linear-gradient(-45deg, #f7fafc 60%, #e0f2fe 100%)"
        };
        background-size: 400% 400%;
        animation: gradientBG 12s ease infinite;
        transition: background 0.5s;
      }
      @keyframes gradientBG {
        0% {background-position: 0% 50%;}
        50% {background-position: 100% 50%;}
        100% {background-position: 0% 50%;}
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, [darkMode]);

  // Generate <style> and <script> blocks for all files
  function buildSrcDoc() {
    return `
      <!DOCTYPE html>
      <html lang="en"><head>
        <meta charset="UTF-8"><title>Preview</title>
        <style>
        ${cssFiles.map(f => f.code).join("\n")}
        </style>
      </head><body>
        ${htmlFiles.map(f => f.code).join("\n")}
        <script>
        try {
          ${jsFiles.map(f => f.code).join("\n")}
        } catch (e) {
          document.body.innerHTML += "<pre style='color:red'>" + e + "</pre>";
        }
        <\/script>
      </body></html>
    `;
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = buildSrcDoc();
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [htmlFiles, jsFiles, cssFiles]);

  useEffect(() => { setEditorTheme(darkMode ? "vs-dark" : "vs-light"); }, [darkMode]);

  // File management helpers
  const addHtmlFile = () => setHtmlFiles(old => [...old, defaultHtmlFile(old.length+1)]);
  const removeHtmlFile = i => setHtmlFiles(files => files.length === 1 ? files : files.filter((_, idx) => idx !== i));
  const renameHtmlFile = (i, newName) => setHtmlFiles(files => files.map((f, idx) => idx === i ? {...f, name: newName} : f));

  const addJsFile = () => setJsFiles(old => [...old, defaultJsFile(old.length+1)]);
  const removeJsFile = i => setJsFiles(files => files.length === 1 ? files : files.filter((_, idx) => idx !== i));
  const renameJsFile = (i, newName) => setJsFiles(files => files.map((f, idx) => idx === i ? {...f, name: newName} : f));

  const addCssFile = () => setCssFiles(old => [...old, defaultCssFile(old.length+1)]);
  const removeCssFile = i => setCssFiles(files => files.length === 1 ? files : files.filter((_, idx) => idx !== i));
  const renameCssFile = (i, newName) => setCssFiles(files => files.map((f, idx) => idx === i ? {...f, name: newName} : f));

  // Open in new tab helpers
  const openPreviewInTab = () => {
    const win = window.open();
    win.document.write(buildSrcDoc());
    win.document.close();
  };
  const openCodeInTab = () => {
    const content = `/* HTML Files */\n${htmlFiles.map(f=>`// ${f.name}\n${f.code}\n`).join("\n")}
      /* CSS Files */\n${cssFiles.map(f=>`// ${f.name}\n${f.code}\n`).join("\n")}
      /* JS Files */\n${jsFiles.map(f=>`// ${f.name}\n${f.code}\n`).join("\n")}`;
    const blob = new Blob([content], {type: "text/plain"});
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // Tab color codes
  const colorHtml = "#f97316", colorJs = "#eab308", colorCss = "#3b82f6";

  // Professional Glass Card style
  const cardStyle = {
    background: darkMode ? "rgba(33,38,60,0.98)" : "rgba(255,255,255,0.99)",
    borderRadius: "2.2rem",
    boxShadow: darkMode ? "0 8px 36px #1e293b70" : "0 8px 36px #b5d5f990",
    border: darkMode ? "1.5px solid #36b6e6a0" : "1.5px solid #c8e7fa",
    padding: "30px 24px 34px 24px",
    margin: "38px auto",
    maxWidth: 1350,
    transition: ".3s"
  };

  // VS Code Tab Group
  function TabGroup({files, active, setActive, add, remove, rename, renaming, setRenaming, color, icon, darkMode}) {
    return (
      <div style={{marginBottom:2, display:"flex",alignItems:"center",flexWrap:"wrap"}}>
        {files.map((f, i) =>
          renaming === i ? (
            <input key={i}
              type="text" value={f.name}
              onChange={e => rename(i, e.target.value)}
              onBlur={()=>setRenaming(-1)}
              autoFocus
              style={{fontSize:"1.04rem",padding:"3px 8px",borderRadius:5,marginRight:2,border:"1.2px solid #aaa"}}
              onKeyDown={e => e.key === "Enter" && setRenaming(-1)}
            />
          ) : (
            <button key={i}
              style={tabStyle(active === i, color, darkMode)}
              onClick={()=>setActive(i)}
              onDoubleClick={()=>setRenaming(i)}
              title="Double-click to rename"
            >{icon} {f.name}
              {files.length > 1 &&
                <span onClick={e=>{e.stopPropagation(); remove(i); setActive(0);}}
                  style={{marginLeft:8,fontWeight:900,color:"#fff",cursor:"pointer"}}>&times;</span>}
            </button>
          )
        )}
        <button onClick={add} style={{marginLeft:4,border:"none",background:"none",color:color,fontWeight:900,fontSize:"1.24em",cursor:"pointer"}} title={`Add ${icon.trim()} file`}>＋</button>
      </div>
    );
  }

  // Editors group (shown as columns or rows as needed)
  const editorsBlock = (
    <div style={{
      display: "flex",
      flexDirection: layout === "row" ? "row" : "column",
      gap: 22,
      marginBottom: layout === "row" ? 34 : 0,
      marginRight: 0
    }}>
      {/* HTML Editor */}
      <div style={{ flex: 1, minWidth: 210, position: "relative" }}>
        <TabGroup
          files={htmlFiles}
          active={activeHtml}
          setActive={setActiveHtml}
          add={addHtmlFile}
          remove={removeHtmlFile}
          rename={renameHtmlFile}
          renaming={renamingHtml}
          setRenaming={setRenamingHtml}
          color={colorHtml}
          icon={FILE_ICONS.html}
          darkMode={darkMode}
        />
        <div style={{color: colorHtml, margin:"9px 0 6px 0", fontWeight: "bold", fontSize: "1.12rem"}}>HTML</div>
        <MonacoEditor
          height={heightHTML}
          language="html"
          theme={editorTheme}
          value={htmlFiles[activeHtml].code}
          options={{
            fontSize: fontSize,
            fontFamily: font,
            minimap: { enabled: false }
          }}
          onChange={code =>
            setHtmlFiles(files => files.map((f, idx) => idx === activeHtml ? { ...f, code } : f))
          }
        />
        <div ref={refHTML} style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 8,
          cursor: "row-resize", background: "rgba(0,0,0,0.05)"
        }} title="Drag to resize"/>
      </div>
      {/* CSS Editor */}
      <div style={{ flex: 1, minWidth: 210, position: "relative" }}>
        <TabGroup
          files={cssFiles}
          active={activeCss}
          setActive={setActiveCss}
          add={addCssFile}
          remove={removeCssFile}
          rename={renameCssFile}
          renaming={renamingCss}
          setRenaming={setRenamingCss}
          color={colorCss}
          icon={FILE_ICONS.css}
          darkMode={darkMode}
        />
        <div style={{color: colorCss, margin:"9px 0 6px 0", fontWeight: "bold", fontSize: "1.12rem"}}>CSS</div>
        <MonacoEditor
          height={heightCSS}
          language="css"
          theme={editorTheme}
          value={cssFiles[activeCss].code}
          options={{
            fontSize: fontSize,
            fontFamily: font,
            minimap: { enabled: false }
          }}
          onChange={code =>
            setCssFiles(files => files.map((f, idx) => idx === activeCss ? { ...f, code } : f))
          }
        />
        <div ref={refCSS} style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 8,
          cursor: "row-resize", background: "rgba(0,0,0,0.05)"
        }} title="Drag to resize"/>
      </div>
      {/* JS Editor */}
      <div style={{ flex: 1, minWidth: 210, position: "relative" }}>
        <TabGroup
          files={jsFiles}
          active={activeJs}
          setActive={setActiveJs}
          add={addJsFile}
          remove={removeJsFile}
          rename={renameJsFile}
          renaming={renamingJs}
          setRenaming={setRenamingJs}
          color={colorJs}
          icon={FILE_ICONS.js}
          darkMode={darkMode}
        />
        <div style={{color: colorJs, margin:"9px 0 6px 0", fontWeight: "bold", fontSize: "1.12rem"}}>JavaScript</div>
        <MonacoEditor
          height={heightJS}
          language="javascript"
          theme={editorTheme}
          value={jsFiles[activeJs].code}
          options={{
            fontSize: fontSize,
            fontFamily: font,
            minimap: { enabled: false }
          }}
          onChange={code =>
            setJsFiles(files => files.map((f, idx) => idx === activeJs ? { ...f, code } : f))
          }
        />
        <div ref={refJS} style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 8,
          cursor: "row-resize", background: "rgba(0,0,0,0.05)"
        }} title="Drag to resize"/>
      </div>
    </div>
  );

  // Preview block, with resizable panel for column mode
  const previewBlock = (
    <div style={{
      ...(layout === "column"
        ? {
            position: "relative",
            minWidth: 220,
            maxWidth: 800,
            background: darkMode
              ? "linear-gradient(110deg, #36b6e61e 40%, #80d0c733 100%)"
              : "linear-gradient(110deg, #c8e7fa22 40%, #faffb933 100%)",
            borderRadius: "1.2rem",
            padding: "8px 8px 8px 16px",
            boxShadow: darkMode
              ? "0 2px 14px #09abe710"
              : "0 2px 10px #b9ebfc80",
            border: darkMode
              ? "1.5px solid #36b6e64a"
              : "1.5px solid #aad1ea",
            width: previewWidth,
            marginLeft: 22,
            transition: ".2s"
          }
        : {
            marginTop: 24,
            borderRadius: "1.4rem",
            background: darkMode
              ? "linear-gradient(110deg, #36b6e61e 40%, #80d0c733 100%)"
              : "linear-gradient(110deg, #c8e7fa22 40%, #faffb933 100%)",
            padding: "18px",
            boxShadow: darkMode
              ? "0 2px 24px #09abe710"
              : "0 2px 14px #a3e8e9a0",
            border: darkMode
              ? "1.5px solid #36b6e64a"
              : "1.5px solid #aad1ea",
            transition: ".2s"
          }),
    }}>
      {layout === "column" && (
        <div
          ref={refPreview}
          style={{
            position: "absolute", left: -9, top: 0, width: 10, height: "100%",
            cursor: "col-resize", zIndex: 9, background: "rgba(0,0,0,0.01)"
          }}
          title="Drag to resize preview"
        />
      )}
      <div style={{
        fontWeight:"bold",
        fontSize:"1.1rem",
        color: darkMode ? "#fff":"#1e293b",
        marginBottom:8,
        letterSpacing:".5px",
        marginLeft: layout === "column" ? 6 : 2
      }}>Live Preview:</div>
      <iframe
        title="Live Preview"
        ref={iframeRef}
        sandbox="allow-scripts allow-same-origin"
        style={{
          width: "100%",
          height: "350px",
          borderRadius: "12px",
          background: "#f8fafc",
          border: "none"
        }}
      />
    </div>
  );

  // Final Layout
  return (
    <div style={{ minHeight: "100vh", fontFamily: "Segoe UI, Arial, sans-serif", overflowX: "hidden" }}>
      {/* Header */}
      <header style={{
        background: darkMode ? "rgba(255,255,255,0.11)" : "rgba(60,60,60,0.07)",
        backdropFilter: "blur(10px)",
        borderBottom: darkMode ? "1.5px solid #1e293b60" : "1.5px solid #36b6e620",
        padding: "19px 0 16px 0",
        textAlign: "center",
        boxShadow: darkMode ? "0 2px 18px #090c" : "0 2px 18px #aad",
        letterSpacing: "1.5px",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{
          fontWeight: 900,
          fontSize: "2.2rem",
          color: darkMode ? "#fff" : "#222",
          textShadow: darkMode ? "0 3px 24px #222b, 0 1px 1px #fff4" : "0 2px 16px #c0e4ff"
        }}>
          Vibe Coding Playground
        </span>
        <button
          onClick={() => setDarkMode(d => !d)}
          style={{
            marginLeft: 22, padding: "7px 16px", borderRadius: "18px",
            background: darkMode ? "#fff" : "#222", color: darkMode ? "#222" : "#fff",
            border: "none", fontWeight: 600, fontSize: "1.1rem", cursor: "pointer",
            boxShadow: "0 1px 10px #0003", transition: ".2s"
          }}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? "🌙" : "☀️"}
        </button>
      </header>
      <div style={cardStyle}>
        {/* Controls */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", marginBottom: 10, gap: 8
        }}>
          <div>
            <button style={{background: "#fff2", color: darkMode ? "#fff" : "#222", padding: "6px 16px", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", marginRight: 7}}
              onClick={() => setLayout(layout === "row" ? "column" : "row")}
              title="Toggle editors arrangement"
            >{layout === "row" ? "Vertical Stack" : "Side by Side"}</button>
            <button style={{background: "#fff2", color: darkMode ? "#fff" : "#222", padding: "6px 16px", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", marginRight: 7}}
              onClick={() => setFullScreen(fullScreen === "editors" ? null : "editors")}
              title="Full screen editors"
            >{fullScreen === "editors" ? "Exit Editors Fullscreen" : "Editors Fullscreen"}</button>
            <button style={{background: "#fff2", color: darkMode ? "#fff" : "#222", padding: "6px 16px", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer"}}
              onClick={() => setFullScreen(fullScreen === "preview" ? null : "preview")}
              title="Full screen preview"
            >{fullScreen === "preview" ? "Exit Preview Fullscreen" : "Preview Fullscreen"}</button>
          </div>
          <div style={{display:"flex", gap:16, alignItems:"center", flexWrap:"wrap"}}>
            <label style={{color:darkMode ? "#fff" : "#111", fontWeight:600}}>Font:
              <select value={font} onChange={e => setFont(e.target.value)} style={{marginLeft:6}}>
                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
            <label style={{color:darkMode ? "#fff" : "#111", fontWeight:600}}>Font Size:
              <select value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{marginLeft:6}}>
                {[13,14,15,16,18,20,22,24].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <label style={{color:darkMode ? "#fff" : "#111", fontWeight:600}}>Theme:
              <select
                value={editorTheme}
                onChange={e => setEditorTheme(e.target.value)}
                style={{marginLeft:6}}
              >
                {THEME_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            <button onClick={openCodeInTab} style={{
              marginLeft:10, background:"#0ea5e9", color:"#fff", padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:"bold"
            }}>View Code in New Tab</button>
            <button onClick={openPreviewInTab} style={{
              background:"#059669", color:"#fff", padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:"bold"
            }}>View Preview in New Tab</button>
          </div>
        </div>
        {/* Editor + Preview layout */}
        {layout === "row" && fullScreen !== "preview" && fullScreen !== "editors" && (
          <>
            {editorsBlock}
            {previewBlock}
          </>
        )}
        {layout === "column" && fullScreen !== "preview" && fullScreen !== "editors" && (
          <div style={{display:"flex",flexDirection:"row"}}>
            <div style={{flex:2}}>{editorsBlock}</div>
            <div>{previewBlock}</div>
          </div>
        )}
        {/* Only preview */}
        {fullScreen === "preview" && previewBlock}
        {/* Only editors */}
        {fullScreen === "editors" && editorsBlock}
      </div>
      {/* FAB */}
      <button
        onClick={() => alert("FAB clicked! (You can set any action)")}
        style={{
          position: "fixed", bottom: 32, right: 32, zIndex: 100,
          background: "linear-gradient(135deg, #36b6e6, #0093e9 80%)",
          color: "#fff", border: "none", outline: "none", borderRadius: "50%",
          width: 60, height: 60, boxShadow: "0 6px 24px #36b6e690", fontSize: "2rem",
          fontWeight: "bold", cursor: "pointer", transition: "transform .15s"
        }}
        onMouseDown={e => e.currentTarget.style.transform = "scale(0.94)"}
        onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        title="Quick Action"
      >+</button>
      <footer style={{
        color: darkMode ? "#fff9" : "#222b",
        textAlign: "center",
        margin: "32px 0 10px 0",
        fontSize: "1.06rem",
        letterSpacing: "1px"
      }}>
        © {new Date().getFullYear()} Vibe Coding App | Built with React & Monaco Editor
      </footer>
    </div>
  );
}

export default App;
