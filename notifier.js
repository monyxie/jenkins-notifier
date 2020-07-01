const allBuilds = require("./api-client").allBuilds
const _ = require('lodash')

const notifier = require('node-notifier');
const path = require('path');

const config = require('./config.json')

let oldBuilds = {};

let icon = path.join(__dirname, 'icon.png');

let formatDuration = function (ms) {
  return Math.ceil(ms / 1000) + "s"
}

let checkBuilds = function (job) {
  allBuilds(job, 5).then(function (data) {
    let newBuilds = _.keyBy(data.allBuilds, 'id');

    if (!oldBuilds.hasOwnProperty(job)) {
      oldBuilds[job] = newBuilds
      return
    }

    for (let id in newBuilds) {
      if (!newBuilds.hasOwnProperty(id)) {
        continue;
      }

      let newBuild = newBuilds[id];
      let isBuildSeen = oldBuilds[job].hasOwnProperty(id);

      if (!newBuild.building && (!isBuildSeen || oldBuilds[job][id].building)) {
        let message = `Build ${newBuild.fullDisplayName} completed.\n\nDuration: ${formatDuration(newBuild.duration)}\nResult: ${newBuild.result}`;
        notifier.notify({
          title: 'Jenkins Notifier',
          message: message,
          icon: icon,
          wait: true,
          time: 10 * 1000,
        });
      } else if (newBuild.building && !isBuildSeen) {
        let message = `Build ${newBuild.fullDisplayName} initiated.\n\n Estimated duration: ${formatDuration(newBuild.estimatedDuration)}`;
        notifier.notify({
          title: 'Jenkins Notifier',
          message: message,
          icon: icon,
          wait: true,
          time: 10 * 1000,
        });
      }
    }

    oldBuilds[job] = newBuilds
  }).catch(function (err) {
    notifier.notify({
      title: 'TAPD Notifier',
      message: "" + err,
      icon: icon,
    })
  });
};

let checkJobs = function () {
  config.jobs.forEach(checkBuilds)
}

checkJobs();
setInterval(checkJobs, 10 * 1000);
