/**
 * ShutdownManager
 * ----------------
 * Centralized lifecycle manager for graceful shutdown of the application.
 *
 * Responsibilities:
 * - Listen to system signals (SIGINT, SIGTERM)
 * - Execute registered cleanup tasks in order
 * - Ensure graceful shutdown with timeout fallback
 * - Handle uncaught exceptions and unhandled rejections
 *
 * Usage:
 * @example
 * const shutdownManager = new ShutdownManager(logger);
 * shutdownManager.register("mongodb", () => mongodb.disconnect());
 * shutdownManager.init(server);
 */

export default class ShutdownManager {
     constructor(logger, options = {}) {
          this.logger = logger;
          this.tasks = [];

          this.timeout = options.timeout || 10000;
          this.isShuttingDown = false;
     }

     /**
      * Register a cleanup task
      * @param {string} name - Name of the resource
      * @param {Function} handler - Async cleanup function
      */
     register(name, handler) {
          this.tasks.push({ name, handler });
     }

     /**
      * Execute all cleanup tasks
      */
     async executeTasks() {
          this.logger.info("Executing shutdown tasks...");

          for (const task of this.tasks) {
               try {
                    this.logger.info(`Closing: ${task.name}`);
                    await task.handler();
                    this.logger.info(`${task.name} closed successfully`);
               } catch (error) {
                    this.logger.error(`Error closing ${task.name}:`, error);
               }
          }
     }

     /**
      * Graceful shutdown handler
      */
     async shutdown(signal, server) {
          if (this.isShuttingDown) return;
          this.isShuttingDown = true;

          this.logger.info(`${signal} received. Starting graceful shutdown...`);

          // Force shutdown fallback
          const forceTimeout = setTimeout(() => {
               this.logger.error("Forced shutdown triggered");
               process.exit(1);
          }, this.timeout);

          try {
               // Stop accepting new connections
               if (server) {
                    await new Promise((resolve) => {
                         server.close(() => {
                              this.logger.info("HTTP server closed");
                              resolve();
                         });
                    });
               }

               // Run cleanup tasks
               await this.executeTasks();

               clearTimeout(forceTimeout);
               this.logger.info("Shutdown completed successfully");
               process.exit(0);

          } catch (error) {
               this.logger.error("Shutdown failed:", error);
               process.exit(1);
          }
     }

     /**
      * Initialize listeners
      */
     init(server) {
          process.on("SIGINT", () => this.shutdown("SIGINT", server));
          process.on("SIGTERM", () => this.shutdown("SIGTERM", server));

          process.on("uncaughtException", (error) => {
               this.logger.error("Uncaught Exception:", error);
               this.shutdown("uncaughtException", server);
          });

          process.on("unhandledRejection", (reason, promise) => {
               this.logger.error("Unhandled Rejection:", { reason, promise });
               this.shutdown("unhandledRejection", server);
          });
     }
}