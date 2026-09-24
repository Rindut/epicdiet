import test from 'node:test';
import assert from 'node:assert/strict';
import {createRedisStore} from '../server/store.mjs';
test('Redis store accepts Upstash or Vercel KV variable names',()=>{
  assert.ok(createRedisStore({UPSTASH_REDIS_REST_URL:'https://a.upstash.io',UPSTASH_REDIS_REST_TOKEN:'t'}));
  assert.ok(createRedisStore({KV_REST_API_URL:'https://a.upstash.io',KV_REST_API_TOKEN:'t'}));
  assert.throws(()=>createRedisStore({KV_REST_API_URL:'http://a.upstash.io',KV_REST_API_TOKEN:'t'}),/Storage unavailable/);
  assert.throws(()=>createRedisStore({}),/Storage unavailable/);
});
