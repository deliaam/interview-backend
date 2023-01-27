var express = require("express");

const fs = require("fs");
const path = require("path");
const csv = require("fast-csv");

const loadProducts = async (products) => {
  const filePath = path.resolve(__dirname, "..", "input", "products.csv");
  if (!fs.existsSync(filePath)) {
    throw new Error("Debes cargar el archivo con la información de productos");
  }
  return new Promise(async (resolve, reject) => {
    fs.createReadStream(path.resolve(__dirname, "..", "input", "products.csv"))
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => reject(error))
      .on("data", (row) => {
        products.push({ id: row.id, customer_ids: "" });
      })
      .on("end", (rowCount) => resolve());
  });
};

const generateProductCustomers = async () => {
  const products = [];
  try {
    await loadProducts(products);
  } catch (error) {
    throw new Error(error);
  }
  return new Promise(async (resolve, reject) => {
    const filePath = path.resolve(__dirname, "..", "input", "orders.csv");
    if (!fs.existsSync(filePath)) {
      reject(
        new Error("Debes cargar el archivo con la información de pedidos")
      );
      return;
    }
    const stream = fs.createReadStream(filePath);
    const csvStream = csv.parse({ headers: true });
    stream.pipe(csvStream);
    for await (const row of csvStream) {
      const productsSet = new Set();
      row.products.split(" ").forEach((rowProduct) => {
        if (!productsSet.has(rowProduct)) {
          products.find(
            (product) => product.id === rowProduct
          ).customer_ids += ` ${row.id}`;
          productsSet.add(rowProduct);
        }
      });
    }
    resolve(products);
  });
};

module.exports = generateProductCustomers;
