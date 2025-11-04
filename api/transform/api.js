const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const app = express();
const PORT = 3000;

// CORS設定 - 全て許可
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "ngrok-skip-browser-warning",
    ],
  })
);

// プリフライトリクエスト対応
app.options("*", cors());

// 追加のCORSヘッダー設定
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// ルートエンドポイント
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "API Server Running" });
});

// test.js実行エンドポイント
app.get("/test", (req, res) => {
  const testJsPath = path.join(__dirname, "test.js");

  exec(`node ${testJsPath}`, (error, stdout, stderr) => {
    if (error) {
      res.json({
        status: "error",
        message: "test.js実行エラー",
        error: error.message,
        stderr: stderr,
      });
    } else {
      res.json({
        status: "success",
        message: "test.js実行完了",
        output: stdout,
        stderr: stderr || null,
      });
    }
  });
});

// ページを開くときの処理
app.get("/open", async (req, res) => {
  try {
    // transform.jsから関数をインポート
    const transform = require("./transform.js");
    // getOrder()の完了を待つ
    console.log("オーダーデータ取得中...");
    console.log("オーダーデータ取得完了。transform処理開始...");

    // transformHLとtransformRを実行
    const hlResult = transform.transformToHL();
    console.log("HL処理完了", hlResult);
    const rResult = transform.transformToR();
    console.log("R処理完了", rResult);

    // ai_adviceを実行
    const { ai_advice } = require("./ai_advice.js");
    const advice = await ai_advice();
    console.log("AIアドバイス取得完了", advice);
    res.json({
      status: "success",
      message: "transform処理完了",
      data: {
        transformHL: hlResult,
        transformR: rResult,
        ai_advice: advice,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "transform処理エラー",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/ai_advice", async (req, res) => {
  try {
    // ai_advice.jsから関数をインポート
    const { ai_advice } = require("./ai_advice.js");

    // ai_advice()を実行
    const advice = await ai_advice();

    res.json({
      status: "success",
      message: "AIアドバイス取得成功",
      data: advice,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "AIアドバイス取得エラー",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`APIサーバー起動: http://localhost:${PORT}`);
});

module.exports = app;
