import React, { useState } from "react";
import MonacoEditor from "react-monaco-editor";

function App() {
  const [code, setCode] = useState('// Start coding!\nconsole.log("Hello, Vibe!");');

  const handleEditorChange = (newValue) => {
    setCode(newValue);
  };

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
          {/* If you have a logo, add: <img src="/logo.png" style={{ height: 36, verticalAlign: 'middle', marginRight: 10 }} alt="logo" /> */}
          Vibe Coding Playground
        </span>
      </header>
      <div style={{
        margin: "32px auto",
        maxWidth: 900,
        background: "rgba(22,24,34,0.98)",
        borderRadius: "24px",
        boxShadow: "0 6px 24px #000a",
        padding: "28px"
      }}>
        <MonacoEditor
          height="60vh"
          language="javascript"
          theme="vs-dark"
          value={code}
          options={{
            selectOnLineNumbers: true,
            fontSize: 16,
            minimap: { enabled: false }
          }}
          onChange={handleEditorChange}
        />
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
