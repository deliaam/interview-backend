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
        products.push({ id: row.id, name: row.name, cost: row.cost });
      })
      .on("end", (rowCount) => resolve());
  });
};

const loadOrders = async (orders) => {
  const filePath = path.resolve(__dirname, "..", "input", "orders.csv");
  if (!fs.existsSync(filePath)) {
    throw new Error("Debes cargar el archivo con la información de pedidos");
  }
  return new Promise(async (resolve, reject) => {
    fs.createReadStream(path.resolve(__dirname, "..", "input", "orders.csv"))
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => reject(error))
      .on("data", (row) => {
        orders.push({
          id: row.id,
          customer: row.customer,
          products: row.products,
        });
      })
      .on("end", (rowCount) => resolve());
  });
};

module.exports = {
  loadProducts,
  loadOrders,
};
