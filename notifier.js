const {getAllBuilds, getComputer} = require("./api-client")
const _ = require('lodash')
const notifier = require('node-notifier');
const path = require('path');
const config = require('./config.json')

let icon = path.join(__dirname, 'icon.png');

let formatDuration = function (ms) {
  return Math.ceil(ms / 1000) + "s"
}

let oldBuilds = {};

let checkJobs = function () {

  let checkBuilds = function (job) {
    getAllBuilds(job, 5).then(function (data) {
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
          let message = `Name: ${newBuild.fullDisplayName}`
          message += `\nDuration: ${formatDuration(newBuild.duration)}`
          message += `\nResult: ${newBuild.result}`
          notifier.notify({
            title: 'Jenkins Build Completed',
            message: message,
            icon: icon,
            wait: true,
            time: 10 * 1000,
          });
        } else if (newBuild.building && !isBuildSeen) {
          let message = `Name: ${newBuild.fullDisplayName}`
          message += `\nEstimated duration: ${formatDuration(newBuild.estimatedDuration)}`
          notifier.notify({
            title: 'Jenkins Build Initiated',
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
        title: 'Jenkins Notifier',
        message: "" + err,
        icon: icon,
      })
    });
  };

  config.jobs.forEach(checkBuilds)
}

let checkComputers = function () {

  let checkComputer = function (computer) {
    getComputer(computer, 5).then(function (data) {
      let newBuilds = {}
      let executors = data.executors
      executors.forEach(executor => {
        if (!executor.currentExecutable) return;
        newBuilds[executor.currentExecutable.fullDisplayName] = executor.currentExecutable
      })

      for (let i in newBuilds) {
        if (!newBuilds.hasOwnProperty(i)) continue

        let newBuild = newBuilds[i]

        if (!oldBuilds.hasOwnProperty(i)) {
          let message = `Name: ${newBuild.fullDisplayName}`
          if (newBuild.changeSet.items.length > 0) {
            message += `\nChange: ${newBuild.changeSet.items[0].msg}`
            message += `\nAuthor: ${newBuild.changeSet.items[0].authorEmail}`
          }
          message += `\nEstimated Duration: ${formatDuration(newBuild.estimatedDuration)}`
          notifier.notify({
            title: 'Jenkins Build Initiated',
            message: message,
            icon: icon,
            wait: true,
            time: 10 * 1000,
          });
        }
      }

      for (let i in oldBuilds) {
        if (!oldBuilds.hasOwnProperty(i)) continue

        let oldBuild = oldBuilds[i]

        if (!newBuilds.hasOwnProperty(i)) {
          let message = `Name: ${oldBuild.fullDisplayName}`
          if (oldBuild.changeSet.items.length > 0) {
            message += `\nChange: ${oldBuild.changeSet.items[0].msg}`;
            message += `\nAuthor: ${oldBuild.changeSet.items[0].authorEmail}`;
          }

          notifier.notify({
            title: 'Jenkins Build Completed',
            message: message,
            icon: icon,
            wait: true,
            time: 10 * 1000,
          });
        }
      }

      oldBuilds = newBuilds
    }).catch(function (err) {
      notifier.notify({
        title: 'Jenkins Notifier',
        message: "" + err,
        icon: icon,
      })
    });
  };

  config.computers.forEach(checkComputer)
}

let func = config.mode === "computers" ? checkComputers : checkJobs;

func();
setInterval(func, config.interval_in_seconds * 1000);
