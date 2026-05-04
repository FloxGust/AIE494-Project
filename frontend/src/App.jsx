import { useState } from "react";
import "./styles.css";
import ImageClassifier from "./components/ImageClassifier";
import ClassificationResults from "./components/ClassificationResults";

export default function App() {
  const [page, setPage] = useState("classifier");

  return (
    <>
      {page === "classifier" && <ImageClassifier onNavigate={setPage} />}
      {page === "results" && <ClassificationResults onNavigate={setPage} />}
    </>
  );
}
