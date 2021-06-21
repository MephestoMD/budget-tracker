const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;

// Create a new db request for a "budget" database.
const request = indexedDB.open("Budget", 1);

request.onupgradeneeded = (event) => {
  console.log(event);
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
  db = target.result;
  console.log(navigator.onLine);
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = (event) => {
  console.log(`Database error: ${event.target.errorCode}`);
};

function checkDatabase() {
  // Open a transaction on db
  const transaction = db.transaction(["pending"], "readwrite");

  const objStore = transaction.objectStore("pending");

  const getAll = objStore.getAll();

  // If the request was successful
  getAll.onsuccess = function () {
    // Bulk add items when back online if there are pending items
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((res) => {
          // If our returned response is not empty
          if (res.length !== 0) {
            transaction = db.transaction(["pending"], "readwrite");
            const currentStore = transaction.objectStore("pending");
            //Delete records
            currentStore.clear();
          }
        });
    }
  };
}

const saveRecord = (record) => {
  // Create a transaction on the budget db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");

  // Access object store
  const objStore = transaction.objectStore("pending");

  // Add a new record to the store
  objStore.add(record);
};

// Listen for app coming back online
window.addEventListener("online", checkDatabase);
