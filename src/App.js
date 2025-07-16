import React, { useState } from "react";
import MonacoEditor from "react-monaco-editor";

function App() {
  const [code, setCode] = useState('// Start coding!\nconsole.log("Hello, Vibe!");');

  const handleEditorChange = (newValue) => {
    setCode(newValue);
  };

  return (
    <div style={{ height: "100vh", background: "#181c25" }}>
      <h2 style={{ color: "#fff", textAlign: "center", margin: 0, padding: "20px" }}>
        Vibe Coding Playground
      </h2>
      <MonacoEditor
        height="80vh"
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
  );
}

export default App;
