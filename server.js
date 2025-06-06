// general
import express from "express";
import { Liquid } from "liquidjs";
import "dotenv/config";
import routes from "./routes/route.js"; // Single import

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const engine = new Liquid({
  root: "./views",
  extname: ".liquid"
});

app.engine("liquid", engine.express());
app.set("views", "./views");
app.set("view engine", "liquid");

// Single route setup
routes(app);

app.set("port", process.env.PORT || 1234);

app.listen(app.get("port"), function () {
  console.log(`Project draait via http://localhost:${app.get("port")}/`);
});