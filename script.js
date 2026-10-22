// 1. GETING THE HTML ELEMENTS NEEDED
function getElement(id) {
  return document.getElementById(id);
}

// 2. LOADING SAVED RECORDS FROM THE BROWSER

let vehicles = JSON.parse(localStorage.getItem("tukareVehicles")) || [];
let remittances = JSON.parse(localStorage.getItem("tukareRemittances")) || [];
let expenses = JSON.parse(localStorage.getItem("tukareExpenses")) || [];
let nextID = 1;

// 3. SAVING THE THREE LISTS
function saveData() {
  localStorage.setItem("tukareVehicles", JSON.stringify(vehicles));
  localStorage.setItem("tukareRemittances", JSON.stringify(remittances));
  localStorage.setItem("tukareExpenses", JSON.stringify(expenses));
}

// 4. MAKING A SIMPLE ID FOR EACH RECORD
function makeID() {
  nextID = nextID + 1;
  return String(Date.now()) + String(nextID);
}

// 5. HELPER FUNCTIONS
function todayDate() {
  let date = new Date();
  let month = String(date.getMonth() + 1).padStart(2, "0");
  let day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

function money(amount) {
  return "KES " + Number(amount || 0).toLocaleString("en-KE");
}

function showMessage(message) {
  alert(message);
}

function getVehicleName(vehicleID) {
  for (let i = 0; i < vehicles.length; i++) {
    if (vehicles[i].id === vehicleID) {
      return vehicles[i].registration;
    }
  }
  return "General fleet";
}

// 6. SWITCHING THE DIFFERENT SECTIONS USING THE BUTTONS
function showPage(pageID) {
  let pages = document.getElementsByClassName("page");
  for (let i = 0; i < pages.length; i++) {
    pages[i].classList.add("hidden");
  }
  getElement(pageID).classList.remove("hidden");
  window.scrollTo(0, 0);
}

function showDashboardSection(sectionName) {
  let sections = ["overview", "vehicles", "remittances", "expenses"];
  for (let i = 0; i < sections.length; i++) {
    let section = getElement(sections[i] + "Section");
    if (sections[i] === sectionName) {
      section.classList.remove("hidden");
    } else {
      section.classList.add("hidden");
    }
  }

  let buttons = document.getElementsByClassName("nav-button");
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i].getAttribute("data-section") === sectionName) {
      buttons[i].classList.add("active");
    } else {
      buttons[i].classList.remove("active");
    }
  }

  let title = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
  getElement("sectionTitle").textContent = title;
}

// 7. LOGIN
function handleLogin(event) {
  event.preventDefault();
  let username = getElement("username").value.trim();
  let password = getElement("password").value.trim();

  if (username === "" || password === "") {
    showMessage("Please enter a username and password.");
    return;
  }

  getElement("signedInLabel").textContent = "Signed in as " + username;
  getElement("headerUsername").textContent = username;
  showPage("dashboardPage");
  showDashboardSection("overview");
  updateDashboard();
}

// 8. ADDING OR EDITING A VEHICLE
function saveVehicle(event) {
  event.preventDefault();

  let id = getElement("vehicleId").value;
  let registration = getElement("registration").value.trim().toUpperCase();
  let driver = getElement("driverName").value.trim();
  let target = Number(getElement("dailyTarget").value);

  if (registration === "" || driver === "" || target < 0) {
    showMessage("Please enter valid vehicle details.");
    return;
  }

  // Check that another vehicle does not use the same registration.
  for (let i = 0; i < vehicles.length; i++) {
    if (vehicles[i].registration === registration && vehicles[i].id !== id) {
      showMessage("That registration number is already on the list.");
      return;
    }
  }

  if (id === "") {
    // No ID means this is a new vehicle.
    let vehicle = {
      id: makeID(),
      registration: registration,
      driver: driver,
      dailyTarget: target,
      status: "active",
    };
    vehicles.push(vehicle);
    showMessage("Vehicle added.");
  } else {
    // An ID means we are changing an existing vehicle.
    for (let i = 0; i < vehicles.length; i++) {
      if (vehicles[i].id === id) {
        vehicles[i].registration = registration;
        vehicles[i].driver = driver;
        vehicles[i].dailyTarget = target;
      }
    }
    showMessage("Vehicle updated.");
  }

  saveData();
  getElement("vehicleForm").reset();
  getElement("vehicleId").value = "";
  getElement("vehicleFormTitle").textContent = "Add a vehicle";
  getElement("vehicleSubmitButton").textContent = "Save vehicle";
  getElement("cancelEditButton").classList.add("hidden");
  updateDashboard();
}

