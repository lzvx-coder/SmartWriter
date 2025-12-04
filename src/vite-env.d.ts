/// <reference types="vite/client" />

// 声明路径别名的类型，解决@开头的导入报错
declare module '@/*' {
  import type { ReactNode } from 'react';
  const content: any;
  export default content;
}
/// <reference types="vite/client" />

declare module '*.ts' {
  const content: any;
  export default content;
}

declare module '*.tsx' {
  import type { ReactElement, ReactNode } from 'react';
  const content: (props: any) => ReactElement | ReactNode;
  export default content;
}