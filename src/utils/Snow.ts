class SnowflakeId {
  private epoch: number;
  private datacenterIdBits: number = 5;
  private workerIdBits: number = 5;
  private sequenceBits: number = 12;

  private maxDatacenterId: number;
  private maxWorkerId: number;
  private sequenceMask: number;

  private datacenterIdShift: number;
  private workerIdShift: number;
  private timestampShift: number;

  private datacenterId: number;
  private workerId: number;
  private sequence: number = 0;
  private lastTimestamp: number = -1;

  constructor(
    datacenterId: number,
    workerId: number,
    epoch: number = 1288834974657,
  ) {
    // Twitter's epoch: Nov 04 2010 01:42:54 UTC
    this.epoch = epoch;

    // Calculate max values
    this.maxDatacenterId = -1 ^ (-1 << this.datacenterIdBits);
    this.maxWorkerId = -1 ^ (-1 << this.workerIdBits);
    this.sequenceMask = -1 ^ (-1 << this.sequenceBits);

    // Calculate shifts
    this.datacenterIdShift = this.sequenceBits + this.workerIdBits;
    this.workerIdShift = this.sequenceBits;
    this.timestampShift =
      this.sequenceBits + this.workerIdBits + this.datacenterIdBits;

    // Validate inputs
    if (datacenterId > this.maxDatacenterId || datacenterId < 0) {
      throw new Error(
        `Datacenter ID must be between 0 and ${this.maxDatacenterId}`,
      );
    }
    if (workerId > this.maxWorkerId || workerId < 0) {
      throw new Error(`Worker ID must be between 0 and ${this.maxWorkerId}`);
    }

    this.datacenterId = datacenterId;
    this.workerId = workerId;
  }

  generate(): bigint {
    let timestamp = this.currentTimestamp();

    // Clock moved backwards
    if (timestamp < this.lastTimestamp) {
      throw new Error("Clock moved backwards. Refusing to generate ID");
    }

    // Same millisecond - increment sequence
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & this.sequenceMask;

      // Sequence overflow - wait for next millisecond
      if (this.sequence === 0) {
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      // New millisecond - reset sequence
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    // Construct the ID
    const id =
      (BigInt(timestamp - this.epoch) << BigInt(this.timestampShift)) |
      (BigInt(this.datacenterId) << BigInt(this.datacenterIdShift)) |
      (BigInt(this.workerId) << BigInt(this.workerIdShift)) |
      BigInt(this.sequence);

    return id;
  }

  private currentTimestamp(): number {
    return Date.now();
  }

  private waitNextMillis(lastTimestamp: number): number {
    let timestamp = this.currentTimestamp();
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTimestamp();
    }
    return timestamp;
  }

  // Utility method to parse a Snowflake ID
  parse(id: bigint): {
    timestamp: Date;
    datacenterId: number;
    workerId: number;
    sequence: number;
  } {
    const timestampShift = BigInt(this.timestampShift);
    const datacenterIdShift = BigInt(this.datacenterIdShift);
    const workerIdShift = BigInt(this.workerIdShift);

    const timestamp = Number((id >> timestampShift) + BigInt(this.epoch));
    const datacenterId = Number(
      (id >> datacenterIdShift) & BigInt(this.maxDatacenterId),
    );
    const workerId = Number((id >> workerIdShift) & BigInt(this.maxWorkerId));
    const sequence = Number(id & BigInt(this.sequenceMask));

    return {
      timestamp: new Date(timestamp),
      datacenterId,
      workerId,
      sequence,
    };
  }
}

export default SnowflakeId;
