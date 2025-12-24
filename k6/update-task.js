import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50,
  duration: '30s',
};

export default function () {
  // For demo, update a fixed ID (should be parameterized in real test)
  const url = 'http://localhost:3000/api/tasks/1';
  const payload = JSON.stringify({ name: 'Updated Perf Task', status: 'completed' });
  const params = { headers: { 'Content-Type': 'application/json' } };
  let res = http.put(url, payload, params);
  check(res, { 'status is 200 or 201': (r) => r.status === 200 || r.status === 201 });
  sleep(1);
}
