import Axios from "axios";
import React, { useState } from "react";
import "./App.css";
import fileDownload from "js-file-download";
import ReactJsAlert from "reactjs-alert";

function App() {
  const [customers, setCustomers] = useState();
  const [products, setProducts] = useState();
  const [orders, setOrders] = useState();

  const [ordersEvent, setOrdersEvent] = useState({ target: { value: null } });
  const [customersEvent, setCustomersEvent] = useState({
    target: { value: null },
  });
  const [productsEvent, setProductsEvent] = useState({
    target: { value: null },
  });

  const [errorStatus, setErrorStatus] = useState(false);
  const [errorQuote, setErrorQuote] = useState("");
  const [successStatus, setSuccessStatus] = useState(false);
  const [successQuote, setSuccessQuote] = useState("");

  const load = (event) => {
    const data = new FormData();
    data.append("files", customers);
    data.append("files", products);
    data.append("files", orders);
    const loadedFiles = [];
    if (customers !== undefined) loadedFiles.push(0);
    if (products !== undefined) loadedFiles.push(1);
    if (orders !== undefined) loadedFiles.push(2);
    data.append("loadedFiles", JSON.stringify(loadedFiles));

    setCustomers(undefined);
    setProducts(undefined);
    setOrders(undefined);
    ordersEvent.target.value = null;
    customersEvent.target.value = null;
    productsEvent.target.value = null;

    Axios.post("http://localhost:3001/upload", data)
      .then((res) => {
        setSuccessStatus(true);
        setSuccessQuote(res.data);
      })
      .catch((err) => {
        if (err.response.status === 500) {
          const error = err.response.data;
          setErrorStatus(true);
          setErrorQuote(error);
        }
      });
  };

  const download = (type) => {
    Axios.get(`http://localhost:3001/reports/${type}`, {
      responseType: "blob",
    })
      .then((response) => {
        fileDownload(response.data, `${type}.csv`);
      })
      .catch(async (err) => {
        const error = await err.response.data.text();
        setErrorStatus(true);
        setErrorQuote(error);
      });
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="flex">
          <label htmlFor="customers">Clientes</label>
          <input
            type="file"
            id="customers"
            accept=".csv"
            onChange={(event) => {
              setCustomersEvent(event);
              setCustomers(event.target.files[0]);
            }}
          />
        </div>
        <div className="flex">
          <label htmlFor="products">Productos</label>
          <input
            type="file"
            id="products"
            accept=".csv"
            onChange={(event) => {
              setProductsEvent(event);
              setProducts(event.target.files[0]);
            }}
          />
        </div>
        <div className="flex">
          <label htmlFor="orders">Orders</label>
          <input
            type="file"
            id="orders"
            accept=".csv"
            onChange={(event) => {
              setOrdersEvent(event);
              setOrders(event.target.files[0]);
            }}
          />
        </div>
        <button onClick={load}>Cargar</button>
        <div className="flex">
          <button onClick={() => download("order_prices")}>Reporte 1</button>
          <button onClick={() => download("product_customers")}>
            Reporte 2
          </button>
          <button onClick={() => download("customer_ranking")}>
            Reporte 3
          </button>
        </div>
      </header>
      <ReactJsAlert
        status={errorStatus} // true or false
        type={"error"} // success, warning, error, info
        title={"Error"}
        quotes={true}
        quote={errorQuote}
        Close={() => setErrorStatus(false)}
      />
      <ReactJsAlert
        status={successStatus} // true or false
        type={"success"} // success, warning, error, info
        title={"Éxito"}
        quotes={true}
        quote={successQuote}
        Close={() => setSuccessStatus(false)}
      />
    </div>
  );
}
export default App;
