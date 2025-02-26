// 🔹 Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// 🔹 Firebase Configuration
const firebaseConfig = {
  apiKey: API_KI,
  authDomain: "gpr-data-table.firebaseapp.com",
  projectId: "gpr-data-table",
  storageBucket: "gpr-data-table.appspot.com",
  messagingSenderId: "821418964490",
  appId: "1:821418964490:web:f5776a9668bb06336511f3",
  measurementId: "G-QPVQ3NLQ6S",
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let editingDocId = null; // Track which document is being edited

document.addEventListener("DOMContentLoaded", function () {
  loadSavedPdfs();
  document.getElementById("saveData").addEventListener("click", saveData);
  document.getElementById("addRow").addEventListener("click", addNewRow);
  document.getElementById("print").addEventListener("click", printTable);
});

// 🔹 Function to Extract Table Data (Fix: Store as Object Array)
function extractTableData() {
  const table = document
    .getElementById("myTable")
    .getElementsByTagName("tbody")[0];
  const rows = table.getElementsByTagName("tr");
  const data = [];

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName("td");
    const rowData = {
      sno: parseInt(cells[0].textContent.trim()) || i + 1,
      farmerName: cells[1].querySelector("input").value.trim() || "",
      fDate: cells[2].querySelector("input").value.trim() || "",
      mDate: cells[3].querySelector("input").value.trim() || "",
      packets: cells[4].querySelector("input").value.trim() || "",
      stdAcres: cells[5].querySelector("input").value.trim() || "",
      femaleKG: cells[6].querySelector("input").value.trim() || "",
      maleKG: cells[7].querySelector("input").value.trim() || "",
      phoneNumber: cells[8].querySelector("input").value.trim() || "",
      remark: cells[9].querySelector("input").value.trim() || "",
    };
    data.push(rowData);
  }
  return data;
}

// 🔹 Function to Generate PDF (Fix: Ensure Table Data is Included)
function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // 🔹 Get form values
  const organizer = document.getElementById("organizer").value;
  const village = document.getElementById("village").value;
  const variety = document.getElementById("variety").value;
  const areaIncharge = document.getElementById("areaIncharge").value;
  const district = document.getElementById("district").value;
  const mandal = document.getElementById("mandal").value;

  // 🔹 Add form details to PDF
  doc.text("Farmer Details", 20, 20);
  doc.text(`Organizer: ${organizer}`, 20, 30);
  doc.text(`Village: ${village}`, 20, 40);
  doc.text(`Variety: ${variety}`, 20, 50);
  doc.text(`Area Incharge: ${areaIncharge}`, 20, 60);
  doc.text(`District: ${district}`, 20, 70);
  doc.text(`Mandal: ${mandal}`, 20, 80);

  // 🔹 Extract and Add Table Data to PDF
  const tableData = extractTableData().map((row) => Object.values(row));
  doc.autoTable({
    head: [
      [
        "S.No",
        "Farmer Name",
        "F Date",
        "M Date",
        "Packets",
        "Std Acres",
        "Female KG",
        "Male KG",
        "Phone Number",
        "Remark",
      ],
    ],
    body: tableData,
    startY: 90,
  });

  return doc;
}

// 🔹 Function to Save or Update Data
async function saveData() {
  const pdfDoc = generatePDF(); // renamed from "doc" to "pdfDoc"
  const tableData = extractTableData();

  // 🔹 Get form values
  const organizer = document.getElementById("organizer").value;
  const village = document.getElementById("village").value;
  const variety = document.getElementById("variety").value;
  const areaIncharge = document.getElementById("areaIncharge").value;
  const district = document.getElementById("district").value;
  const mandal = document.getElementById("mandal").value;

  const pdfBase64 = btoa(
    String.fromCharCode(...new Uint8Array(pdfDoc.output("arraybuffer")))
  );

  try {
    if (editingDocId) {
      // 🔹 Update existing document
      const docRef = doc(db, "pdfLogs", editingDocId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          organizer,
          village,
          variety,
          areaIncharge,
          district,
          mandal,
          tableData,
          pdfBase64,
          timestamp: new Date().toISOString(),
        });
        alert("✅ Table Updated Successfully!");
      } else {
        alert(
          "⚠️ Error: This document no longer exists. It may have been deleted."
        );
        editingDocId = null; // Reset edit mode
      }
    } else {
      // 🔹 Save new document
      const newDocRef = await addDoc(collection(db, "pdfLogs"), {
        organizer,
        village,
        variety,
        areaIncharge,
        district,
        mandal,
        tableData,
        pdfBase64,
        timestamp: new Date().toISOString(),
      });
      editingDocId = newDocRef.id; // ✅ Assign the new document ID
      alert("✅ New Table Saved Successfully!");
    }

    editingDocId = null; // Reset edit mode
    loadSavedPdfs();
  } catch (error) {
    console.error("❌ Error saving data: ", error);
  }
}

