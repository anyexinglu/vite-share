import express from "express";
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.get("*", function (req, res) {
  const { originalUrl: url } = req;
  console.log("...url", url);

  if (url === "/") {
    const html = fs.readFileSync("./src/index.html");
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } else if (url.endsWith(".js") || !url.includes(".")) {
    // js文件
    let fileName = url.slice(1);
    if (!fileName.includes(".")) {
      fileName = fileName + ".js";
    }
    console.log("...fileName", fileName);
    let p = path.resolve(__dirname, "src", fileName);
    const content = fs.readFileSync(p, "utf-8");

    console.log("..p content", p, content);

    res
      .status(200)
      .set({ "Content-Type": "application/javascript" })
      .end(content);
  }
});

app.listen(3100);
