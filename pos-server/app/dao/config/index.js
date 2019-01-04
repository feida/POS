/**
 * @author wxh on 2017/12/25
 * @copyright
 * @desc
 */


var minimist = require('minimist');
var args = minimist(process.argv.slice(2));
let npm_lifecycle_event = process.env.npm_lifecycle_event;

npm_lifecycle_event = !!npm_lifecycle_event?  npm_lifecycle_event.substring(0,3) :npm_lifecycle_event;

let env = args.env;

let NODE_ENV =   env ? env : npm_lifecycle_event;

NODE_ENV = NODE_ENV ? NODE_ENV.toLowerCase() :  'pro';

if(NODE_ENV != 'pro' && NODE_ENV != 'box'  && NODE_ENV != 'dev'){
    throw new Error('NODE_ENV must be "box" or "pro" or "dev"');
}
console.log('NODE_ENV===',NODE_ENV);
const config  = require('./' + NODE_ENV);

module.exports = config;