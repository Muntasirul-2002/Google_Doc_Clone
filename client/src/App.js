import TextEditor from "./TextEditor";
import "./styles.css";
import { Routes, Route, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

function App() {
  const documentId = uuidv4();

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<Link to={`/documents/${documentId}`}>Go to Document</Link>}
        />
        <Route path="/documents/:id" element={<TextEditor />} />
      </Routes>
    </>
  );
}

export default App;
