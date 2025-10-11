// Grab elements
const tableBody = document.querySelector('#myTable tbody');
const saveBtn = document.getElementById('saveData');
const printBtn = document.getElementById('print');
const addRowBtn = document.getElementById('addRow');
const exportExcelBtn = document.getElementById('exportExcel');
const toggleDarkModeBtn = document.getElementById('toggleDarkMode');
const searchBox = document.getElementById('searchBox');
const toastEl = document.getElementById('liveToast');
const toastMsg = document.getElementById('toastMsg');

let toastInstance = null;

// ====== Toast helper ======
function showToast(message = "Success", color = "bg-success") {
  toastEl.className = `toast align-items-center text-white ${color} border-0`;
  toastMsg.textContent = message;
  if (!toastInstance) toastInstance = new bootstrap.Toast(toastEl);
  toastInstance.show();
}

// ====== Update row numbers ======
function updateRowNumbers() {
  document.querySelectorAll('#myTable tbody tr').forEach((row, i) => {
    row.querySelector('.SNO').textContent = i + 1;
  });
}

// ====== Add Delete Button to Row ======
function addDeleteButton(row) {
  // Check if already exists
  if (row.querySelector('td:last-child button')) return;

  const td = document.createElement('td');
  const btn = document.createElement('button');
  btn.className = 'btn btn-sm btn-outline-danger';
  btn.innerHTML = '<i class="bi bi-trash"></i>';
  btn.title = 'Delete this row';
  btn.addEventListener('click', () => {
    if (confirm('Delete this row?')) {
      row.remove();
      updateRowNumbers();
      showToast("Row deleted", "bg-warning");
    }
  });

  td.appendChild(btn);
  row.appendChild(td);
}

// ====== Add new empty row ======
function addNewRow() {
  const rowCount = tableBody.rows.length;
  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td class="SNO">${rowCount + 1}</td>
    <td><input type="text" class="form-control" /></td>
    <td><input type="date" class="form-control" /></td>
    <td><input type="date" class="form-control" /></td>
    <td><input type="number" class="form-control" /></td>
    <td><input type="number" class="form-control" /></td>
    <td><input type="number" class="form-control" /></td>
    <td><input type="number" class="form-control" /></td>
    <td><input type="tel" class="form-control" /></td>
    <td><input type="text" class="form-control" /></td>
  `;
  addDeleteButton(newRow);
  tableBody.appendChild(newRow);
  showToast("Row added", "bg-info");
}

// ====== Save to localStorage ======
function saveToLocalStorage() {
  const rows = [];
  document.querySelectorAll('#myTable tbody tr').forEach(row => {
    const rowData = Array.from(row.querySelectorAll('input')).map(input => input.value);
    rows.push(rowData);
  });
  localStorage.setItem('farmerData', JSON.stringify(rows));
  showToast("Data saved!");
}

// ====== Load from localStorage ======
function loadFromLocalStorage() {
  const data = JSON.parse(localStorage.getItem('farmerData') || '[]');
  if (data.length === 0) return;

  tableBody.innerHTML = '';
  data.forEach((rowData, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="SNO">${index + 1}</td>
      <td><input type="text" class="form-control" value="${rowData[0] || ''}"/></td>
      <td><input type="date" class="form-control" value="${rowData[1] || ''}"/></td>
      <td><input type="date" class="form-control" value="${rowData[2] || ''}"/></td>
      <td><input type="number" class="form-control" value="${rowData[3] || ''}"/></td>
      <td><input type="number" class="form-control" value="${rowData[4] || ''}"/></td>
      <td><input type="number" class="form-control" value="${rowData[5] || ''}"/></td>
      <td><input type="number" class="form-control" value="${rowData[6] || ''}"/></td>
      <td><input type="tel" class="form-control" value="${rowData[7] || ''}"/></td>
      <td><input type="text" class="form-control" value="${rowData[8] || ''}"/></td>
    `;
    addDeleteButton(tr);
    tableBody.appendChild(tr);
  });
}

// ====== Print ======
function printTable() {
  window.print();
}

// ====== Export to Excel (SheetJS) ======
function exportTableToExcel() {
  const table = document.getElementById('myTable');
  const wb = XLSX.utils.table_to_book(table, { sheet: 'Sheet1' });
  XLSX.writeFile(wb, 'FarmerData.xlsx');
}

// ====== Filter/Search ======
function filterRows() {
  const query = searchBox.value.trim().toLowerCase();
  document.querySelectorAll('#myTable tbody tr').forEach(row => {
    const name = row.cells[1].querySelector('input')?.value.toLowerCase() || '';
    const phone = row.cells[8].querySelector('input')?.value.toLowerCase() || '';
    if (name.includes(query) || phone.includes(query)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// ====== Dark Mode Toggle ======
function toggleDarkMode() {
  document.body.classList.toggle('bg-dark');
  document.body.classList.toggle('text-light');

  // Header and footer
  document.querySelector('header').classList.toggle('bg-light');
  document.querySelector('header').classList.toggle('bg-dark');
  document.querySelector('header').classList.toggle('text-light');
  document.querySelector('footer').classList.toggle('bg-dark');
  document.querySelector('footer').classList.toggle('bg-light');
  document.querySelector('footer').classList.toggle('text-light');

  // Table dark mode
  const table = document.getElementById('myTable');
  table.classList.toggle('table-dark');
  table.classList.toggle('table-light');

  // Buttons toggle style
  document.querySelectorAll('button').forEach(btn => {
    btn.classList.toggle('btn-outline-light');
    btn.classList.toggle('btn-outline-dark');
  });
}

// ====== Initialize ======
function init() {
  // Add delete buttons to existing rows
  document.querySelectorAll('#myTable tbody tr').forEach(row => addDeleteButton(row));

  // Load saved data
  loadFromLocalStorage();

  // Event listeners
  addRowBtn.addEventListener('click', () => {
    addNewRow();
    updateRowNumbers();
  });

  saveBtn.addEventListener('click', () => {
    saveToLocalStorage();
  });

  printBtn.addEventListener('click', () => {
    printTable();
  });

  exportExcelBtn.addEventListener('click', () => {
    exportTableToExcel();
  });

  searchBox.addEventListener('input', () => {
    filterRows();
  });

  toggleDarkModeBtn.addEventListener('click', () => {
    toggleDarkMode();
  });
}

init();
