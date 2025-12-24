import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50,
  duration: '30s',
};

export default function () {
  // For demo, delete a fixed ID (should be parameterized in real test)
  const url = 'http://localhost:3000/api/tasks/1';
  let res = http.del(url);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
