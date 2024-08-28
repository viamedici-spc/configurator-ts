<div >
  <strong>Viamedici SPC</strong>
</div>

# configurator-ts

[![npm version](https://img.shields.io/npm/v/@viamedici-spc/configurator-ts)](https://www.npmjs.com/package/@viamedici-spc/configurator-ts)
[![license](https://img.shields.io/npm/l/@viamedici-spc/configurator-ts)](https://github.com/viamedici-spc/configurator-ts/blob/main/LICENSE)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/viamedici-spc/configurator-ts/main.yml?branch=main)](https://github.com/viamedici-spc/configurator-ts/actions/workflows/main.yml?query=branch%3Amain)

## Introduction

This TypeScript library simplifies the process of building configurator web applications using the _Viamedici Headless
Configuration Engine_ (HCE).

It offers all the features of the HCE through a strongly typed API, eliminating the need to
interact directly with the HCE's REST API.

This library is intended for use in a browser environment and is not compatible with server environments like **Node.js**.

## Framework Independence

The library is designed to be framework-agnostic, allowing you to use any framework of your choice to build your
configurator application. The [Demo App](https://github.com/viamedici-spc/configurator-ts-demo) is implemented with
**Vue.js**.

For **React** users, we offer a dedicated
library, [configurator-react](https://github.com/viamedici-spc/configurator-react), which is built on top of this
library. It provides easy-to-use components and hooks to streamline your development process.

## Features

The library includes additional features that make it even easier to build a configurator.

### Session Management

The HCE operates with configuration sessions, requiring a session to be created before starting a configuration.

This library includes built-in session management that handles the **session lifecycle** automatically, ensuring a
seamless user experience. For example, if a session is terminated by the HCE due to user inactivity, a new session is
automatically initiated when the user resumes activity. The previous configuration state is fully restored before
executing the latest user action.

### Apply Explain Solution

When a configuration conflict is detected and explained, the library makes it easy to apply the desired solution to
resolve the conflict.

## Getting Started

### 1. Install
This library supports both **ESM** and **CommonJS**.

   ```bash
   npm install
   yarn install
   ```

### 2. Create a Client
Set up the connection parameters for the HCE by creating a client.

```typescript
import {createClient} from "@viamedici-spc/configurator-ts";

const client = createClient({
    sessionHandler: {
        accessToken: "<your access token>",
    },
    hcaEngineBaseUrl: "https://spc.cloud.ceventis.de/hca/api/engine",
});
```

### 3. Create a Session
Using the previously created client, initiate a configuration session by specifying the _Configuration Model_ you want to use.

```typescript
const session = await client.createSession({
    configurationModelSource: {
        type: ConfigurationModelSourceType.Channel,
        deploymentName: "Car-Root",
        channel: "release",
    },
});
```

### 4. Make a Decision
You can now make your first decision for the `Painting Color` attribute by selecting (_including_) the value `Green`.

```typescript
await session.makeDecision({
    type: AttributeType.Choice,
    attributeId: {localId: "Painting Color"},
    choiceValueId: "Green",
    state: ChoiceValueDecisionState.Included,
} as ExplicitChoiceDecision)
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.