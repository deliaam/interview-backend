var express = require('express');

const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

var {loadProducts} = require('../utils/report-utils')


const generateOrderPrices = async () => {
    
    const products = []
    const orderPrices = []

    try{
        await loadProducts(products);
    }catch (error){
        throw new Error(error)
    }
    return new Promise(async (resolve, reject) => {
        const filePath = path.resolve(__dirname, '..','input', 'orders.csv')
        if(!fs.existsSync(filePath)) {
            reject(new Error("Debes cargar el archivo con la información de pedidos"))
            return
        }
        const stream = fs.createReadStream(filePath);
        const csvStream = csv.parse({ headers: true });
        stream.pipe(csvStream);
        for await (const row of csvStream) {
            let orderCost = 0
            row.products.split(" ").forEach(rowProduct => {
                orderCost += parseFloat(products.find(product => product.id === rowProduct).cost)
            });
            orderPrices.push({id: row.id, total: orderCost})
        }
        resolve(orderPrices);
    });
}

module.exports = generateOrderPrices;