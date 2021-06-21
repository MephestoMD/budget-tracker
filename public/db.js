let db;

// Create a new db request for a "budget" database.
const request = indexedDB.open("Budget", 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onerror = (event) => {
  console.log(`Database error: ${event.target.errorCode}`);
};

request.onsuccess = (event) => {
  db = event.target.result;

  if (nagivator.onLine) {
    checkDatabase();
  }
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
