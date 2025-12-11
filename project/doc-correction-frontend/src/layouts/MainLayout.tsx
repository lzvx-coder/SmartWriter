import React from 'react';
import { Outlet } from 'react-router-dom'; // 引入 Outlet

interface MainLayoutProps {
  // 移除 children 类型定义，因为不再通过 children 传值
}

const MainLayout: React.FC<MainLayoutProps> = () => {
  return (
    <div className="main-layout">
      <header className="layout-header">
        <h1>LLM 文档智能批改工具</h1>
      </header>
      <main className="layout-content">
        <Outlet /> {/* 子路由会渲染到这里 */}
      </main>
    </div>
  );
};

export default MainLayout;