function editVehicle(id) {
  for (let i = 0; i < vehicles.length; i++) {
    if (vehicles[i].id === id && vehicles[i].status === "active") {
      getElement("vehicleId").value = vehicles[i].id;
      getElement("registration").value = vehicles[i].registration;
      getElement("driverName").value = vehicles[i].driver;
      getElement("dailyTarget").value = vehicles[i].dailyTarget;
      getElement("vehicleFormTitle").textContent = "Edit vehicle";
      getElement("vehicleSubmitButton").textContent = "Update vehicle";
      getElement("cancelEditButton").classList.remove("hidden");
      showDashboardSection("vehicles");
    }
  }
}

function cancelEdit() {
  getElement("vehicleForm").reset();
  getElement("vehicleId").value = "";
  getElement("vehicleFormTitle").textContent = "Add a vehicle";
  getElement("vehicleSubmitButton").textContent = "Save vehicle";
  getElement("cancelEditButton").classList.add("hidden");
}

function changeVehicleStatus(id) {
  for (let i = 0; i < vehicles.length; i++) {
    if (vehicles[i].id === id) {
      if (vehicles[i].status === "active") {
        vehicles[i].status = "sold";
      } else {
        vehicles[i].status = "active";
      }
    }
  }
  saveData();
  updateDashboard();
}

// 9. SHOWING VEHICLES IN THE TABLE AND DROPDOWN MENUS
function showVehicles() {
  let table = getElement("vehicleTable");
  let overview = getElement("dashboardVehicleTable");
  let paymentOptions = '<option value="">Choose a vehicle</option>';
  let expenseOptions = '<option value="">General fleet expense</option>';
  table.innerHTML = "";
  overview.innerHTML = "";

  if (vehicles.length === 0) {
    table.innerHTML = '<tr><td colspan="5">No vehicles added yet.</td></tr>';
    overview.innerHTML =
      '<tr><td colspan="4">No vehicle records yet.</td></tr>';
  }

  for (let i = 0; i < vehicles.length; i++) {
    let vehicle = vehicles[i];
    let status = vehicle.status;
    let actions = "";
    if (status === "active") {
      actions =
        '<button class="action-button" onclick="editVehicle(\'' +
        vehicle.id +
        "')\">Edit</button> ";
      actions +=
        '<button class="action-button danger" onclick="changeVehicleStatus(\'' +
        vehicle.id +
        "')\">Mark sold</button>";
      paymentOptions +=
        '<option value="' +
        vehicle.id +
        '">' +
        vehicle.registration +
        " - " +
        vehicle.driver +
        "</option>";
    } else {
      actions =
        '<button class="action-button" onclick="changeVehicleStatus(\'' +
        vehicle.id +
        "')\">Undo sold</button>";
    }
    expenseOptions +=
      '<option value="' +
      vehicle.id +
      '">' +
      vehicle.registration +
      "</option>";

    let row =
      "<tr><td>" +
      vehicle.registration +
      "</td><td>" +
      vehicle.driver +
      "</td><td>" +
      money(vehicle.dailyTarget) +
      "</td><td>" +
      status +
      "</td><td>" +
      actions +
      "</td></tr>";
    table.innerHTML += row;

    if (i >= vehicles.length - 5) {
      let shortRow =
        "<tr><td>" +
        vehicle.registration +
        "</td><td>" +
        vehicle.driver +
        "</td><td>" +
        money(vehicle.dailyTarget) +
        "</td><td>" +
        status +
        "</td></tr>";
      overview.innerHTML += shortRow;
    }
  }

  getElement("paymentVehicle").innerHTML = paymentOptions;
  getElement("expenseVehicle").innerHTML = expenseOptions;
}

// COLLECTIONS CLACULATIONS
// 10. ADDING AND SHOWING REMITTANCES
function saveRemittance(event) {
  event.preventDefault();
  let vehicleID = getElement("paymentVehicle").value;
  let date = getElement("paymentDate").value;
  let amount = Number(getElement("paymentAmount").value);
  let method = getElement("paymentMethod").value;

  if (vehicleID === "" || date === "" || amount <= 0) {
    showMessage("Please choose a vehicle and enter a valid payment.");
    return;
  }

  let payment = {
    id: makeID(),
    vehicleID: vehicleID,
    date: date,
    amount: amount,
    method: method,
  };
  remittances.push(payment);
  saveData();
  getElement("remittanceForm").reset();
  getElement("paymentDate").value = todayDate();
  updateDashboard();
  showMessage("Remittance saved.");
}

