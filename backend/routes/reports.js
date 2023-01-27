var express = require("express");
var router = express.Router();
const fs = require("fs");
const path = require("path");
const csv = require("fast-csv");

const generateOrderPrices = require("../public/reports/order-prices");
const generateProductCustomers = require("../public/reports/product-customers");
const generateCustomerRanking = require("../public/reports/customer-ranking");

const existsFile = (filePath) => fs.existsSync(filePath);

const sendFile = (fileName, res, filePath) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
  res.sendFile(filePath);
};

const createFile = (file, filePath) => {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    csv.write(file, { headers: true }).pipe(writeStream);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
};

/* GET order_prices.csv */
router.get("/order_prices", async function (req, res, next) {
  const fileName = "order_prices.csv";
  const filePath = path.resolve(__dirname, "..", "public", "output", fileName);
  if (!existsFile(filePath)) {
    try {
      const orderPrices = await generateOrderPrices();
      await createFile(orderPrices, filePath);
    } catch (err) {
      res.status(500).send(err.message);
      return;
    }
  }
  sendFile(fileName, res, filePath);
});

/* GET product_customers.csv */
router.get("/product_customers", async function (req, res, next) {
  const fileName = "product_customers.csv";
  const filePath = path.resolve(__dirname, "..", "public", "output", fileName);
  if (!existsFile(filePath)) {
    try {
      const productCustomers = await generateProductCustomers();
      await createFile(productCustomers, filePath);
    } catch (err) {
      res.status(500).send(err.message);
      return;
    }
  }
  sendFile(fileName, res, filePath);
});

/* GET customer_ranking.csv */
router.get("/customer_ranking", async function (req, res, next) {
  const fileName = "customer_ranking.csv";
  const filePath = path.resolve(__dirname, "..", "public", "output", fileName);
  if (!existsFile(filePath)) {
    try {
      const customerRanking = await generateCustomerRanking();
      await createFile(customerRanking, filePath);
    } catch (err) {
      res.status(500).send(err.message);
      return;
    }
  }
  sendFile(fileName, res, filePath);
});

module.exports = router;
