- [Arquitectura del proyecto](#Arquitectura-del-proyecto)
- [Pasos seguidos y problemas encontrados](#Pasos-seguidos-y-problemas-encontrados)
- [Documentación API](#Documentación-API)
  - [Upload](#Upload)
  - [Reports](#Reports)
- [Instrucciones para arrancar la aplicación](#Instrucciones-para-arrancar-la-aplicación)
- [Manual de usuario](#Manual-de-usuario)

#Arquitectura del proyecto

Frontend: React.js, Axios
Backend: Express.js
Al tratarse de un proyecto pequeño, en el que se trata únicamente con 3 archivos sobre los que no se hacen muchas consultas, y por motivos de disponibilidad y tiempo he decidido no utilizar un almacén de datos. En su lugar, los archivos csv generados se guardan en el sistema de archivos.

#Pasos seguidos y problemas encontrados

En primer lugar, he recordado que en un proyecto anterior utilizamos el middleware "Multer" para pasar archivos a través de peticiones http. Por tanto, he buscado una guía rápida para acelerar la implementación y he encontrado esta página en la que se explica como pasar un archivo y guardarlo en el sistema de archivos:
https://picnature.de/how-to-upload-files-in-nodejs-using-multer-2-0/
En nuestro caso, he tenido que adaptarlo para poder mandar varios archivos a la vez, por lo que mirando la documentación de multer (https://github.com/expressjs/multer), he visto que se puede hacer con la opción .array.
Para poder hacer el writeStream de manera concurrente, me he fijado en la documentación del método Promise.all: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
Para poder hacer el write stream, mirando los logs, me he dado cuenta de que mi versión del multer no tiene el atributo "stream" en los files que se reciben. Sin embargo, he visto que se trataba de un objeto ReadStream, y que los archivos sí tienen el atributo "buffer", haciendo una búsqueda rápida, lo he solucionado con este post de stackoverflow: https://stackoverflow.com/questions/13230487/converting-a-buffer-into-a-readablestream-in-node-js

Posteriormente, para realizar los mappings, generar y leer los archivos csv he buscado una librería que facilite su tratamiento, y he decidido utilizar "fast-csv" ya que tiene una buena documentación(https://c2fo.github.io/fast-csv/docs/introduction/getting-started).
Siguiendo el ejemplo de "Parsing" de esta documentación, he implementado unos métodos de carga para cada archivo, que se necesite consultar para generar cada tipo de reporte.

La idea es crear en cada reporte un objeto que contiene los atributos que se piden en la especificación, que se van añadiendo mientras se recorre las filas de uno de los archivos, y se consulta la información cargada de los otros. Después, este objeto se transforma a archivo .csv utilizando el método write de la librería.
* Generar order-prices: Se cargan los productos en memoria. Después se itera sobre cada pedido, y por cada producto de la lista del pedido se consulta su precio en el objeto productos cargado anteriormente, sumándolo a una variable auxiliar que después se añade al nuevo objeto generado por cada pedido. 
* Generar product-customers: Mientras se cargan los productos, se le añade a cada uno el atribudo customer_ids. Después se itera sobre cada pedido, y por cada producto de la lista se busca su atributo customer_ids en el nuevo objeto para añadir el id del cliente. Para no tener duplicados, los productos se van añadiendo a un set, y antes de añadirlo al customer_ids se comprueba que no estén en el set.
* Generar customer-ranking: Se cargan los productos en memoria. Después mientras se cargan los clientes, se le añade a cada uno el atributo total. Después se itera sobre cada pedido, siguiendo la misma lógica que en order-prices. Finalmente se ordenan los elementos en función del total, descendentemente. 

Después he buscado cómo enviar y descargar desde la parte del cliente estos archivos y he seguido este post: https://stackoverflow.com/questions/41938718/how-to-download-files-using-axios. 

Finalmente, para desplegar el proyecto en Docker, me he descargado el docker pero al iniciar el docker desktop sale el mensaje "Docker desktop stopped" y no he conseguido que funcione. Al parecer es algún problema con la virtualización, pero la tengo activada y todo parece estar correcto. Mi suposición es que es un problema con el Windows 10 home, y tendría que actualizar al pro, pero no he tenido tiempo suficiente. 

#Documentación API

##Upload
Desde el frontend, mandamos en la petición de carga un Formdata con los distintos archivos que queremos enviar, y un array que indica el tipo de cada archivo que se ha añadido al formdata por orden. (0=customers, 1=products, 2=orders).
De esta manera, en el input de la request tendríamos algo como:
req: {
    body: {
        loadedFiles: '[0,1,2]'
    },
    files: [
        {
            fieldname: 'files',
            originalname: 'customerss.csv',
            ...
        },
        {
            fieldname: 'files',
            originalname: 'products.csv',
            ...
        },
        {
            fieldname: 'files',
            originalname: 'orders.csv',
            ...
        }
    ],
}
Pasar los tipos de los archivos, nos permite guardar los archivos con el nombre que queremos, independientemente del nombre que el usuario le haya puesto, y así poder cargarlos despúes para hacer las operaciones pertinentes sin ningún problema.
Antes de guardar los archivos, se valida cada uno de ellos, comprobando si contienen los campos especificados. Si no es así, se devuelve un error.
Si el formato del archivo no es csv, se devuelve un error.
Cada vez que se cargue un archivo nuevo, se borran todos los reportes generados, para que se genere uno nuevo con los nuevos datos cuando el usuario lo solicite.

Outputs posibles:

* Código 200: "Archivos cargados correctamente"
* Código 500: "El tipo de archivo no es válido. Adjunta un archivo csv"
* Código 500: "El formato del archivo no es válido."

##Reports
Tenemos un get por cada tipo de reporte. Cada una de estas API comprueban si ya existe el archivo generado, si es así, simplemente envían el archivo en la respuesta, si no, lo generan utilizando el método de generación correspondiente, lo guardan en el sistema de archivos y lo envían en la respuesta.
De esta manera si el usuario vuelve a solicitar generar un reporte sin haber cargado ningún archivo nuevo antes, no se vuelve a ejecutar toda la lógica.

Outputs posibles:

* Codigo 200: File
* Codigo 500:"Debes cargar el archivo con la información de pedidos"
* Codigo 500:"Debes cargar el archivo con la información de clientes"
* Codigo 500:"Debes cargar el archivo con la información de productos"

#Instrucciones para arrancar la aplicación

    1. Ejecutar npm start en la carpeta "backend"
    2. Ejecutar npm start en la carpeta "frontend". Se abrirá una página desde la que se podrá probar la aplicación.

#Manual de usuario

1. Para poder generar los reportes, se deben cargar los 3 tipos de archivos distintos, después se podrá descargar el reporte que se quiera haciendo click sobre su botón correspondiente.
2. Si se quiere modificar los datos de algún archivo en concreto, no es necesario cargarlos todos de nuevo, con cargar el archivo modificado es suficiente.
3. Los archivos permanecerán cargados en las distintas sesiones, por lo que cada vez que se utilice la aplicación, se generarán los reportes en base a los últimos archivos cargados.