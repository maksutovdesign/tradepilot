import { app } from "./expressApp";

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`TradePilot API listening on :${port}`);
});
