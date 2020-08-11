import { Redis } from 'ioredis';
import isEmpty from 'lodash/isEmpty';
import { getLogger } from './getLogger';
import { ReqRes } from './reqres';

const logger = getLogger('[relay] processMsg.js');

// KEYS[1] - publish channel / main list
// ARGV[1] - message string
// ARGV[2] - offset
const lua = `
local cnt = 0
local sid = redis.call("xadd", KEYS[1], "*", "msg", ARGV[1])
if sid then
  redis.call("publish", KEYS[1], sid)

  local xpr = redis.call("xrange", KEYS[1], "-", ARGV[2])
  for i = 1, #xpr do
    cnt = cnt + redis.call("xdel", KEYS[1], xpr[i][1])
  end

  return cnt
else
  return -1
end
`;

export const processMessage = ({
  message,
  client,
  topic,
  ttl,
}: {
  message: ReqRes;
  client: Redis;
  topic: string;
  ttl?: number;
}) => {
  return new Promise<number>((resolve, reject) => {
    if (isEmpty(message))
      reject(new Error('Message missing'));
    else if (isEmpty(client))
      reject(new Error('Client missing'));
    else if (isEmpty(topic))
      reject(new Error('Topic missing'));
    else {
      const messageStr = JSON.stringify(message);
      const timestamp = Date.now();
      const offset = '' + (timestamp - (ttl ? ttl : 86400000)); // 1 day == 24x60x60x1000 milliseconds

      client.eval(lua, 1, [topic, messageStr, offset])
        .then(value => {
          if (value >= 0)
            resolve(value);
          else
            reject(new Error(`lua script returns ${value}`));
        })
        .catch(error => reject(error));
    }
  });
};
