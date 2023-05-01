const express = require("express");
const app = express();
const path = require("path");
const XLSX = require("xlsx");

const port = 3000;
app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "../public/Index.html"));
});

app.get("/data", async function (req, res) {
  const workbook = XLSX.readFile(__dirname + "/assets/poesy.xlsx");
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const dataToJson = XLSX.utils.sheet_to_json(worksheet);
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(dataToJson));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
