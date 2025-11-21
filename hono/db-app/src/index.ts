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

app.get("/get-data", (c) => {
  try {
    const model_instance = new Model();
    const view_instance = new View();

    // データの取得
    const rawDataModel = model_instance.getRawData() as Model;
    //データの整形
    const transformView = view_instance.transformSortedData(rawDataModel.raw_data);

    return c.json({ message: "Hello, TypeScript!", status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return c.json({ message: "Error fetching data", status: 500 });
  }
})
export default app
