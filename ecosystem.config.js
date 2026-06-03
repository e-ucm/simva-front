module.exports = {
  apps: [
    {
      name: "main-app",
      script: "bin/www",
      watch: process.env.NODE_ENV === "development",
      restart_delay: 5000,
      node_args: process.env.NODE_ENV === "development"
        ? ( process.env.PROFILING === "true"
          ? "--inspect=0.0.0.0:9229 --prof --perf-basic-prof --interpreted-frames-native-stack" : 
          "--inspect=0.0.0.0:9229 --trace-warnings")
        : "", 
      env : {
        PROCESS_TAG: "[MAIN]"
      }
    },
    {
      name: "process-cron-task",
      script: "bin/cron-task.js",
      watch: process.env.NODE_ENV === "development",
      restart_delay: 5000,
      node_args: process.env.NODE_ENV === "development"
        ? ( process.env.PROFILING === "true"
          ? "--inspect=0.0.0.0:9230 --prof --perf-basic-prof --interpreted-frames-native-stack" : 
          "--inspect=0.0.0.0:9230 --trace-warnings")
        : "",
      env : {
        PROCESS_TAG: "[CRON_TASK]"
      }
    }
  ]
};