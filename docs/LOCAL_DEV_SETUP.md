# 로컬 개발 환경 설정 가이드

이 문서는 boilerplate를 로컬에서 개발할 때 필요한 런타임 환경 설정을 안내합니다.

## Node.js 환경 (nvm)

Node.js 프로젝트는 **nvm (Node Version Manager)** 을 사용하여 버전을 관리합니다.

### nvm 설치

```bash
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# 설치 후 셸 재시작 또는
source ~/.bashrc  # 또는 ~/.zshrc
```

### Node.js 버전 설정

```bash
# 프로젝트 디렉토리에서
nvm install    # .nvmrc 파일 기준 설치
nvm use        # .nvmrc 파일 기준 사용

# .nvmrc 없을 경우 수동 설치
nvm install 22
nvm use 22
```

### 권장 버전

| 프로젝트 타입 | Node.js 버전 | 비고 |
|--------------|-------------|------|
| web/* | 22 LTS | Vite 7, React Router v7 |
| bot/slack-* (TS) | 22 LTS | |
| 일반 | 22 LTS | 최신 LTS 권장 |

### .nvmrc 파일 예시

프로젝트 루트에 `.nvmrc` 파일 생성:

```
22
```

---

## Python 환경 (uv)

Python 프로젝트는 **uv** 패키지 관리자를 사용합니다. pip보다 10~100배 빠르고 가상환경 관리가 간편합니다.

### uv 설치

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# 또는 Homebrew (macOS)
brew install uv

# 또는 pipx
pipx install uv
```

### 프로젝트 설정

```bash
# 프로젝트 디렉토리에서
uv venv                    # .venv 생성 (자동으로 .python-version 참조)
source .venv/bin/activate  # 가상환경 활성화

# 의존성 설치
uv pip install -e .        # pyproject.toml 기반 설치
# 또는
uv pip install -r requirements.txt
```

### 권장 버전

| 프로젝트 타입 | Python 버전 | 비고 |
|--------------|------------|------|
| bot/slack-processor-python | 3.12+ | |
| 일반 | 3.12+ | 최신 안정 버전 권장 |

### .python-version 파일 예시

프로젝트 루트에 `.python-version` 파일 생성:

```
3.12
```

---

## pnpm (패키지 매니저)

모든 Node.js 프로젝트는 **pnpm**을 사용합니다.

### pnpm 설치

```bash
# npm으로 설치
npm install -g pnpm

# 또는 corepack (Node.js 16.9+ 내장)
corepack enable
corepack prepare pnpm@latest --activate

# 또는 Homebrew
brew install pnpm
```

### 버전 확인

```bash
pnpm --version  # 10.12+ 권장
```

---

## 전체 셋업 요약

### Node.js 프로젝트 (web/*, bot/slack-*-ts)

```bash
# 1. Node.js 버전 설정
nvm use 22  # 또는 nvm install && nvm use

# 2. 의존성 설치
pnpm install

# 3. 개발 서버 시작
pnpm dev
```

### Python 프로젝트 (bot/slack-processor-python)

```bash
# 1. 가상환경 생성 및 활성화
uv venv && source .venv/bin/activate

# 2. 의존성 설치
uv pip install -e .

# 3. 실행
python -m src.main
```

---

## IDE 권장 설정

### VS Code Extensions

- **Node.js**: ESLint, Prettier
- **Python**: Python (Microsoft), Ruff
- **공통**: EditorConfig, GitLens

### VS Code Settings (권장)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff"
  }
}
```

---

## 트러블슈팅

### nvm: command not found

셸 설정 파일에 nvm 초기화 스크립트 추가:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### uv: command not found

PATH에 uv 경로 추가:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### pnpm: EACCES permission denied

npm 전역 설치 디렉토리 권한 문제:

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```
