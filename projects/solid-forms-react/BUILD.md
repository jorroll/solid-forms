# Build Information

Through trial and error, I've discovered that `babel.config.json` must be at the top level of the repo for it to be picked up and used by Parcel (I imagine this is a workspaces related bug). Before each build, I copy the `babel.config.json` file to the top level of the repo, run the build, and then delete the copied file.

Potentially, this could cause build problems in the future since Lerna is currently configured to run builds in parallel (and the `rx-controls-solid` babel config might pollute another packages babel config).
