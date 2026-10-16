module.exports = {
  apps: [
    {
      name: "main-app",
      script: "/app/bin/www",
      watch: true,
      restart_delay: 5000,
      out_file: "/dev/stdout",
      error_file: "/dev/stderr",
      merge_logs: true,
      node_args: process.env.PROFILING === "true"
          ? "--inspect=0.0.0.0:9229 --prof --perf-basic-prof --interpreted-frames-native-stack" : 
          "--inspect=0.0.0.0:9229 --trace-warnings", 
      env : {
        PROCESS_TAG: "[MAIN]"
      }
    },
    {
      name: "process-cron-task",
      script: "/app/bin/cron-task.js",
      watch: true,
      restart_delay: 5000,
      out_file: "/dev/stdout",
      error_file: "/dev/stderr",
      merge_logs: true,
      node_args: process.env.PROFILING === "true"
        ? "--inspect=0.0.0.0:9230 --prof --perf-basic-prof --interpreted-frames-native-stack" : 
        "--inspect=0.0.0.0:9230 --trace-warnings",
      env : {
        PROCESS_TAG: "[CRON_TASK]"
      }
    }
  ]
};