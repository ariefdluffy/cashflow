module.exports = {
	apps: [
		{
			name: "cashflow-dashboard",
			script: "build/index.js",

			// Env di .env — dotenv load otomatis via hooks.server.ts
			// Hanya override yg beda utk production di sini
			env: {
				NODE_ENV: "production"
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
