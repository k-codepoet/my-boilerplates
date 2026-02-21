export class TransformBuffer {
  static readonly STRIDE = 5; // x, y, rotation, scaleX, scaleY

  private data: Float32Array;
  private freeList: number[] = [];
  private capacity: number;
  private nextIndex = 0;

  constructor(initialCapacity = 64) {
    this.capacity = initialCapacity;
    this.data = new Float32Array(initialCapacity * TransformBuffer.STRIDE);
  }

  allocate(): number {
    if (this.freeList.length > 0) {
      const index = this.freeList.pop()!;
      const offset = index * TransformBuffer.STRIDE;
      this.data[offset] = 0;
      this.data[offset + 1] = 0;
      this.data[offset + 2] = 0;
      this.data[offset + 3] = 1; // scaleX default
      this.data[offset + 4] = 1; // scaleY default
      return index;
    }
    if (this.nextIndex >= this.capacity) {
      this.grow();
    }
    const index = this.nextIndex++;
    const offset = index * TransformBuffer.STRIDE;
    this.data[offset + 3] = 1; // scaleX default
    this.data[offset + 4] = 1; // scaleY default
    return index;
  }

  free(index: number): void {
    const offset = index * TransformBuffer.STRIDE;
    this.data[offset] = 0;
    this.data[offset + 1] = 0;
    this.data[offset + 2] = 0;
    this.data[offset + 3] = 0;
    this.data[offset + 4] = 0;
    this.freeList.push(index);
  }

  getX(index: number): number {
    return this.data[index * TransformBuffer.STRIDE];
  }

  setX(index: number, value: number): void {
    this.data[index * TransformBuffer.STRIDE] = value;
  }

  getY(index: number): number {
    return this.data[index * TransformBuffer.STRIDE + 1];
  }

  setY(index: number, value: number): void {
    this.data[index * TransformBuffer.STRIDE + 1] = value;
  }

  getRotation(index: number): number {
    return this.data[index * TransformBuffer.STRIDE + 2];
  }

  setRotation(index: number, value: number): void {
    this.data[index * TransformBuffer.STRIDE + 2] = value;
  }

  getScaleX(index: number): number {
    return this.data[index * TransformBuffer.STRIDE + 3];
  }

  setScaleX(index: number, value: number): void {
    this.data[index * TransformBuffer.STRIDE + 3] = value;
  }

  getScaleY(index: number): number {
    return this.data[index * TransformBuffer.STRIDE + 4];
  }

  setScaleY(index: number, value: number): void {
    this.data[index * TransformBuffer.STRIDE + 4] = value;
  }

  setTransform(
    index: number,
    x: number,
    y: number,
    rotation: number,
    scaleX: number,
    scaleY: number,
  ): void {
    const offset = index * TransformBuffer.STRIDE;
    this.data[offset] = x;
    this.data[offset + 1] = y;
    this.data[offset + 2] = rotation;
    this.data[offset + 3] = scaleX;
    this.data[offset + 4] = scaleY;
  }

  private grow(): void {
    const newCapacity = this.capacity * 2;
    const newData = new Float32Array(newCapacity * TransformBuffer.STRIDE);
    newData.set(this.data);
    this.data = newData;
    this.capacity = newCapacity;
  }
}
