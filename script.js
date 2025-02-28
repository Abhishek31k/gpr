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
  apiKey: "AIzaSyCwbnY2EVuQpg87WVmS3fEQ749wiREmXjk",
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

// 🔹 Function to Save or Update Data
async function saveData() {
  const tableData = extractTableData(); // ✅ Only extract table data, no PDFs

  // 🔹 Get form values
  const organizer = document.getElementById("organizer").value;
  const village = document.getElementById("village").value;
  const variety = document.getElementById("variety").value;
  const areaIncharge = document.getElementById("areaIncharge").value;
  const district = document.getElementById("district").value;
  const mandal = document.getElementById("mandal").value;

  try {
      if (editingDocId) {
          const docRef = doc(db, "pdfLogs", editingDocId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
              await updateDoc(docRef, {
                  organizer, village, variety, areaIncharge, district, mandal, tableData, timestamp: new Date().toISOString()
              });
              alert("✅ Table Updated Successfully!");
          } else {
              alert("⚠️ Error: This document no longer exists.");
              editingDocId = null;
          }
      } else {
          const newDocRef = await addDoc(collection(db, "pdfLogs"), {
              organizer, village, variety, areaIncharge, district, mandal, tableData, timestamp: new Date().toISOString()
          });
          editingDocId = newDocRef.id;
          alert("✅ New Table Saved Successfully!");
      }

      editingDocId = null;
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
                  <button onclick="downloadPdf('${docId}')">📥 Download</button>
                  <button onclick="editTable('${docId}')">✏️ View or Edit</button> 
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

async function downloadPdf(docId) {
  const { jsPDF } = window.jspdf;
  const pdfDoc = new jsPDF({ orientation: "landscape" }); // ✅ Set to Landscape Mode

  try {
      // 🔹 Fetch saved data from Firestore
      const docRef = doc(db, "pdfLogs", docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
          alert("⚠️ Error: Document not found! It may have been deleted.");
          loadSavedPdfs(); // Refresh logs to remove missing entries
          return;
      }

      const data = docSnap.data();

      // 🔹 Load Logo Images (Ensure these files exist in your project)
      const logoLeft = "logo1.png";
      const logoRight = "trade-3.png";

      // 🔹 Add Logos
      pdfDoc.addImage(logoLeft, "PNG", 10, 10, 40, 20);
      pdfDoc.addImage(logoRight, "PNG", 250, 10, 40, 20); // Adjust for landscape

      // 🔹 Add Header
      pdfDoc.setFontSize(14);
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.text("Star Agro Tech Pvt Ltd®", 148, 20, { align: "center" });
      pdfDoc.setFontSize(12);
      pdfDoc.text("Production Area Eluru, Season Rabi 2023-2024", 148, 28, { align: "center" });

      // 🔹 Arrange Form Data in a 3x3 Grid (Side by Side)
      pdfDoc.setFontSize(10);
      pdfDoc.text(`Organizer: ${data.organizer}`, 20, 40);
      pdfDoc.text(`Village: ${data.village}`, 120, 40);
      pdfDoc.text(`Variety: ${data.variety}`, 220, 40);

      pdfDoc.text(`Area Incharge: ${data.areaIncharge}`, 20, 50);
      pdfDoc.text(`District: ${data.district}`, 120, 50);
      pdfDoc.text(`Mandal: ${data.mandal}`, 220, 50);

      // 🔹 Ensure Table Data is Correctly Mapped
      const tableData = data.tableData.map(row => [
          row.sno || "",         // S.No
          row.farmerName || "",  // Farmer Name
          row.fDate || "",       // F Date
          row.mDate || "",       // M Date
          row.packets || "",     // Packets
          row.stdAcres || "",    // Std Acres
          row.femaleKG || "",    // Female KG
          row.maleKG || "",      // Male KG
          row.phoneNumber || "", // Phone Number
          row.remark || ""       // Remark
      ]);

      // 🔹 Add Table with Correct Column Order
      pdfDoc.autoTable({
          head: [["S.No", "Farmer Name", "F Date", "M Date", "Packets", "Std Acres", "Female KG", "Male KG", "Phone Number", "Remark"]],
          body: tableData,
          startY: 60, // ✅ Adjusted to reduce gap
          theme: "grid",
          styles: { fontSize: 10, cellPadding: 2 },
          headStyles: { fillColor: [0, 128, 0] }, // Green Header
          columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 35 }, 8: { cellWidth: 30 }, 9: { cellWidth: 40 } }, // Adjust Column Widths
      });

      // 🔹 Save PDF
      pdfDoc.save("FarmerDetails_Landscape.pdf");

  } catch (error) {
      console.error("❌ Error downloading PDF: ", error);
  }
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
  const { jsPDF } = window.jspdf;
  const pdfDoc = new jsPDF({ orientation: "landscape" }); // ✅ Set Landscape Mode

  // 🔹 Load Logo Images (Ensure these files exist in your project)
  const logoLeft = "logo1.png";
  const logoRight = "trade-3.png";

  // 🔹 Add Logos
  pdfDoc.addImage(logoLeft, "PNG", 10, 10, 40, 20);
  pdfDoc.addImage(logoRight, "PNG", 250, 10, 40, 20); // Adjust for landscape

  // 🔹 Add Header
  pdfDoc.setFontSize(14);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("Star Agro Tech Pvt Ltd®", 148, 20, { align: "center" });
  pdfDoc.setFontSize(12);
  pdfDoc.text("Production Area Eluru, Season Rabi 2023-2024", 148, 28, { align: "center" });

  // 🔹 Get Form Values (3x3 Layout)
  pdfDoc.setFontSize(10);
  pdfDoc.text(`Organizer: ${document.getElementById("organizer").value}`, 20, 40);
  pdfDoc.text(`Village: ${document.getElementById("village").value}`, 120, 40);
  pdfDoc.text(`Variety: ${document.getElementById("variety").value}`, 220, 40);

  pdfDoc.text(`Area Incharge: ${document.getElementById("areaIncharge").value}`, 20, 50);
  pdfDoc.text(`District: ${document.getElementById("district").value}`, 120, 50);
  pdfDoc.text(`Mandal: ${document.getElementById("mandal").value}`, 220, 50);

  // 🔹 Extract and Add Table Data
  const tableData = extractTableData().map(row => Object.values(row));
  pdfDoc.autoTable({
      head: [["S.No", "Farmer Name", "F Date", "M Date", "Packets", "Std Acres", "Female KG", "Male KG", "Phone Number", "Remark"]],
      body: tableData,
      startY: 60,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [0, 128, 0] },
      columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 35 }, 8: { cellWidth: 30 }, 9: { cellWidth: 40 } }, // Adjust Column Widths
  });

  // 🔹 Print or Save PDF
  pdfDoc.save("FarmerDetails_Landscape_Print.pdf");
}


// Make functions accessible from HTML
window.downloadPdf = downloadPdf;
window.deletePdf = deletePdf;
window.editTable = editTable;
