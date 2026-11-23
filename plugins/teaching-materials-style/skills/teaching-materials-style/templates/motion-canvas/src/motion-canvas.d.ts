/// <reference types="@motion-canvas/core/project" />

// `./project?project` 由 vite 外掛用 bootstrap() 包成完整的 Project。
declare module '*?project' {
  import type {Project} from '@motion-canvas/core';
  const project: Project;
  export default project;
}
