import http from 'k6/http';
import {sleep, check} from 'k6'

export const options = {
    vus: 390,
    duration: '10m',
    thresholds: {
        http_req_duration: ['p(95)<200'],
        http_req_duration: ['p(100)<2000']
    }
}

export default function () {
    const res = http.get( 'http://127.0.0.1:5003/userinfo');
    check(res, {
        'status was 200': (r) => r.status == 200,
        'response was < 2000ms (2s)': (r) => r.timings.duration < 2000,
        'response was <= 200ms': (r) => r.timings.duration <= 200,
    });
    sleep(1);
}