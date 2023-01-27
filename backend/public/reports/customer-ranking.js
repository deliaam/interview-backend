var express = require("express");

const fs = require("fs");
const path = require("path");
const csv = require("fast-csv");

var { loadProducts } = require("../utils/report-utils");

const loadCustomers = async (customersRanking) => {
  const filePath = path.resolve(__dirname, "..", "input", "customers.csv");
  if (!fs.existsSync(filePath)) {
    throw new Error("Debes cargar el archivo con la información de clientes");
  }
  return new Promise(async (resolve, reject) => {

    fs.createReadStream(path.resolve(__dirname, "..", "input", "customers.csv"))
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => reject(error))
      .on("data", (row) => {
        customersRanking.push({
          id: row.id,
          name: row.firstname,
          lastname: row.lastname,
          total: 0,
        })
      })
      .on("end", (rowCount) => resolve());
    
  });

};

const generateCustomerRanking = async () => {
  const products = [];
  const customersRanking = [];
  try {
    await loadProducts(products);
    await loadCustomers(customersRanking);
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
      let orderCost = 0;
      row.products.split(" ").forEach((rowProduct) => {
        orderCost += parseFloat(
          products.find((product) => product.id === rowProduct).cost
        );
      });
      customersRanking.find((customer) => customer.id === row.customer).total +=
        orderCost;
    }
    customersRanking.sort(function (a, b) {
      return b.total - a.total;
    });
    resolve(customersRanking);
  });
};

module.exports = generateCustomerRanking;
