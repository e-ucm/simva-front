module.exports = {
  apps: [
    {
      name: "main-app",
      script: "/app/bin/www",
      restart_delay: 5000,
      out_file: "/dev/stdout",
      error_file: "/dev/stderr",
      merge_logs: true,
      env : {
        PROCESS_TAG: "[MAIN]"
      }
    },
    {
      name: "process-cron-task",
      script: "/app/bin/cron-task.js",
      restart_delay: 5000,
      out_file: "/dev/stdout",
      error_file: "/dev/stderr",
      merge_logs: true,
      env : {
        PROCESS_TAG: "[CRON_TASK]"
      }
    }
  ]
};