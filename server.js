import express from "express";
import fs from "fs";
import path from "path";
import { transform } from "esbuild";
import { watch as chokidarWatch } from "chokidar";

import { fileURLToPath } from "url";
import { createWebSocketServer } from "./ws.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const watcher = chokidarWatch(__dirname, {
  ignored: ["**/node_modules/**", "**/.git/**"],
  ignoreInitial: true,
  ignorePermissionErrors: true,
  disableGlobbing: true,
});

app.get("*", async function (req, res) {
  const { url } = req;
  console.log("...url", url);

  if (url === "/") {
    const html = fs.readFileSync("./src/index.html");
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } else if (url.endsWith("js.map")) {
    res.status(400);
  } else if (url.startsWith("/@modules/")) {
    // 第三方库
    let depName = url.replace("/@modules/", "");
    let filePath;
    if (["react", "react-dom", "react-refresh"].includes(depName)) {
      filePath = path.join(__dirname, "backup", `${depName}.js`);
    } else {
      let depRoot = path.join(__dirname, "node_modules", depName);
      console.log("...depRoot", depRoot, depRoot + "/package.json");
      let depPkg = JSON.parse(
        fs.readFileSync(depRoot + "/package.json", "utf-8")
      );
      let module = depPkg.module;
      console.log("...path.join(depRoot, module)", path.join(depRoot, module));
      filePath = path.join(depRoot, module);
    }
    let moduleContent = fs.readFileSync(filePath);
    // console.log("...depPkg", depPkg, moduleContent);
    res
      .status(200)
      .set({ "Content-Type": "application/javascript" })
      .end(moduleContent);
  } else if (!url.includes(".")) {
    // js / jsx 文件
    let fileName = url.slice(1).split("?")[0];
    let content;
    let filePath = path.join(__dirname, "src", fileName);
    if (!fileName.includes(".")) {
      console.log("...filePath", filePath);
      if (fs.existsSync(filePath + ".js")) {
        // js
        filePath = filePath + ".js";
      } else if (fs.existsSync(filePath + ".jsx")) {
        // jsx
        filePath = filePath + ".jsx";
      }
    }
    content = fs.readFileSync(filePath, "utf-8");
    if (filePath.endsWith("jsx")) {
      // 需要转化 react jsx 代码
      content = await transformJsx(content);
    }
    // console.log("...fileName", fileName, filePath, content);

    content = rewriteDepImport(content);

    res
      .status(200)
      .set({ "Content-Type": "application/javascript" })
      .end(content);
  }
});

async function transformJsx(content) {
  let params = {
    loader: "jsx",
    sourcemap: true,
  };
  if (content.includes("hello react")) {
    params.sourcefile = "/Users/yangxiayan/Documents/App/src/App.jsx";
  }
  let result = await transform(content, params);
  // console.log("...result", result);

  return result.code;
}

function rewriteDepImport(code) {
  return code.replace(/from "(.*)"/g, ($0, $1) => {
    // console.log($0, $1);
    if ($1.startsWith(".")) {
      return $0;
    }
    return `from "./@modules/${$1}"`;
  });
}

let servingApp = app.listen(3100);

const ws = createWebSocketServer(servingApp);

watcher.on("change", async file => {
  console.log("...change", file);
  ws.send({
    type: "update",
    updates: [
      {
        type: "js-update",
        timestamp: new Date().getTime(),
        path: "/src/App.jsx",
        acceptedPath: "/src/App.jsx",
      },
    ],
  });
});
