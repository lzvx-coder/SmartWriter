import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// 👇 删掉这行！！！（这是唯一报错原因）
// import "./index.css";
import App from "./App.tsx";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);