# 메모리 최적화

> `msw-engine/src/memory/` 디렉토리. GC 압력을 최소화하고 캐시 지역성을 높이는 메모리 관리 전략.

## TransformBuffer — Float32Array 풀링

> 파일: `msw-engine/src/memory/TransformBuffer.ts`

모든 GameObject의 Transform 데이터를 단일 `Float32Array`에 연속으로 저장한다.

```
Float32Array 메모리 레이아웃 (STRIDE = 5):
┌──────────────────────────────────────────────────────────────┐
│  idx=0                │  idx=1                │  idx=2  ...  │
│ [x, y, rot, sx, sy]  │ [x, y, rot, sx, sy]   │  ...         │
│  0   1   2    3   4  │  5   6   7    8   9    │              │
└──────────────────────────────────────────────────────────────┘
```

**동작 원리:**

```typescript
class TransformBuffer {
  static readonly STRIDE = 5;   // x, y, rotation, scaleX, scaleY

  private data: Float32Array;
  private freeList: number[];    // 해제된 인덱스 재사용
  private capacity: number;
  private nextIndex: number;

  allocate(): number;            // 슬롯 할당 (freeList 우선 → 새 인덱스)
  free(index): void;             // 슬롯 해제 (freeList에 반환)
  // getter/setter: getX, setX, getY, setY, getRotation, ...
}
```

**자동 확장:**

```typescript
private grow(): void {
  const newCapacity = this.capacity * 2;
  const newData = new Float32Array(newCapacity * TransformBuffer.STRIDE);
  newData.set(this.data);      // 기존 데이터 복사
  this.data = newData;
  this.capacity = newCapacity;
}
```

- 초기 용량: 64개 오브젝트 (320 floats)
- 용량 초과 시 2배로 확장
- 해제된 슬롯은 `freeList`를 통해 재사용
- 기본값: scaleX=1, scaleY=1 (나머지 0)

**GameObject와의 연동:**

```typescript
// GameObject.ts 생성자에서
this.transformIndex = sharedTransformBuffer.allocate();

// transform.x에 접근하면 → buffer.getX(idx) 호출
// transform.x = 100 하면 → buffer.setX(idx, 100) 호출
// Proxy를 통한 투명한 연결
```

이를 통해:

- GC 압력 최소화 (프레임마다 객체 할당 없음)
- 캐시 지역성 향상 (연속 메모리 배치)
- 대량 오브젝트 처리 시 성능 이점

## ObjectPool — 범용 오브젝트 풀

> 파일: `msw-engine/src/memory/ObjectPool.ts`

```typescript
class ObjectPool<T> {
  constructor(
    factory: () => T,           // 생성 함수
    reset: (obj: T) => void,    // 초기화 함수
    prewarm = 64                // 미리 생성할 수
  );

  acquire(): T;     // 풀에서 꺼내거나 새로 생성
  release(obj): void;  // 초기화 후 풀에 반환
  clear(): void;

  get available(): number;  // 풀에 남은 수
  get active(): number;     // 사용 중인 수
}
```

## EventPool — 이벤트 오브젝트 풀

> 파일: `msw-engine/src/memory/EventPool.ts`

이벤트 객체(`{ type, data }`)를 타입별로 풀링한다.

```typescript
class EventPool {
  acquire(type: string, data: unknown): PooledEvent;
  release(event: PooledEvent): void;   // data = null로 초기화 후 반환
  clear(): void;
}
// 타입당 최대 32개 보관 (MAX_PER_TYPE = 32)
```

## CommandPool — DrawCommand 제로 할당

> 파일: `msw-engine/src/render/DrawCommand.ts`

렌더링 커맨드도 풀링하여 프레임마다 새 배열을 할당하지 않는다.

```typescript
class CommandPool {
  reset(): void;                  // 프레임 시작 시 리셋 (length = 0)
  push(cmd: DrawCommand): void;   // 기존 배열 슬롯 재사용
  toArray(): DrawCommand[];        // slice(0, length) 반환
}
```
