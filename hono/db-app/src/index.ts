import { Hono } from 'hono'
import { View } from './view'
import Model from './model'
const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

app.get("/get-data", async (c) => {
  try {
    const model_instance = new Model();
    const view_instance = new View();

    // データの取得
    const rawData = model_instance.getRawData().raw_data;

    if (!rawData) {
      throw new Error("Raw data is not loaded");
    }

    view_instance.raw_data = rawData;

    //データの整形
    const response = await view_instance.response();
    //データの保存
    model_instance.saveJsons('sorted_weights.json', response.sortedData);
    model_instance.saveJsons('days_count.json', response.daysCount);
    //APIは現在はオフ
    //AI要約の取得（非同期処理）
    // const aiResponseModel = await model_instance.getAIResponse();


    return c.json({
      message: "transform処理完了",
      status: 200,
      data: {
        transformHL: response.sortedData,
        transformR: response.daysCount,
        aiAdvice: "" //aiResponseModel.responseを利用
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return c.json({ message: "Error fetching data", status: 500 });
  }
})
export default app
