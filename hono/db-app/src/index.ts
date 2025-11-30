import { Hono } from 'hono'
import Model from './model'
import { View } from './view'
const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

app.get("/get-data", async (c) => {
  try {
    const model = new Model();
    await model.importOrders();

    const view = new View(model);
    await view.response();

    return c.json({
      message: "Dashboard data generated",
      status: 200,
      data: {
        sorted_weights: view.sortedData,
        days_counts: view.daysCount,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return c.json({ message: "Error fetching data", status: 500 });
  }
})
export default app
