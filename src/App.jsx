import React from "react";
import RefreshRuntime from "react-refresh";
import Header from "./header";

export default function App() {
  return (
    <div>
      <span style={{ color: "green" }}> hello react</span>
      <span>66</span>
      <Header />
    </div>
  );
}

RefreshRuntime.register(
  App,
  "/Users/yangxiayan/Documents/App/src/App.jsx " + "App"
);

if (!window.__vite_plugin_react_timeout) {
  window.__vite_plugin_react_timeout = setTimeout(() => {
    window.__vite_plugin_react_timeout = 0;
    RefreshRuntime.performReactRefresh();
  }, 30);
}
