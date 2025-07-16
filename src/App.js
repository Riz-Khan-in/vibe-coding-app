import React, { useState, useRef, useEffect } from "react";
import MonacoEditor from "react-monaco-editor";

function App() {
  const [html, setHtml] = useState("<h1>Hello, Vibe!</h1>");
  const [css, setCss] = useState("h1 { color: #0099ff; text-align:center; }");
  const [js, setJs] = useState('console.log("Vibe JS!");');
  const iframeRef = useRef(null);

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

  // Update iframe on code change
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = buildSrcDoc();
      }
    }, 400); // Debounce for smooth updates
    return () => clearTimeout(timeout);
  }, [html, css, js]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f2027, #2c5364 70%)",
      fontFamily: "Segoe UI, Arial, sans-serif"
    }}>
      <header style={{
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #222c",
        padding: "18px 0",
        textAlign: "center",
        boxShadow: "0 2px 6px #222c"
      }}>
        <span style={{
          fontWeight: "bold",
          fontSize: "2rem",
          color: "#fff",
          letterSpacing: "1px",
          textShadow: "0 2px 10px #2228"
        }}>
          Vibe Coding Playground
        </span>
      </header>
      <div style={{
        margin: "32px auto",
        maxWidth: 1200,
        background: "rgba(22,24,34,0.98)",
        borderRadius: "24px",
        boxShadow: "0 6px 24px #000a",
        padding: "28px"
      }}>
        <div style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap"
        }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={{color:"#7dd3fc",marginBottom:6,fontWeight:"bold"}}>HTML</div>
            <MonacoEditor
              height="28vh"
              language="html"
              theme="vs-dark"
              value={html}
              options={{ fontSize: 15, minimap: { enabled: false } }}
              onChange={setHtml}
            />
          </div>
          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={{color:"#bbf7d0",marginBottom:6,fontWeight:"bold"}}>CSS</div>
            <MonacoEditor
              height="28vh"
              language="css"
              theme="vs-dark"
              value={css}
              options={{ fontSize: 15, minimap: { enabled: false } }}
              onChange={setCss}
            />
          </div>
          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={{color:"#fca5a5",marginBottom:6,fontWeight:"bold"}}>JavaScript</div>
            <MonacoEditor
              height="28vh"
              language="javascript"
              theme="vs-dark"
              value={js}
              options={{ fontSize: 15, minimap: { enabled: false } }}
              onChange={setJs}
            />
          </div>
        </div>
        <div style={{marginTop: "30px"}}>
          <div style={{
            fontWeight: "bold",
            fontSize: "1.15rem",
            color: "#fff",
            marginBottom: "8px"
          }}>Live Preview:</div>
          <iframe
            title="Live Preview"
            ref={iframeRef}
            sandbox="allow-scripts allow-same-origin"
            style={{
              width: "100%",
              height: "320px",
              borderRadius: "14px",
              background: "#fff"
            }}
          />
        </div>
      </div>
      <footer style={{
        color: "#fff8",
        textAlign: "center",
        margin: "32px 0 12px 0",
        fontSize: "1rem"
      }}>
        © {new Date().getFullYear()} Vibe Coding App | Built with React & Monaco Editor
      </footer>
    </div>
  );
}

export default App;
