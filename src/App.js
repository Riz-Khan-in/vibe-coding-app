import React, { useState, useRef, useEffect } from "react";
import MonacoEditor from "react-monaco-editor";

// Custom hook for vertical resize (for editors)
function useResizable(defaultHeight = 220) {
  const [height, setHeight] = useState(defaultHeight);
  const ref = useRef();
  useEffect(() => {
    const handle = ref.current;
    if (!handle) return;
    let startY, startHeight;
    const onMouseMove = e => {
      setHeight(Math.max(120, startHeight + (e.clientY - startY)));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    const onMouseDown = e => {
      startY = e.clientY;
      startHeight = height;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    handle.addEventListener('mousedown', onMouseDown);
    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
    };
  }, [height]);
  return [height, ref];
}

// Custom hook for horizontal resize (for preview in row mode)
function useHorizontalResizable(defaultWidth = 400, min = 260, max = 900) {
  const [width, setWidth] = useState(defaultWidth);
  const ref = useRef();
  useEffect(() => {
    const handle = ref.current;
    if (!handle) return;
    let startX, startWidth;
    const onMouseMove = e => {
      setWidth(Math.max(min, Math.min(max, startWidth - (e.clientX - startX))));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    const onMouseDown = e => {
      startX = e.clientX;
      startWidth = width;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    };
    handle.addEventListener('mousedown', onMouseDown);
    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
    };
  }, [width]);
  return [width, ref];
}

const FONT_OPTIONS = [
  "Fira Mono", "Source Code Pro", "JetBrains Mono", "Roboto Mono",
  "Cascadia Mono", "Ubuntu Mono", "Monaco", "Menlo", "Consolas", "monospace"
];
const THEME_OPTIONS = [
  { label: "Dark (vs-dark)", value: "vs-dark" },
  { label: "Light (vs-light)", value: "vs-light" },
  { label: "Solarized Dark", value: "solarized-dark" },
  { label: "Solarized Light", value: "solarized-light" },
  { label: "High Contrast Black", value: "hc-black" },
  { label: "High Contrast Light", value: "hc-light" }
];

function App() {
  const [html, setHtml] = useState("<h1>Hello, Vibe!</h1>");
  const [css, setCss] = useState("h1 { color: #0099ff; text-align:center; }");
  const [js, setJs] = useState('console.log("Vibe JS!");');
  const [darkMode, setDarkMode] = useState(true);
  const [fullScreen, setFullScreen] = useState(null); // null | "editors" | "preview"
  const [layout, setLayout] = useState("row"); // "row" or "column"
  const [font, setFont] = useState("Fira Mono");
  const [fontSize, setFontSize] = useState(15);
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [heightHTML, refHTML] = useResizable(220);
  const [heightCSS, refCSS] = useResizable(220);
  const [heightJS, refJS] = useResizable(220);
  const [previewWidth, refPreview] = useHorizontalResizable(410, 260, 900);
  const iframeRef = useRef(null);

  // Register extra Monaco themes if needed
  useEffect(() => {
    if (window.monaco && window.monaco.editor) {
      try {
        window.monaco.editor.defineTheme('solarized-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#002b36',
            'editor.foreground': '#93a1a1',
            'editorLineNumber.foreground': '#586e75',
            'editorCursor.foreground': '#d33682',
            'editor.selectionBackground': '#073642'
          }
        });
        window.monaco.editor.defineTheme('solarized-light', {
          base: 'vs',
          inherit: true,
          rules: [],
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

  // Animated background
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      body {
        min-height:100vh;
        margin:0;
        background: ${darkMode
          ? "linear-gradient(-45deg, #0f2027, #2c5364, #0093e9, #80d0c7)"
          : "linear-gradient(-45deg, #f0f5ff 60%, #e0f2fe 100%)"
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

  const buildSrcDoc = () => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Preview</title>
      <style>${css}</style>
    </head>
    <body>
      ${html}
      <script>
        try {
          ${js}
        } catch (e) {
          document.body.innerHTML += "<pre style='color:red'>" + e + "</pre>";
        }
      <\/script>
    </body>
    </html>
  `;

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = buildSrcDoc();
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [html, css, js]);

  useEffect(() => {
    setEditorTheme(darkMode ? "vs-dark" : "vs-light");
  }, [darkMode]);

  return (
    <div style={{
      minHeight: "100vh",
      fontFamily: "Segoe UI, Arial, sans-serif",
      overflowX: "hidden"
    }}>
      {/* Header */}
      <header style={{
        background: darkMode ? "rgba(255,255,255,0.15)" : "rgba(60,60,60,0.07)",
        backdropFilter: "blur(10px)",
        borderBottom: darkMode ? "1.5px solid #1e293b60" : "1.5px solid #36b6e620",
        padding: "22px 0 18px 0",
        textAlign: "center",
        boxShadow: darkMode ? "0 2px 18px #090c" : "0 2px 18px #aad",
        letterSpacing: "1.5px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <span style={{
          fontWeight: 900,
          fontSize: "2.4rem",
          color: darkMode ? "#fff" : "#222",
          textShadow: darkMode
            ? "0 3px 24px #222b, 0 1px 1px #fff4"
            : "0 2px 16px #c0e4ff"
        }}>
          Vibe Coding Playground
        </span>
        {/* Dark/Light Toggle */}
        <button
          onClick={() => setDarkMode(d => !d)}
          style={{
            marginLeft: 26,
            padding: "8px 18px",
            borderRadius: "20px",
            background: darkMode ? "#fff" : "#222",
            color: darkMode ? "#222" : "#fff",
            border: "none",
            fontWeight: 600,
            fontSize: "1.2rem",
            cursor: "pointer",
            boxShadow: "0 1px 10px #0003",
            transition: ".2s"
          }}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? "🌙" : "☀️"}
        </button>
      </header>
      {/* Editors & Preview Container */}
      <div style={{
        margin: "32px auto",
        maxWidth: 1280,
        background: darkMode ? "rgba(28,36,54,0.93)" : "rgba(255,255,255,0.95)",
        borderRadius: "2.2rem",
        boxShadow: darkMode
          ? "0 8px 36px #1e293b60"
          : "0 8px 36px #c1d5fd60",
        padding: "32px 28px 38px 28px",
        backdropFilter: "blur(6px)",
        border: darkMode
          ? "1.5px solid #36b6e6a0"
          : "1.5px solid #c8e7fa",
        transition: ".3s"
      }}>
        {/* Controls */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 16,
          gap: 10
        }}>
          <div>
            <button
              style={{
                background: "#fff2",
                color: darkMode ? "#fff" : "#222",
                padding: "6px 16px",
                border: "none",
                borderRadius: "12px",
                fontWeight: "bold",
                cursor: "pointer",
                marginRight: 8
              }}
              onClick={() => setLayout(layout === "row" ? "column" : "row")}
              title="Toggle editors arrangement"
            >
              {layout === "row" ? "Stack Editors" : "Editors Side by Side"}
            </button>
            <button
              style={{
                background: "#fff2",
                color: darkMode ? "#fff" : "#222",
                padding: "6px 16px",
                border: "none",
                borderRadius: "12px",
                fontWeight: "bold",
                cursor: "pointer",
                marginRight: 8
              }}
              onClick={() => setFullScreen(fullScreen === "editors" ? null : "editors")}
              title="Full screen editors"
            >
              {fullScreen === "editors" ? "Exit Editors Fullscreen" : "Editors Fullscreen"}
            </button>
            <button
              style={{
                background: "#fff2",
                color: darkMode ? "#fff" : "#222",
                padding: "6px 16px",
                border: "none",
                borderRadius: "12px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
              onClick={() => setFullScreen(fullScreen === "preview" ? null : "preview")}
              title="Full screen preview"
            >
              {fullScreen === "preview" ? "Exit Preview Fullscreen" : "Preview Fullscreen"}
            </button>
          </div>
          <div style={{display:"flex", gap:18, alignItems:"center", flexWrap:"wrap"}}>
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
          </div>
        </div>

        {/* Editors + Preview */}
        {layout === "row" && fullScreen !== "preview" && fullScreen !== "editors" ? (
          <div style={{
            display: "flex",
            gap: 20,
            minHeight: 320
          }}>
            <div style={{
              flex: 2.2,
              display: "flex",
              flexDirection: "row",
              gap: 20
            }}>
              {/* HTML Editor */}
              <div style={{ flex: 1, minWidth: 190, position: "relative" }}>
                <div style={{color: "#7dd3fc", marginBottom: 10, fontWeight: "bold", fontSize: "1.12rem"}}>HTML</div>
                <MonacoEditor
                  height={heightHTML}
                  language="html"
                  theme={editorTheme}
                  value={html}
                  options={{
                    fontSize: fontSize,
                    fontFamily: font,
                    minimap: { enabled: false }
                  }}
                  onChange={setHtml}
                />
                <div
                  ref={refHTML}
                  style={{
                    position: "absolute", left: 0, right: 0, bottom: 0, height: 8,
                    cursor: "row-resize", background: "rgba(0,0,0,0.05)"
                  }}
                  title="Drag to resize"
                />
              </div>
              {/* CSS Editor */}
              <div style={{ flex: 1, minWidth: 190, position: "relative" }}>
                <div style={{color: "#bbf7d0", marginBottom: 10, fontWeight: "bold", fontSize: "1.12rem"}}>CSS</div>
                <MonacoEditor
                  height={heightCSS}
                  language="css"
                  theme={editorTheme}
                  value={css}
                  options={{
                    fontSize: fontSize,
                    fontFamily: font,
                    minimap: { enabled: false }
                  }}
                  onChange={setCss}
                />
                <div
                  ref={refCSS}
                  style={{
                    position: "absolute", left: 0, right: 0, bottom: 0, height: 8,
                    cursor: "row-resize", background: "rgba(0,0,0,0.05)"
                  }}
                  title="Drag to resize"
                />
              </div>
              {/* JS Editor */}
              <div style={{ flex: 1, minWidth: 190, position: "relative" }}>
                <div style={{color: "#fca5a5", marginBottom: 10, fontWeight: "bold", fontSize: "1.12rem"}}>JavaScript</div>
                <MonacoEditor
                  height={heightJS}
                  language="javascript"
                  theme={editorTheme}
                  value={js}
                  options={{
                    fontSize: fontSize,
                    fontFamily: font,
                    minimap: { enabled: false }
                  }}
                  onChange={setJs}
                />
                <div
                  ref={refJS}
                  style={{
                    position: "absolute", left: 0, right: 0, bottom: 0, height: 8,
                    cursor: "row-resize", background: "rgba(0,0,0,0.05)"
                  }}
                  title="Drag to resize"
                />
              </div>
            </div>
            {/* Resizable Preview */}
            <div style={{
              position: "relative",
              flex: 1.3,
              minWidth: 210,
              maxWidth: 900,
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
              transition: ".2s"
            }}>
              <div
                ref={refPreview}
                style={{
                  position: "absolute", left: -9, top: 0, width: 10, height: "100%",
                  cursor: "col-resize", zIndex: 9, background: "rgba(0,0,0,0.01)"
                }}
                title="Drag to resize preview"
              />
              <div style={{fontWeight:"bold", fontSize:"1.1rem", color: darkMode ? "#fff":"#1e293b", marginBottom:8, letterSpacing:".5px", marginLeft:6}}>Live Preview:</div>
              <iframe
                title="Live Preview"
                ref={iframeRef}
                sandbox="allow-scripts allow-same-origin"
                style={{
                  width: "100%",
                  height: "340px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border: "none"
                }}
              />
            </div>
          </div>
        ) : (
          // Column layout (editors stacked, preview below)
          <>
            {fullScreen !== "preview" && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              marginBottom: 36
            }}>
              {/* HTML Editor */}
              <div style={{ flex: 1, minWidth: 190, position: "relative" }}>
                <div style={{color: "#7dd3fc", marginBottom: 10, fontWeight: "bold", fontSize: "1.12rem"}}>HTML</div>
                <MonacoEditor
                  height={heightHTML}
                  language="html"
                  theme={editorTheme}
                  value={html}
                  options={{
                    fontSize: fontSize,
                    fontFamily: font,
                    minimap: { enabled: false }
                  }}
                  onChange={setHtml}
                />
                <div
                  ref={refHTML}
                  style={{
                    position: "absolute", left: 0, right: 0, bottom: 0, height: 8,
                    cursor: "row-resize", background: "rgba(0,0,0,0.05)"
                  }}
                  title="Drag to resize"
                />
              </div>
              {/* CSS Editor */}
              <div style={{ flex: 1, minWidth: 190, position: "relative" }}>
                <div style={{color: "#bbf7d0", marginBottom: 10, fontWeight: "bold", fontSize: "1.12rem"}}>CSS</div>
                <MonacoEditor
                  height={heightCSS}
                  language="css"
                  theme={editorTheme}
                  value={css}
                  options={{
                    fontSize: fontSize,
                    fontFamily: font,
                    minimap: { enabled: false }
                  }}
                  onChange={setCss}
                />
                <div
                  ref={refCSS}
                  style={{
                    position: "absolute", left: 0, right: 0, bottom: 0, height: 8,
                    cursor: "row-resize", background: "rgba(0,0,0,0.05)"
                  }}
                  title="Drag to resize"
                />
              </div>
              {/* JS Editor */}
              <div style={{ flex: 1, minWidth: 190, position: "relative" }}>
                <div style={{color: "#fca5a5", marginBottom: 10, fontWeight: "bold", fontSize: "1.12rem"}}>JavaScript</div>
                <MonacoEditor
                  height={heightJS}
                  language="javascript"
                  theme={editorTheme}
                  value={js}
                  options={{
                    fontSize: fontSize,
                    fontFamily: font,
                    minimap: { enabled: false }
                  }}
                  onChange={setJs}
                />
                <div
                  ref={refJS}
                  style={{
                    position: "absolute", left: 0, right: 0, bottom: 0, height: 8,
                    cursor: "row-resize", background: "rgba(0,0,0,0.05)"
                  }}
                  title="Drag to resize"
                />
              </div>
            </div>
            )}
            {fullScreen !== "editors" && (
            <div style={{
              marginTop: 20,
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
            }}>
              <div style={{
                fontWeight: "bold",
                fontSize: "1.15rem",
                color: darkMode ? "#fff" : "#1e293b",
                marginBottom: "8px",
                letterSpacing: ".5px"
              }}>Live Preview:</div>
              <iframe
                title="Live Preview"
                ref={iframeRef}
                sandbox="allow-scripts allow-same-origin"
                style={{
                  width: "100%",
                  height: "340px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border: "none"
                }}
              />
            </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => alert("FAB clicked! (You can set any action)")}
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          zIndex: 100,
          background: "linear-gradient(135deg, #36b6e6, #0093e9 80%)",
          color: "#fff",
          border: "none",
          outline: "none",
          borderRadius: "50%",
          width: 60,
          height: 60,
          boxShadow: "0 6px 24px #36b6e690",
          fontSize: "2rem",
          fontWeight: "bold",
          cursor: "pointer",
          transition: "transform .15s"
        }}
        onMouseDown={e => e.currentTarget.style.transform = "scale(0.94)"}
        onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        title="Quick Action"
      >
        +
      </button>

      {/* Footer */}
      <footer style={{
        color: darkMode ? "#fff9" : "#222b",
        textAlign: "center",
        margin: "30px 0 10px 0",
        fontSize: "1.09rem",
        letterSpacing: "1px"
      }}>
        © {new Date().getFullYear()} Vibe Coding App | Built with React & Monaco Editor
      </footer>
    </div>
  );
}

export default App;
