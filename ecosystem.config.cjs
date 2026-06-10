module.exports = {
	apps: [
		{
			name: "cashflow-dashboard",
			script: "build/index.js",
			interpreter: "bun",
			env: {
				NODE_ENV: "production",
				PORT: 3000,
				ORIGIN: "https://cashflow.example.com"
			},
			instances: 1,
			exec_mode: "fork",
			watch: false,
			max_memory_restart: "256M",
			error_file: "logs/err.log",
			out_file: "logs/out.log",
			merge_logs: true,
			log_date_format: "YYYY-MM-DD HH:mm:ss"
		}
	]
};
