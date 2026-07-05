import { Queue } from "bullmq";

import { redisConnection } from "@/lib/redis";

export const REVIEW_QUEUE_NAME = "review-queue";

export const reviewQueue = new Queue(REVIEW_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});