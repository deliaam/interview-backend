var express = require("express");
var router = express.Router();
const multer = require("multer");

const fs = require("fs");
const { promisify } = require("util");
const pipeline = promisify(require("stream").pipeline);

const { Readable } = require("stream");
const fsExtra = require("fs-extra");

const isValidCustomers = (file) => {
  const firstLine = file.slice(0, file.indexOf("\r\n"));
  const attributes = firstLine.split(",");
  if (
    attributes[0] !== "id" ||
    attributes[1] !== "firstname" ||
    attributes[2] !== "lastname"
  )
    return false;
  return true;
};

const isValidProducts = (file) => {
  const firstLine = file.slice(0, file.indexOf("\r\n"));
  const attributes = firstLine.split(",");
  if (
    attributes[0] !== "id" ||
    attributes[1] !== "name" ||
    attributes[2] !== "cost"
  )
    return false;
  return true;
};

const isValidOrders = (file) => {
  const firstLine = file.slice(0, file.indexOf("\r\n"));
  const attributes = firstLine.split(",");
  if (
    attributes[0] !== "id" ||
    attributes[1] !== "customer" ||
    attributes[2] !== "products"
  )
    return false;
  return true;
};

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

const upload = multer();
router.post("/upload", upload.array("files"), async function (req, res, next) {
  const { files } = req;
  const promises = [];
  const fileNames = ["customers.csv", "products.csv", "orders.csv"];
  const isValidFunctions = [isValidCustomers, isValidProducts, isValidOrders];
  const loadedFiles = JSON.parse(req.body.loadedFiles);

  try {
    files.forEach((file, index) => {
      if (file.mimetype != "text/csv") {
        throw new Error(
          "El tipo de archivo no es válido. Adjunta un archivo csv"
        );
      }
      if (!isValidFunctions[loadedFiles[index]](file.buffer.toString("utf8"))) {
        throw new Error("El formato del archivo no es válido.");
      }
      const readStream = new Readable();
      readStream._read = function noop() {};
      readStream.push(file.buffer);
      readStream.push(null);
      promises.push(
        pipeline(
          readStream,
          fs.createWriteStream(
            `${__dirname}/../public/input/${fileNames[loadedFiles[index]]}`
          )
        )
      );
    });
  } catch (error) {
    res.status(500).send(error.message);
    return;
  }
  if (files.length !== 0) fsExtra.emptyDir(`${__dirname}/../public/output`);
  await Promise.all(promises);
  res.send("Archivos cargados correctamente");
});
module.exports = router;
