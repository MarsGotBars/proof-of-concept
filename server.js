// general
import express from "express";
import { Liquid } from "liquidjs";
import "dotenv/config";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const engine = new Liquid();
app.engine("liquid", engine.express());

app.set("views", "./views");

// Index route
app.get("/", async function (request, response) {

  // Geef hier aan welke pagina getoond moet worden op de / (home) route, en wat er naar de pagina gestuurd wordt
  response.render("index.liquid", {});
});

app.set("port", process.env.PORT || 1234);

app.listen(app.get("port"), function () {
  console.log(`Project draait via http://localhost:${app.get("port")}/`);
});
