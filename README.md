# mongo-elastic-sync

![GitHub package.json version](https://img.shields.io/github/package-json/v/souravj96/mongo-elastic-sync)
![GitHub](https://img.shields.io/github/license/souravj96/mongo-elastic-sync)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/souravj96/mongo-elastic-sync/Node.js%20CI)
[![npm](https://img.shields.io/npm/dm/mongo-elastic-sync)](https://www.npmjs.com/package/mongo-elastic-sync)

🚀 Mongo-Elastic Sync is a Node.js library that provides synchronization between MongoDB and Elasticsearch. Seamlessly sync data changes between MongoDB collections and corresponding Elasticsearch indices.

## Installation

```bash
npm install mongo-elastic-sync
```

## Usage

```javascript
const { Sync } = require("mongo-elastic-sync");

const mongoURL = "mongodb://localhost:27017";
const elasticURL = "http://localhost:9200";

const option = {
  prefix: "auto-sync-",
  initialSync: true,
  debug: false,
};

const syncInstance = new Sync(mongoURL, elasticURL, option);

// Initial Sync (Optional)
syncInstance.initialSync();

// Start Continuous Sync
syncInstance.startSync();
```

## Configuration

- `mongoURL` (string): MongoDB connection URL.
- `elasticURL` (string): Elasticsearch connection URL.
- `option` (object):
  - `prefix` (string, optional): Prefix for Elasticsearch indices. Default is "auto-sync-".
  - `initialSync` (boolean, optional): Perform an initial sync of existing MongoDB data to Elasticsearch. Default is `true`.
  - `debug` (boolean, optional): Enable debug mode for detailed logs. Default is `false`.

## Features

- 🔄 **Initial Sync:** Syncs existing MongoDB data to Elasticsearch upon initialization.
- 🔁 **Continuous Sync:** Listens for changes in MongoDB collections and updates corresponding Elasticsearch indices.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [![npm](https://img.shields.io/npm/dm/mongo-elastic-sync)](https://www.npmjs.com/package/mongo-elastic-sync)
- [GitHub Repository](https://github.com/souravj96/mongo-elastic-sync)

Feel free to contribute, report issues, or request features on [GitHub](https://github.com/souravj96/mongo-elastic-sync).