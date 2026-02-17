module.exports = {
    apps: [
        {
            name: "stockflow",
            script: "node_modules/.bin/next",
            args: "start",
            cwd: "/var/www/stock",
            env: {
                NODE_ENV: "production",
                PORT: 3001,
            },
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "500M",
        },
    ],
};