// 🔹 Function to Load Saved PDFs from Firestore
async function loadSavedPdfs() {
  const savedPdfsContainer = document.getElementById("savedPdfs");
  savedPdfsContainer.innerHTML = "<h3>📌 Previously Saved Tables</h3>";

  try {
    const q = query(collection(db, "pdfLogs"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      savedPdfsContainer.innerHTML += `<p style="color: gray;">No saved tables found. Please save data to see logs.</p>`;
      return;
    }

    savedPdfsContainer.innerHTML += "<ul>"; // Start List
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const docId = doc.id;

      savedPdfsContainer.innerHTML += `
                <li>
                    <a href="#" onclick="downloadPdf('${
                      data.pdfBase64
                    }')">📥 Download PDF</a>
                    <button onclick="editTable('${docId}')">✏️ Edit</button>
                    <button onclick="deletePdf('${docId}')">🗑️ Delete</button>
                    (Saved on ${new Date(data.timestamp).toLocaleString()})
                </li>
            `;
    });
    savedPdfsContainer.innerHTML += "</ul>"; // End List
  } catch (error) {
    console.error("❌ Error loading PDFs: ", error);
  }
}

// 🔹 Function to Load a Saved Table for Editing
async function editTable(docId) {
  try {
    const docRef = doc(db, "pdfLogs", docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // 🔹 Load data into form
      document.getElementById("organizer").value = data.organizer;
      document.getElementById("village").value = data.village;
      document.getElementById("variety").value = data.variety;
      document.getElementById("areaIncharge").value = data.areaIncharge;
      document.getElementById("district").value = data.district;
      document.getElementById("mandal").value = data.mandal;

      // 🔹 Load table data
      const table = document
        .getElementById("myTable")
        .getElementsByTagName("tbody")[0];
      table.innerHTML = "";

      if (data.tableData && Array.isArray(data.tableData)) {
        data.tableData.forEach((row) => {
          const newRow = table.insertRow();
          const cellOrder = [
            "sno",
            "farmerName",
            "fDate",
            "mDate",
            "packets",
            "stdAcres",
            "femaleKG",
            "maleKG",
            "phoneNumber",
            "remark",
          ];

          cellOrder.forEach((key, index) => {
            const cell = newRow.insertCell(index);

            if (key === "sno") {
              cell.textContent = row[key] || table.rows.length; // Ensure S.No is a number
            } else {
              const input = document.createElement("input");
              input.type = "text";
              input.name = key; // Assigns meaningful names
              input.id = `row${table.rows.length}-col${key}`;
              input.value = row[key] || "";
              cell.appendChild(input);
            }
          });
        });
      } else {
        console.error("❌ Error: No table data found in document.");
      }

      editingDocId = docId; // Set edit mode
    }
  } catch (error) {
    console.error("❌ Error loading table: ", error);
  }
}

function downloadPdf(pdfBase64) {
  const link = document.createElement("a");
  link.href = `data:application/pdf;base64,${pdfBase64}`;
  link.download = "FarmerDetails.pdf";
  link.click();
}

// 🔹 Function to Delete PDF from Firestore
async function deletePdf(docId) {
  if (!confirm("Are you sure you want to delete this PDF?")) return;

  try {
    await deleteDoc(doc(db, "pdfLogs", docId));
    alert("✅ PDF deleted successfully!");
    loadSavedPdfs();
  } catch (error) {
    console.error("❌ Error deleting PDF: ", error);
  }
}
function addNewRow() {
  const table = document
    .getElementById("myTable")
    .getElementsByTagName("tbody")[0];
  const newRow = table.insertRow();
  const rowCount = table.rows.length;

  for (let i = 0; i < 10; i++) {
    const cell = newRow.insertCell(i);
    if (i === 0) {
      cell.textContent = rowCount;
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.name = `column${i}`; // Adds a unique name
      input.id = `row${rowCount}-col${i}`; // Adds a unique id
      cell.appendChild(input);
    }
  }
}
// 🔹 Function to Print Table as PDF (Same as Save)
function printTable() {
  const doc = generatePDF();
  doc.save("FarmerDetails.pdf");
}

// Make functions accessible from HTML
window.downloadPdf = downloadPdf;
window.deletePdf = deletePdf;
window.editTable = editTable;
