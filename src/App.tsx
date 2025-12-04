import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Document from "./pages/Document";
import ReviewResult from "./pages/ReviewResult";
import "./assets/styles/global.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* 父路由：渲染 MainLayout 布局 */}
        <Route element={<MainLayout />}>
          <Route index element={<Home />} /> {/* 根路径渲染 Home */}
          {/* 新增不带参数的 document 路径，用于文件上传 */}
          <Route path="document" element={<Document />} />
          {/* 原带参数的路径保留，用于后续详情页 */}
          <Route path="document/:id" element={<Document />} />
          <Route path="review/:id" element={<ReviewResult />} /> {/* 批改结果页 */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;