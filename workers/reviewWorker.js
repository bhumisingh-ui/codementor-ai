const { Worker } = require("bullmq");
const { loadEnvConfig } = require("@next/env");

(async () => {
  loadEnvConfig(process.cwd());

  const { redisConnection } = await import("../src/lib/redis.js");
  const { startSocketServer, emitReviewEvent } = await import("../src/lib/socket.js");
  const { bugAgent } = await import("../services/agents/bugAgent.js");
  const { securityAgent } = await import("../services/agents/securityAgent.js");
  const { synthesizerAgent } = await import("../services/review/synthesizerAgent.js");
  const { default: connectDB } = await import("../src/lib/db.js");
  const { default: Submission } = await import("../src/models/Submission.js");

  startSocketServer();

  const worker = new Worker(
    "review-queue",
    async (job) => {
      const { code, language, userId } = job.data || {};

      await connectDB();

      await job.updateProgress({ stage: "bug-agent", progress: 25 });
      emitReviewEvent(userId, "review:progress", {
        jobId: job.id,
        stage: "bug-agent",
        progress: 25,
      });

      const [bugFindings, securityFindings] = await Promise.all([
        bugAgent(code, language),
        securityAgent(code, language),
      ]);

      await job.updateProgress({ stage: "security-agent", progress: 65 });
      emitReviewEvent(userId, "review:progress", {
        jobId: job.id,
        stage: "security-agent",
        progress: 65,
      });

      const performanceFindings = [];
      // performanceAgent() coming later

      await job.updateProgress({ stage: "synthesize", progress: 90 });
      emitReviewEvent(userId, "review:progress", {
        jobId: job.id,
        stage: "synthesize",
        progress: 90,
      });

      const reviewResult = await synthesizerAgent({
        code,
        language,
        bugFindings,
        securityFindings,
        performanceFindings,
      });

      await Submission.findOneAndUpdate(
        { jobId: job.id, userId },
        {
          $set: {
            status: "completed",
            reviewResult,
            errorMessage: null,
            code,
            language,
            userId,
            jobId: job.id,
          },
        },
        { new: true, upsert: true }
      );

      emitReviewEvent(userId, "review:complete", {
        jobId: job.id,
        reviewResult,
      });

      return reviewResult;
    },
    {
      connection: redisConnection,
      concurrency: 2,
    }
  );

  worker.on("completed", (job) => {
    console.log(`Review job completed: ${job.id}`);
  });

  worker.on("failed", async (job, err) => {
    console.error(`Review job failed: ${job?.id}`, err);

    try {
      await connectDB();
      if (job?.data?.userId) {
        await Submission.findOneAndUpdate(
          { jobId: job.id, userId: job.data.userId },
          {
            $set: {
              status: "failed",
              errorMessage: err.message || "Review job failed.",
            },
          },
          { new: true, upsert: true }
        );

        emitReviewEvent(job.data.userId, "review:failed", {
          jobId: job.id,
          error: err.message || "Review job failed.",
        });
      }
    } catch (persistErr) {
      console.error("Failed to persist review failure:", persistErr);
    }
  });

  process.on("SIGINT", async () => {
    await worker.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await worker.close();
    process.exit(0);
  });
})();