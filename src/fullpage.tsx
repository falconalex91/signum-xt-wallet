import "./main.css";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { WindowType } from "app/env";
import App from "app/App";
import { getOperations } from "lib/tzkt";
import { getTokenTransfers } from "lib/better-call-dev";

ReactDOM.render(
  <App env={{ windowType: WindowType.FullPage }} />,
  document.getElementById("root")
);

Object.assign(window as any, {
  getOperations,
  getTokenTransfers,
});
