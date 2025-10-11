// ========== DOM References ==========
const tableBody = document.querySelector('#myTable tbody');
const addRowBtn = document.getElementById('addRow');
const saveBtn = document.getElementById('saveData');
const printBtn = document.getElementById('print');

// ========== Feature 1: Add Row with Auto-Increment ==========
addRowBtn.addEventListener('click', () => {
    const rowCount = tableBody.rows.length;
    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <td class="SNO">${rowCount + 1}</td>
        <td><input type="text" class="form-control"></td>
        <td><input type="date" class="form-control"></td>
        <td><input type="date" class="form-control"></td>
        <td><input type="number" class="form-control"></td>
        <td><input type="number" class="form-control"></td>
        <td><input type="number" class="form-control female"></td>
        <td><input type="number" class="form-control male"></td>
        <td><input type="tel" class="form-control"></td>
        <td><input type="text" class="form-control"></td>
    `;

    tableBody.appendChild(newRow);
});

// ========== Feature 2: Input Validation ==========
function validateInputs() {
    let isValid = true;
    tableBody.querySelectorAll('tr').forEach((row, index) => {
        const inputs = row.querySelectorAll('input');
        const farmerName = inputs[0].value.trim();
        const phone = inputs[8].value.trim();

        if (farmerName === '' || phone === '' || phone.length < 10) {
            isValid = false;
            row.style.backgroundColor = '#ffcccc'; // highlight invalid row
        } else {
            row.style.backgroundColor = ''; // reset
        }
    });

    if (!isValid) alert('Please fill required fields correctly (Name & Phone Number).');
    return isValid;
}

// ========== Feature 3: Live Total KG Calculation ==========
function updateTotals() {
    let femaleTotal = 0, maleTotal = 0;

    tableBody.querySelectorAll('tr').forEach(row => {
        const female = parseFloat(row.querySelector('.female')?.value) || 0;
        const male = parseFloat(row.querySelector('.male')?.value) || 0;
        femaleTotal += female;
        maleTotal += male;
    });

    let footer = document.querySelector('tfoot');
    if (!footer) {
        footer = document.createElement('tfoot');
        document.getElementById('myTable').appendChild(footer);
    }

    footer.innerHTML = `
        <tr class="table-info">
            <td colspan="6" class="text-end fw-bold">Total KG:</td>
            <td id="totalFemale">${femaleTotal.toFixed(2)}</td>
            <td id="totalMale">${maleTotal.toFixed(2)}</td>
            <td colspan="2"></td>
        </tr>
    `;
}

tableBody.addEventListener('input', updateTotals);

// ========== Feature 4: Export to PDF ==========
printBtn.addEventListener('click', () => {
    import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').then(jsPDFModule => {
        const { jsPDF } = jsPDFModule;
        const doc = new jsPDF();

        const headers = [["S.No", "Farmer Name", "F.Date", "M.Date", "Packets", "Std Acres", "Female KG", "Male KG", "Phone", "Remark"]];
        const data = [];

        tableBody.querySelectorAll('tr').forEach(row => {
            const rowData = [];
            row.querySelectorAll('td').forEach((cell, i) => {
                if (i === 0) {
                    rowData.push(cell.textContent.trim());
                } else {
                    const input = cell.querySelector('input');
                    rowData.push(input?.value || '');
                }
            });
            data.push(rowData);
        });

        doc.autoTable({
            head: headers,
            body: data
        });

        doc.save("FarmerDetails.pdf");
    });
});

// ========== Feature 5: Save & Load using LocalStorage ==========
function saveToLocalStorage() {
    if (!validateInputs()) return;

    const tableData = [];
    tableBody.querySelectorAll('tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach((cell, i) => {
            if (i === 0) {
                rowData.push(cell.textContent.trim());
            } else {
                const input = cell.querySelector('input');
                rowData.push(input?.value || '');
            }
        });
        tableData.push(rowData);
    });

    localStorage.setItem('farmerTableData', JSON.stringify(tableData));
    alert("Data saved locally!");
    updateSavedSection();
}

function loadFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem('farmerTableData'));
    if (!data) return;

    tableBody.innerHTML = '';
    data.forEach((rowData, i) => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td class="SNO">${i + 1}</td>
            ${rowData.slice(1).map((val, idx) => `
                <td><input type="${[2, 3].includes(idx) ? 'date' : (idx === 4 || idx === 5 || idx === 6 || idx === 7 ? 'number' : 'text')}"
                     class="form-control ${idx === 6 ? 'female' : ''} ${idx === 7 ? 'male' : ''}" 
                     value="${val}">
                </td>
            `).join('')}
        `;
        tableBody.appendChild(newRow);
    });

    updateTotals();
}

function updateSavedSection() {
    const container = document.getElementById('savedPdfs');
    if (localStorage.getItem('farmerTableData')) {
        container.innerHTML = `
            <button class="btn btn-outline-primary" onclick="loadFromLocalStorage()">Load Previous Saved Data</button>
            <button class="btn btn-outline-danger ms-2" onclick="clearLocalStorage()">Clear Saved Data</button>
        `;
    }
}

function clearLocalStorage() {
    if (confirm("Are you sure you want to clear saved data?")) {
        localStorage.removeItem('farmerTableData');
        location.reload();
    }
}

saveBtn.addEventListener('click', saveToLocalStorage);

// ========== Initialize ==========
window.onload = () => {
    updateSavedSection();
    loadFromLocalStorage();
};
