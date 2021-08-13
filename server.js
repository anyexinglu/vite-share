import express from "express";
import fs from "fs";
import path from "path";
import { transform } from "esbuild";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.get("*", async function (req, res) {
  const { originalUrl: url } = req;
  console.log("...url", url);

  if (url === "/") {
    const html = fs.readFileSync("./src/index.html");
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } else if (url.includes(".js") || !url.includes(".")) {
    // js / jsx 文件
    let fileName = url.slice(1);
    let content;
    let filePath = path.join(__dirname, "src", fileName);
    if (!fileName.includes(".")) {
      console.log("...filePath", filePath);
      if (fs.existsSync(p + ".js")) {
        // js
        filePath = p + ".js";
      } else if (fs.existsSync(p + ".jsx")) {
        // jsx
        filePath = p + ".jsx";
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
  let result = await transform(content, {
    loader: "jsx",
  });
  // console.log("...result", result);

  return result.code;
}

function rewriteDepImport(code) {
  return code.replace(/from "(.*)"/, ($0, $1) => {
    console.log("...", $0, $1);
    return `from "./@modules/${$1}"`;
  });
}

app.listen(3100);
