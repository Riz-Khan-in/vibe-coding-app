import React, { useState, useRef, useEffect } from "react";
import MonacoEditor from "react-monaco-editor";

function App() {
  const [html, setHtml] = useState("<h1>Hello, Vibe!</h1>");
  const [css, setCss] = useState("h1 { color: #0099ff; text-align:center; }");
  const [js, setJs] = useState('console.log("Vibe JS!");');
  const iframeRef = useRef(null);

  // For animated background
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      body {
        min-height:100vh;
        margin:0;
        background: linear-gradient(-45deg, #0f2027, #2c5364, #0093e9, #80d0c7);
        background-size: 400% 400%;
        animation: gradientBG 12s ease infinite;
      }
      @keyframes gradientBG {
        0% {background-position: 0% 50%;}
        50% {background-position: 100% 50%;}
        100% {background-position: 0% 50%;}
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

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

  return (
    <div style={{
      minHeight: "100vh",
      paddingBottom: 0,
      fontFamily: "Segoe UI, Arial, sans-serif",
      overflowX: "hidden"
    }}>
      {/* Glassmorphic Header */}
      <header style={{
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(10px)",
        borderBottom: "1.5px solid #1e293b60",
        padding: "22px 0 18px 0",
        textAlign: "center",
        boxShadow: "0 2px 18px #090c",
        letterSpacing: "1.5px"
      }}>
        <span style={{
          fontWeight: 900,
          fontSize: "2.4rem",
          color: "#fff",
          textShadow: "0 3px 24px #222b, 0 1px 1px #fff4"
        }}>
          Vibe Coding Playground
        </span>
      </header>
      {/* Editors & Preview Container */}
      <div style={{
        margin: "32px auto",
        maxWidth: 1280,
        background: "rgba(28,36,54,0.93)",
        borderRadius: "2.2rem",
        boxShadow: "0 8px 36px #1e293b60",
        padding: "32px 28px 38px 28px",
        backdropFilter: "blur(6px)",
        border: "1.5px solid #36b6e6a0"
      }}>
        <div style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
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
              theme="vs-dark"
              value={html}
              options={{ fontSize: 15, minimap: { enabled: false } }}
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
              theme="vs-dark"
              value={css}
              options={{ fontSize: 15, minimap: { enabled: false } }}
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
              theme="vs-dark"
              value={js}
              options={{ fontSize: 15, minimap: { enabled: false } }}
              onChange={setJs}
            />
          </div>
        </div>
        {/* Preview Box */}
        <div style={{
          marginTop: 20,
          borderRadius: "1.4rem",
          background: "linear-gradient(110deg, #36b6e61e 40%, #80d0c733 100%)",
          padding: "18px",
          boxShadow: "0 2px 24px #09abe710",
          border: "1.5px solid #36b6e64a"
        }}>
          <div style={{
            fontWeight: "bold",
            fontSize: "1.15rem",
            color: "#fff",
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
              boxShadow: "0 2px 14px #09abe720"
            }}
          />
        </div>
      </div>
      {/* Footer */}
      <footer style={{
        color: "#fff9",
        textAlign: "center",
        margin: "