function showRemittances() {
  let table = getElement("remittanceTable");
  table.innerHTML = "";
  if (remittances.length === 0) {
    table.innerHTML =
      '<tr><td colspan="5">No remittances recorded yet.</td></tr>';
  }
  for (let i = 0; i < remittances.length; i++) {
    let item = remittances[i];
    let row =
      "<tr><td>" +
      item.date +
      "</td><td>" +
      getVehicleName(item.vehicleID) +
      "</td><td>" +
      money(item.amount) +
      "</td><td>" +
      item.method +
      '</td><td><button class="action-button danger" onclick="deleteRemittance(\'' +
      item.id +
      "')\">Delete</button></td></tr>";
    table.innerHTML += row;
  }
}

function deleteRemittance(id) {
  if (confirm("Delete this remittance?")) {
    let newList = [];
    for (let i = 0; i < remittances.length; i++) {
      if (remittances[i].id !== id) {
        newList.push(remittances[i]);
      }
    }
    remittances = newList;
    saveData();
    updateDashboard();
  }
}

// EXPENSES CALCULATIONS
// 11. ADDING AND SHOWING EXPENSES
function saveExpense(event) {
  event.preventDefault();
  let date = getElement("expenseDate").value;
  let category = getElement("expenseCategory").value;
  let amount = Number(getElement("expenseAmount").value);
  let vehicleID = getElement("expenseVehicle").value;
  let description = getElement("expenseDescription").value.trim();

  if (date === "" || amount <= 0) {
    showMessage("Please enter a date and a valid amount.");
    return;
  }

  let expense = {
    id: makeID(),
    date: date,
    category: category,
    amount: amount,
    vehicleID: vehicleID,
    description: description,
  };
  expenses.push(expense);
  saveData();
  getElement("expenseForm").reset();
  getElement("expenseDate").value = todayDate();
  updateDashboard();
  showMessage("Expense saved.");
}

function showExpenses() {
  let table = getElement("expenseTable");
  table.innerHTML = "";
  if (expenses.length === 0) {
    table.innerHTML = '<tr><td colspan="6">No expenses recorded yet.</td></tr>';
  }
  for (let i = 0; i < expenses.length; i++) {
    let item = expenses[i];
    let description = item.description;
    if (description === "") description = "-";
    let row =
      "<tr><td>" +
      item.date +
      "</td><td>" +
      item.category +
      "</td><td>" +
      getVehicleName(item.vehicleID) +
      "</td><td>" +
      description +
      "</td><td>" +
      money(item.amount) +
      '</td><td><button class="action-button danger" onclick="deleteExpense(\'' +
      item.id +
      "')\">Delete</button></td></tr>";
    table.innerHTML += row;
  }
}

function deleteExpense(id) {
  if (confirm("Delete this expense?")) {
    let newList = [];
    for (let i = 0; i < expenses.length; i++) {
      if (expenses[i].id !== id) {
        newList.push(expenses[i]);
      }
    }
    expenses = newList;
    saveData();
    updateDashboard();
  }
}

// 12. UPDATING THE DASHBOARD NUMBERS
function updateDashboard() {
  showVehicles();
  showRemittances();
  showExpenses();

  let activeCount = 0;
  let collectedToday = 0;
  let expensesToday = 0;
  let today = todayDate();

  for (let i = 0; i < vehicles.length; i++) {
    if (vehicles[i].status === "active") {
      activeCount = activeCount + 1;
    }
  }
  for (let i = 0; i < remittances.length; i++) {
    if (remittances[i].date === today) {
      collectedToday = collectedToday + Number(remittances[i].amount);
    }
  }
  for (let i = 0; i < expenses.length; i++) {
    if (expenses[i].date === today) {
      expensesToday = expensesToday + Number(expenses[i].amount);
    }
  }

  getElement("totalVehicles").textContent = vehicles.length;
  getElement("activeVehicles").textContent = activeCount;
  getElement("collectedToday").textContent = money(collectedToday);
  getElement("expensesToday").textContent = money(expensesToday);
}

// 13. CONNECTING THE FORMS AND BUTTONS WHEN THE PAGE OPENS
function startTukare() {
  getElement("loginForm").addEventListener("submit", handleLogin);
  getElement("vehicleForm").addEventListener("submit", saveVehicle);
  getElement("remittanceForm").addEventListener("submit", saveRemittance);
  getElement("expenseForm").addEventListener("submit", saveExpense);
  getElement("cancelEditButton").addEventListener("click", cancelEdit);

  getElement("logoutButton").addEventListener("click", function () {
    showPage("landingPage");
    getElement("loginForm").reset();
  });

  let navButtons = document.getElementsByClassName("nav-button");
  for (let i = 0; i < navButtons.length; i++) {
    navButtons[i].addEventListener("click", function () {
      showDashboardSection(navButtons[i].getAttribute("data-section"));
    });
  }

  getElement("paymentDate").value = todayDate();
  getElement("expenseDate").value = todayDate();
  updateDashboard();
}

document.addEventListener("DOMContentLoaded", startTukare);
