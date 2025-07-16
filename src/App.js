import React, { useState, useRef, useEffect } from "react";
import MonacoEditor from "react-monaco-editor";

const FONT_OPTIONS = [
  "Fira Mono",
  "Source Code Pro",
  "JetBrains Mono",
  "monospace"
];

const THEME_OPTIONS = [
  { label: "Dark", value: "vs-dark" },
  { label: "Light", value: "vs-light" }
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
  const iframeRef = useRef(null);

  // For animated background
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

  // Sync editor theme with darkMode, but allow manual override
  useEffect(() => {
    setEditorTheme(darkMode ? "vs-dark" : "vs-light");
  }, [darkMode]);

  return (
    <div style={{
      minHeight: "100vh",
      paddingBottom: 0,
      fontFamily: "Segoe UI, Arial, sans-serif",
      overflowX: "hidden"
    }}>
      {/* Glassmorphic Header */}
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
        {/* Layout and Full Screen Controls */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 16,
          gap: 10
        }}>
          {/* Arrangement and full screen buttons */}
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
          {/* Font/theme settings */}
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

        {/* Editors */}
        {fullScreen !== "preview" && (
        <div style={{
          display: "flex",
          flexDirection: layout,
          gap: 20,
          flexWrap: layout === "row" ? "wrap" : "nowrap",
          marginBottom: 36
        }}>
          {/* HTML */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{
              color: "#7dd3fc",
              marginBottom: 10,
              fontWeight: "bold",
              fontSize: "1.12rem",
              letterSpacing: "0.5px"
            }}>HTML</div>
            <MonacoEditor
              height="27vh"
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
          </div>
          {/* CSS */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{
              color: "#bbf7d0",
              marginBottom: 10,
              fontWeight: "bold",
              fontSize: "1.12rem",
              letterSpacing: "0.5px"
            }}>CSS</div>
            <MonacoEditor
              height="27vh"
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
          </div>
          {/* JS */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{
              color: "#fca5a5",
              marginBottom: 10,
              fontWeight: "bold",
              fontSize: "1.12rem",
              letterSpacing: "0.5px"
            }}>JavaScript</div>
            <MonacoEditor
              height="27vh"
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
          </div>
        </div>
        )}

        {/* Preview Box */}
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
              border: "none",
              boxShadow: darkMode
                ? "0 2px 14px #09abe720"
                : "0 2px 10px #b9ebfc80"
            }}
          />
        </div>
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
