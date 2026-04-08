import { Queue } from 'bullmq'
import Redis from 'ioredis'

// Redis connection instance
export const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
})

export interface ReviewRequestJob {
  tripId: string
  tripSlug: string
  boatName: string
  captainName: string | null
  operatorId: string
}

export const queues = {
  reviewRequests: new Queue('review-requests', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 200,
      removeOnFail: 100,
    },
  }),
}
