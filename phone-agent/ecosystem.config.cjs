module.exports = {
  apps: [{
    name: 'shah-phone-agent',
    cwd: __dirname,
    script: 'src/server.mjs',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '200M',
    kill_timeout: 15000,
    time: true,
    env: { NODE_ENV: 'production' },
  }],
};
