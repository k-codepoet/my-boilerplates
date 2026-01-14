import type { Route } from "./+types/home";
import { Link } from "react-router";
import { FolderOpen, Settings, Zap } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home - Tauri App" },
    { name: "description", content: "Tauri + React Router desktop app" },
  ];
}

export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Zap className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Tauri + React Router</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          네이티브 데스크톱 앱 boilerplate
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            to="/files"
            className="flex flex-col items-center gap-2 rounded-lg border border-input p-6 text-center hover:bg-accent"
          >
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
            <span className="font-medium">파일 관리</span>
            <span className="text-sm text-muted-foreground">
              파일 열기, 저장, 탐색
            </span>
          </Link>
          <Link
            to="/settings"
            className="flex flex-col items-center gap-2 rounded-lg border border-input p-6 text-center hover:bg-accent"
          >
            <Settings className="h-8 w-8 text-muted-foreground" />
            <span className="font-medium">설정</span>
            <span className="text-sm text-muted-foreground">
              앱 설정 및 환경 구성
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
