export class RequestThrottler {
  private queue: (() => void)[] = [];
  private timestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;
  private processing = false;

  constructor(maxRequests = 8, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      // Clean up old timestamps
      this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);

      if (this.timestamps.length < this.maxRequests) {
        const resolve = this.queue.shift();
        if (resolve) {
          this.timestamps.push(Date.now());
          resolve();
        }
      } else {
        // Queue is full, wait until the oldest timestamp falls out of the window
        const oldest = this.timestamps[0];
        const waitTime = this.windowMs - (Date.now() - oldest);
        if (waitTime > 0) {
          // Wait with a 200ms safety buffer
          await new Promise(r => setTimeout(r, waitTime + 200));
        }
      }
    }

    this.processing = false;
  }
}
