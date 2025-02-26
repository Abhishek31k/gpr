// 🔹 Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// 🔹 Firebase Configuration - Replace with your credentials
const firebaseConfig = {
    apiKey: "AIzaSyCwbnY2EVuQpg87WVmS3fEQ749wiREmXjk",
    authDomain: "gpr-data-table.firebaseapp.com",
    projectId: "gpr-data-table",
    storageBucket: "gpr-data-table.firebasestorage.app",
    messagingSenderId: "821418964490",
    appId: "1:821418964490:web:f5776a9668bb06336511f3",
    measurementId: "G-QPVQ3NLQ6S"
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", function () {
    loadData();  // Load saved data from Firestore

    // 🔹 Save Button Event
    document.getElementById("saveData").addEventListener("click", saveData);
    
    // 🔹 Add Row Button Event
    document.getElementById("addRow").addEventListener("click", addNewRow);
});

// 🔹 Function to Save Data to Firestore
async function saveData() {
    const table = document.getElementById("myTable").getElementsByTagName('tbody')[0];
    const rows = table.getElementsByTagName("tr");

    // 🔹 Get input field values
    const organizer = document.getElementById("organizer").value;
    const village = document.getElementById("village").value;
    const variety = document.getElementById("variety").value;
    const areaIncharge = document.getElementById("areaIncharge").value;
    const district = document.getElementById("district").value;
    const mandal = document.getElementById("mandal").value;

    const dataArray = [];

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName("td");
        const rowData = {
            sno: parseInt(cells[0].textContent),
            farmerName: cells[1].querySelector("input").value,
            fDate: cells[2].querySelector("input").value,
            mDate: cells[3].querySelector("input").value,
            packets: cells[4].querySelector("input").value,
            stdAcres: cells[5].querySelector("input").value,
            femaleKG: cells[6].querySelector("input").value,
            maleKG: cells[7].querySelector("input").value,
            phoneNumber: cells[8].querySelector("input").value,
            remark: cells[9].querySelector("input").value
        };
        dataArray.push(rowData);
    }

    try {
        // 🔥 Save to Firestore
        await setDoc(doc(db, "farmerData", "savedTable"), {
            tableData: dataArray,
            organizer,
            village,
            variety,
            areaIncharge,
            district,
            mandal
        });

        alert("✅ Data Saved Successfully!");
    } catch (error) {
        console.error("❌ Error saving data: ", error);
    }
}

// 🔹 Function to Load Data from Firestore
async function loadData() {
    const table = document.getElementById("myTable").getElementsByTagName('tbody')[0];
    table.innerHTML = "";  // Clear table

    try {
        const docRef = doc(db, "farmerData", "savedTable");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const savedData = docSnap.data();

            // 🔹 Load saved form fields
            document.getElementById("organizer").value = savedData.organizer || "";
            document.getElementById("village").value = savedData.village || "";
            document.getElementById("variety").value = savedData.variety || "";
            document.getElementById("areaIncharge").value = savedData.areaIncharge || "";
            document.getElementById("district").value = savedData.district || "";
            document.getElementById("mandal").value = savedData.mandal || "";

            const tableData = savedData.tableData || [];

            // 🔥 Sort by S.No
            tableData.sort((a, b) => a.sno - b.sno);

            tableData.forEach((row) => {
                const newRow = table.insertRow();

                const fieldKeys = [
                    "sno", "farmerName", "fDate", "mDate", "packets", 
                    "stdAcres", "femaleKG", "maleKG", "phoneNumber", "remark"
                ];

                fieldKeys.forEach((key, i) => {
                    const cell = newRow.insertCell(i);
                    if (i === 0) {
                        cell.textContent = row.sno;
                    } else {
                        const input = document.createElement("input");
                        input.type = "text";
                        input.value = row[key] || "";
                        cell.appendChild(input);
                    }
                });
            });
        }
    } catch (error) {
        console.error("❌ Error loading data: ", error);
    }
}

// 🔹 Function to Add New Row
function addNewRow() {
    const table = document.getElementById("myTable").getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();
    const rowCount = table.rows.length;

    for (let i = 0; i < 10; i++) {
        const cell = newRow.insertCell(i);
        if (i === 0) {
            cell.textContent = rowCount;
        } else {
            const input = document.createElement("input");
            input.type = "text";
            cell.appendChild(input);
        }
    }
}

document.getElementById("print").addEventListener("click", function() {
    window.print();
});
