import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50,
  duration: '30s',
};

export default function () {
  const url = 'http://localhost:3000/api/tasks';
  const payload = JSON.stringify({ name: `Perf Task ${__VU}-${__ITER}`, status: 'not started' });
  const params = { headers: { 'Content-Type': 'application/json' } };
  let res = http.post(url, payload, params);
  check(res, { 'status is 201': (r) => r.status === 201 });
  sleep(1);
}
