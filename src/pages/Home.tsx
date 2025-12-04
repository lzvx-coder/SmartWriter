// src/pages/Home.tsx
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div>
      <h1>首页 - 文件上传入口</h1>
      <Link to="/document">点击进入文件上传页面</Link>
    </div>
  );
};

export default Home;