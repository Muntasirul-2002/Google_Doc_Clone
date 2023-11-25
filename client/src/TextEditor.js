import React, { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

const TextEditor = () => {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const s = io("http://localhost:3001");

    s.on("connect_error", (err) => {
      console.error("Socket connection failed:", err.message);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) return;
    setIsLoading(true);

    socket.once("load-document", (document) => {
      quill.setContents(document);
      setIsLoading(false);
      quill.enable();
    });

    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (socket == null || quill == null) return;
    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };

    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  const wrapperRef = useCallback(
    (wrapper) => {
      if (wrapper == null) return;

      // If Quill is already initialized, return
      if (quill != null) return;

      // Create a div element for the Quill editor
      const editorDiv = document.createElement("div");
      wrapper.appendChild(editorDiv);

      // Initialize Quill and set it in the state
      const q = new Quill(editorDiv, {
        theme: "snow",
        modules: { toolbar: TOOLBAR_OPTIONS },
      });
      q.enable();
      q.setText("Loading...");
      setQuill(q);
    },
    [quill]
  );

  useEffect(() => {
    if (quill != null) {
      return () => {
        quill.off("text-change");
        quill.disable();
        quill.container.parentNode.removeChild(quill.container);
      };
    }
  }, [quill]);

  return (
    <div className="container" ref={wrapperRef}>
      {isLoading && <p>Loading...</p>}
    </div>
  );
};

export default TextEditor;
