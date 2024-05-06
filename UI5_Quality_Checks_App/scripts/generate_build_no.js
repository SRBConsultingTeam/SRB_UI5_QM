var fs = require("fs");
console.log("Incrementing build number...");

var manifestFilePath = "./webapp/manifest.json";

fs.readFile(manifestFilePath, function (err, content) {
  if (err) throw err;
  var manifest = JSON.parse(content);
  var version = manifest._version;

  var major = Number(version.split(".")[0]);
  var minor = Number(version.split(".")[1]);
  var revision = Number(version.split(".")[2]);

  var commitHash = require("child_process").execSync("git rev-parse --short HEAD").toString().trim();

  revision = revision + 1;

  manifest._version = major + "." + minor + "." + revision;

  manifest._srbVersionInfo.latestCommitHash = commitHash;

  fs.writeFile(manifestFilePath, JSON.stringify(manifest), function (err) {
    if (err) throw err;
    console.log(`Current build number: ${version}`);
  });
});
