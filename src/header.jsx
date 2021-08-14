import React from "react";
import RefreshRuntime from "react-refresh";

let prevRefreshReg = window.$RefreshReg$;
window.$RefreshReg$ = (type, id) => {
  RefreshRuntime.register(
    type,
    "/Users/yangxiayan/Documents/App/src/Header.jsx " + id
  );
};

export default function Header() {
  return <div>我是header</div>;
}

$RefreshReg$(Header, "Header");
console.log("...$RefreshReg$", $RefreshReg$);
window.$RefreshReg$ = prevRefreshReg;

if (!window.__vite_plugin_react_timeout) {
  window.__vite_plugin_react_timeout = setTimeout(() => {
    window.__vite_plugin_react_timeout = 0;
    RefreshRuntime.performReactRefresh();
  }, 30);
}
