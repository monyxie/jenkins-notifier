const axios = require('axios').default;
// const fs = require('fs');
// const path = require('path');
// const jenkinsapi = require('jenkins-api');
const config = require('./config.json');
const {URL} = require('url');

module.exports.getAllBuilds = function getAllBuilds(job, num) {
  let url = new URL(config.url)
  url.username = config.user
  url.password = config.token
  url.pathname = `/job/${job}/api/json`
  // url.pathname = `/api/json`
  let params = {
    tree: `allBuilds[id,building,estimatedDuration,fullDisplayName,result,duration]{0,${num}}`,
    // tree: 'allBuilds[*]{0,10}',
    depth: 1
  }
  return axios.get(url.toString(), {"params": params,})
    .then(response => response.data);
}

module.exports.getComputer = function getComputer(computer) {
  let url = new URL(config.url)
  url.username = config.user
  url.password = config.token
  url.pathname = `/computer/(${computer})/api/json`
  let params = {
    tree: `executors[currentExecutable[id,building,estimatedDuration,fullDisplayName,result,duration,changeSet[items[msg,authorEmail]{0,1}]]]`,
    depth: 1
  }
  return axios.get(url.toString(), {"params": params,})
    .then(response => response.data);
}
