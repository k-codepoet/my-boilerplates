# npm 크로스플랫폼 바이너리 배포 패턴

Rust와 Go 보일러플레이트가 공유하는 핵심 패턴입니다. 네이티브 바이너리를 `npm install -g`로 설치 가능하게 만드는 구조입니다.

## 패키지 구조

```
npm 레지스트리
├── @mycli/cli (메인 패키지)
│   ├── bin/cli.js           ← 실행 래퍼 (shim)
│   ├── bin/install.js       ← 플랫폼 감지 + 바이너리 경로 해석
│   └── package.json
│       └── optionalDependencies:
│           ├── @mycli/cli-darwin-arm64
│           ├── @mycli/cli-darwin-x64
│           ├── @mycli/cli-linux-arm64
│           ├── @mycli/cli-linux-x64
│           ├── @mycli/cli-win32-arm64
│           └── @mycli/cli-win32-x64
│
├── @mycli/cli-darwin-arm64 (플랫폼 패키지)
│   ├── bin/mycli            ← 네이티브 바이너리
│   └── package.json
│       ├── "os": ["darwin"]
│       └── "cpu": ["arm64"]
│
├── @mycli/cli-darwin-x64
│   └── ...
└── (4개 더)
```

## 설치 플로우

```
npm install -g @mycli/cli
        │
        ▼
┌─────────────────────────────────────┐
│ 1. 메인 패키지 설치                   │
│    @mycli/cli → bin/cli.js, bin/install.js │
├─────────────────────────────────────┤
│ 2. optionalDependencies 설치         │
│    npm이 현재 OS/CPU에 맞는 패키지만   │
│    설치 (나머지는 건너뜀)              │
│                                     │
│    macOS ARM (M1+):                 │
│      ✓ @mycli/cli-darwin-arm64      │
│      ✗ 나머지 5개 스킵               │
├─────────────────────────────────────┤
│ 3. postinstall 실행                  │
│    node bin/install.js              │
│    → 바이너리 존재 확인               │
└─────────────────────────────────────┘
```

## install.js 로직 상세

```
getPlatformPackage()
  │
  ├─ os.platform() → "darwin" | "linux" | "win32"
  ├─ os.arch()     → "x64" | "arm64"
  │
  └─ 결합: "@mycli/cli-{platform}-{arch}"

getBinaryPath()
  │
  ├─ 1차 시도: require.resolve("{packageName}/package.json")
  │            → 플랫폼 패키지의 bin/ 디렉토리에서 바이너리 경로 반환
  │
  └─ 2차 폴백: __dirname에서 직접 바이너리 확인
               → 로컬 개발 시 유용
```

**플랫폼 감지 매핑**:
```
os.platform()  →  패키지명       os.arch()  →  패키지명
─────────────────────────────────────────────────
"darwin"       →  "darwin"       "x64"      →  "x64"
"linux"        →  "linux"        "arm64"    →  "arm64"
"win32"        →  "win32"
```

**Windows 처리**: `process.platform === "win32"`이면 바이너리명에 `.exe` 확장자를 추가합니다.

## cli.js 실행 래퍼

```javascript
#!/usr/bin/env node
const { execFileSync } = require("child_process");
const { getBinaryPath } = require("./install.js");

const binaryPath = getBinaryPath();

try {
  execFileSync(binaryPath, process.argv.slice(2), { stdio: "inherit" });
} catch (error) {
  if (error.status !== undefined) {
    process.exit(error.status);
  }
  throw error;
}
```

- `execFileSync` — 바이너리를 동기 실행 (shell을 거치지 않아 안전)
- `process.argv.slice(2)` — node, cli.js를 제외한 사용자 인자 전달
- `stdio: "inherit"` — stdin/stdout/stderr를 그대로 전달 (TUI 렌더링에 필수)
- 종료 코드를 바이너리의 것으로 전파

## 이 패턴의 장점

1. **단일 설치 명령**: `npm install -g @mycli/cli` → 모든 플랫폼에서 동작
2. **최소 다운로드**: npm이 현재 플랫폼에 맞는 바이너리만 설치
3. **npx 호환**: `npx @mycli/cli`로 설치 없이 바로 실행
4. **기존 npm 인프라 활용**: 버전 관리, 배포, 의존성 해석 모두 npm이 처리
5. **네이티브 성능**: JavaScript 래퍼는 바이너리 실행만 담당
