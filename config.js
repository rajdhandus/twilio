"use strict";

const nconf = (module.exports = require("nconf"));
const path = require("path");

nconf
  // 1. command-line arguments
  .argv()
  // 2. env variables
  .env(["GCLOUD_PROJECT", "POD_ENDPOINT"])
  // 3. config file
  .file({ file: path.join(__dirname, "config.json") })
  // 4. defaults
  .defaults({
    GCLOUD_PROJECT: "",
    POD_ENDPOINT: ""
  });

// check required settings
checkConfig("GCLOUD_PROJECT");
//checkConfig('POD_ENDPOINT');

function checkConfig(setting) {
  if (!nconf.get(setting)) {
    throw new Error(
      `You must set ${setting} as an environment variable or in config.json!`
    );
  }
}
