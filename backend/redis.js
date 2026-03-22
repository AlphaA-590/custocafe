'use strict';

const redis = require('redis');

const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('connect', () => {
    console.log('✅  Redis conectado');
});

client.on('ready', () => {
    console.log('✅  Redis pronto para uso');
});

client.on('error', (err) => {
    console.error('❌  Erro no cliente Redis:', err.message);
});

client.on('reconnecting', () => {
    console.warn('⚠️   Redis reconectando...');
});

// Connect asynchronously – errors are logged but do not crash the server
client.connect().catch(err => {
    console.error('⚠️   Não foi possível conectar ao Redis:', err.message);
});

module.exports = client;
