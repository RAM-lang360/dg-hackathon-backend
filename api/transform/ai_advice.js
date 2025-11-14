const fs = require("fs");
const path = require("path");

async function ai_advice() {
  try {
    const response = await postAPI();
    const { formatted, error } = response_format(response);
    console.log("AIアドバイス:", formatted);
    if (error.length) {
      return { status: "error", error: error };
    } else {
      return { status: "success", advice: formatted };
    }
  } catch (error) {
    return { status: "error", error: error.message };
  }
}

async function postAPI() {
  const api_key = "API_key";
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  const indicatorHL = getJsons("exinput.json");
  const indicatorR = getJsons("exremove.json");
  const resultsHL = getJsons("hl_results.json");
  const resultsR = getJsons("r_results.json");

  const prompt = createPrompt(indicatorHL, indicatorR, resultsHL, resultsR); // プロンプトを生成する関数を呼び出す

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2 },
  };

  const response_text = await fetch(`${endpoint}?key=${api_key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response_text.json();
  return result;
}

function response_format(raw_response) {
  const error = [];
  let formatted = null;
  if (!raw_response?.candidates?.length) {
    console.log("APIレスポンスが不正です");
    error.push("APIレスポンスが不正です");
    return { formatted, error };
  }
  const generatedText =
    raw_response.candidates[0]?.content?.parts?.[0]?.text || "";
  formatted = generatedText.trim();
  return { formatted, error };
}

function getJsons(file_name) {
  const filePath = path.join(__dirname, `../data/${file_name}`);
  if (!fs.existsSync(filePath)) {
    console.log("ファイルが存在しません:", filePath);
    return [];
  }
  const data = fs.readFileSync(filePath, "utf8");
  const jsonData = JSON.parse(data);
  return jsonData;
}

function createPrompt(indicatorHL, indicatorR, jsonsHL, jsonsR) {
  const prompt = `
# 命令書

あなたは経験豊富なアプリのマーケティングコンサルタントです。
以下のアプリ内購買に関するデータ分析に基づき、事業者が実行すべき具体的なマーケティング施策を、分析結果と共に提案してください。

# 提供データ

## 1. 課金額別ユーザーセグメントの月次推移

このデータは、ユーザーを課金額に応じて「超ヘビーユーザー」「ヘビーユーザー」「ライトユーザー」「超ライトユーザー」に分類し、それぞれの月ごとのユーザー数と合計課金額を示したものです。

### ユーザーセグメント定義
${JSON.stringify(indicatorHL.current, null, 2)}

### 月次データ
${JSON.stringify(jsonsHL, null, 2)}

## 2. 最終課金日からの経過日数別ユーザー数

このデータは、最終課金日からの経過日数に応じてユーザーを分類したものです。数値が大きいほど長期間課金していない（休眠している）ユーザーを示します。

### 経過日数別セグメント定義
${JSON.stringify(indicatorR.current, null, 2)}

### ユーザー数データ
${JSON.stringify(jsonsR, null, 2)}

# 指示

## Step 1: データ分析

上記のデータを詳細に分析し、以下の点を明確にしてください。

* **課金額別セグメントの傾向:**
    * 各ユーザーセグメント（超ヘビー、ヘビー、ライト、超ライト）の人数と合計課金額は、過去1年間でどのように推移していますか？
    * 特に注目すべき増減があった月はありますか？その原因として何が考えられますか？
    * アプリの収益はどのセグメントに最も依存していますか？その依存度は時間と共に変化していますか？

* **休眠・アクティブ顧客の状況:**
    * 最終課金から時間が経過している休眠顧客（特に'first', 'second'のカテゴリ）の割合はどの程度ですか？
    * アクティブな課金ユーザー（特に'third', 'fourth'のカテゴリ）は全体のどれくらいを占めていますか？

## Step 2: マーケティング施策の提案

Step 1の分析結果に基づき、以下の各ユーザーセグメントに対する具体的なマーケティング施策を提案してください。まず最優先でどのセグメントに向けてどのような施策をするべきか（キャンペーン、宣伝等）を明確にしてください。その後に各セグメントごとの施策を提案してください。
施策は、必ず**「ターゲットユーザー」「施策内容」「期待される効果」**の3つの要素を含めて、具体的かつ実行可能な形で記述してくださ
い。

* **超ヘビーユーザー向け施策:**
    * 目的: 優良顧客の維持とLTV（顧客生涯価値）の最大化、満足度の向上。
* **ヘビーユーザー向け施策:**
    * 目的: 超ヘビーユーザーへのランクアップ促進。
* **ライトユーザー向け施策:**
    * 目的: 継続課金の促進とヘビーユーザーへの育成。
* **超ライトユーザー向け施策:**
    * 目的: アプリへのエンゲージメント向上と初回・継続課金の促進。
* **休眠顧客向け施策:**
    * 目的: アプリへの復帰（カムバック）の促進と再課金。
* **アクティブ顧客向け施策:**
    * 目的: 離脱防止と継続的な利用・課金の促進。

# 出力形式

上記の分析と提案を、マークダウン形式を用いて、論理的で分かりやすくまとめてください。改行には\nでなく半角ダブルスペースを使ってください
`;
  return prompt;
}
//テスト実行
if (require.main === module) {
  const p = ai_advice();
  console.log(p);
}

// モジュールエクスポート
module.exports = {
  ai_advice,
};
