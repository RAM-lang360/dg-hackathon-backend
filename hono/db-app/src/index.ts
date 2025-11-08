import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

app.get("/get-data", (c) => {
  try {
    console.log("Hello, TypeScript!");
    return c.json({ message: "Hello, TypeScript!", status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return c.json({ message: "Error fetching data", status: 500 });
  }
})
export default app
