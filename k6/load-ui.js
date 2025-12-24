import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50,
  duration: '30s',
};

export default function () {
  const url = 'http://localhost:3000';
  let res = http.get(url);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
