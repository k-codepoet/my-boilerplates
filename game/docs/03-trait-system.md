# Trait 시스템

> `msw-engine/src/traits/` 디렉토리의 재사용 가능한 행위 컴포넌트들.
>
> Trait 기반 클래스(`Trait.ts`)의 구조는 [02-engine-modules.md](02-engine-modules.md#traittsengin--행위-추상-기반-클래스) 참조.

## 사용 가능한 8개 Trait

| Trait | 파일 | 설명 |
|-------|------|------|
| **Movable** | `traits/Movable.ts` | 속도/가속/마찰 기반 이동 |
| **Jumpable** | `traits/Jumpable.ts` | 점프 + 중력 (Movable 의존) |
| **Animated** | `traits/Animated.ts` | 스프라이트 애니메이션 상태 전환 |
| **Collidable** | `traits/Collidable.ts` | 물리 바디 등록 + 위치 동기화 |
| **Damageable** | `traits/Damageable.ts` | HP, 피격, 무적 시간, 사망 |
| **Scorer** | `traits/Scorer.ts` | 점수 관리 (GameState 연동) |
| **Tappable** | `traits/Tappable.ts` | 포인터 탭 감지 (히트 영역) |
| **Timer** | `traits/Timer.ts` | 카운트다운/업 타이머 |

## 각 Trait 상세

### Movable — 이동 시스템

> 파일: `msw-engine/src/traits/Movable.ts`

```typescript
class Movable extends Trait {
  vx: number;  vy: number;     // 현재 속도

  config: {
    speed: number;      // 기본 속도 (기본값: 200)
    friction: number;   // 마찰 계수 (기본값: 0.85, 매 프레임 속도에 곱함)
    maxSpeed: number;   // 최대 속도 (기본값: 400)
  }

  update(dt): void {
    // 1. 마찰 적용: vx *= friction, vy *= friction
    // 2. 최대 속도 클램프
    // 3. transform.x += vx * dt, transform.y += vy * dt
  }

  setVelocity(vx, vy): void;     // 속도 직접 설정
  accelerate(ax, ay): void;       // 가속
}
```

### Jumpable — 점프 + 중력

> 파일: `msw-engine/src/traits/Jumpable.ts`

Movable에 의존한다. 점프 시 `movable.vy = jumpForce`로 수직 속도를 설정하고, 매 프레임 중력을 적용한다.

```typescript
class Jumpable extends Trait {
  isGrounded: boolean;

  config: {
    jumpForce: number;   // 점프 힘 (기본값: -400, 위 방향이 음수)
    gravity: number;     // 중력 가속도 (기본값: 800)
    groundY: number;     // 바닥 Y 좌표 (기본값: 500)
  }

  jump(): void {
    if (!this.isGrounded) return;
    movable.vy = this.config.jumpForce;
    this.isGrounded = false;
  }
}
```

### Damageable — 체력/피격 시스템

> 파일: `msw-engine/src/traits/Damageable.ts`

```typescript
class Damageable extends Trait {
  hp: number;
  maxHP: number;
  isInvincible: boolean;
  invincibilityTimer: number;

  init(): void {
    this.hp = this.maxHP;
    state.set("health", this.hp);    // GameState에 동기화
  }

  hit(damage): void {
    // 무적 중이거나 사망 시 무시
    // HP 감소 → 무적 상태 진입 → 이벤트 발행 ("damaged", "death")
  }

  heal(amount): void;
  isDead(): boolean;
}
```

### Scorer — 점수 관리

> 파일: `msw-engine/src/traits/Scorer.ts`

```typescript
class Scorer extends Trait {
  config: { stateKey: string; }   // GameState 키 (기본값: "score")

  addScore(points): void {
    // GameState의 score += points
    // "scoreChanged" 이벤트 발행
  }

  getScore(): number;
}
```

### Animated — 스프라이트 애니메이션

> 파일: `msw-engine/src/traits/Animated.ts`

```typescript
class Animated extends Trait {
  currentState: string;   // 현재 애니메이션 상태 ("idle", "walk", "jump")
  frameIndex: number;
  frameTimer: number;

  setState(name): void;   // 상태 전환 (동일 상태 무시, 미등록 상태 무시)
}
```

### Collidable — 물리 바디 연동

> 파일: `msw-engine/src/traits/Collidable.ts`

init 시 Physics 서브시스템에 바디를 등록하고, 매 프레임 GameObject의 위치를 물리 바디에 동기화한다.

```typescript
config: {
  bodyType: "static" | "dynamic" | "kinematic";
  collider: "box" | "circle";
  width: number; height: number;
  bounce: number; friction: number;
}
```

### Tappable — 포인터 탭 감지

> 파일: `msw-engine/src/traits/Tappable.ts`

매 프레임 포인터 위치가 오브젝트의 히트 영역 안에 있고 `justPressed`에 `"tap"` 또는 `"pointer_down"`이 있으면 `"tapped"` 이벤트를 발행한다.

### Timer — 시간 관리

> 파일: `msw-engine/src/traits/Timer.ts`

```typescript
config: {
  duration: number;                    // 기본값: 60초
  mode: "countdown" | "countup";       // 기본값: "countdown"
}

start() / pause() / reset()
getTime(): number;
getFormattedTime(): string;   // "02:30" 형식
isExpired(): boolean;
// 카운트다운 만료 시 "timerExpired" 이벤트 발행
```

## 조합 패턴 예시

**Player = Movable + Jumpable + Damageable + Scorer:**

```typescript
// templates/platformer/objects/Player.ts
export function createPlayer(id = "player"): GameObject {
  const player = new GameObject(id, "player");

  player.addTrait(new Movable({ speed: 300, friction: 0.8, maxSpeed: 400 }));
  player.addTrait(new Jumpable({ jumpForce: -450, gravity: 800, groundY: 518 }));
  player.addTrait(new Damageable({ maxHP: 3 }));
  player.addTrait(new Scorer());

  player.state.transform.x = 100;
  player.state.transform.y = 400;
  player.state.visual.assetKey = "player";
  player.state.visual.state = "idle";
  player.addTag("player");
  player.layer = 10;

  return player;
}
```

**Trait 간 협력 (Jumpable → Movable):**

```
Jumpable.jump()
  └─ movable = this.gameObject.getTrait("movable")
      └─ movable.vy = jumpForce    ← Movable의 속도를 직접 수정

Jumpable.update(dt)
  └─ movable.vy += gravity * dt    ← 매 프레임 중력 적용
```
