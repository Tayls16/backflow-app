// === Overhaul Backflow Report Storage System ===
// === version: 2025-07-07 

const form = document.getElementById('backflowForm');
const searchInput = document.getElementById('reportSearchInput'); 

searchInput.style.marginBottom = '1rem';
searchInput.addEventListener('input', showSavedReports);


form.addEventListener('submit', function (event) {
  event.preventDefault();

  const data = {};
  for (let el of form.elements) {
    if (!el.name) continue;
    if (el.type === 'checkbox' || el.type === 'radio') {
      if (el.checked) data[el.name] = el.value;
    } else {
      data[el.name] = el.value;
    }
  }

  const jobId = data.job?.trim();
  if (!jobId) return alert("❗ 'Job' field is required to save this report.");

  let reports = JSON.parse(localStorage.getItem('backflowReports')) || {};
  reports[jobId] = data;
  localStorage.setItem('backflowReports', JSON.stringify(reports));

  alert(`✅ Report for Job ${jobId} saved.`);
  form.reset();
  showSavedReports();
});


function showSavedReports() {
  const reports = JSON.parse(localStorage.getItem('backflowReports')) || {};
  const container = document.getElementById('savedReportsList');
  const searchInput = document.getElementById('reportSearchInput');
  const search = searchInput.value.toLowerCase();
  container.innerHTML = '<h3>Saved Reports:</h3>';

  const jobIds = Object.keys(reports).filter(id => id.toLowerCase().includes(search));
  if (!jobIds.length) {
    container.innerHTML += '<p>No matching reports found.</p>';
    return;
  }

  jobIds.forEach(jobId => {
    const data = reports[jobId];
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '0.5rem';

    const label = document.createElement('strong');
    label.textContent = `Job: ${jobId}`;

    const exportBtn = document.createElement('button');
    exportBtn.textContent = "Export PDF";
    exportBtn.type = 'button';
    exportBtn.onclick = () => exportToPDF(data, jobId);
    exportBtn.style.marginLeft = '1rem';

    const loadBtn = document.createElement('button');
    loadBtn.textContent = "Load Report";
    loadBtn.type = 'button';
    loadBtn.onclick = () => loadReportToForm(data);
    loadBtn.style.marginLeft = '0.5rem';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = "Delete";
    deleteBtn.type = 'button';
    deleteBtn.onclick = () => {
      if (confirm(`Delete report for Job ${jobId}?`)) {
        delete reports[jobId];
        localStorage.setItem('backflowReports', JSON.stringify(reports));
        showSavedReports();
      }
    };
    deleteBtn.style.marginLeft = '0.5rem';

    wrapper.appendChild(label);
    wrapper.appendChild(exportBtn);
    wrapper.appendChild(loadBtn);
    wrapper.appendChild(deleteBtn);
    container.appendChild(wrapper);
  });
}


function loadReportToForm(data) {
  for (let el of form.elements) {
    if (!el.name) continue;
    if (el.type === 'checkbox' || el.type === 'radio') {
      el.checked = data[el.name] === el.value || data[el.name] === 'on';
    } else {
      el.value = data[el.name] || '';
    }
  }
  alert('📝 Report loaded into form for editing.');
}

function clearForm() {
  form.reset();
  alert('🧼 Form reset.');
}

function searchReports() {
  const input = document.getElementById('reportSearchInput');
  const searchValue = input.value.trim().toLowerCase();

  const reports = JSON.parse(localStorage.getItem('backflowReports')) || {};
  const savedReportsList = document.getElementById('savedReportsList');

  savedReportsList.innerHTML = '<h3>Saved Reports:</h3>';

  let foundAny = false;
  for (const jobId in reports) {
    if (jobId.toLowerCase().includes(searchValue)) {
      addReportEntry(jobId, reports[jobId]);
      foundAny = true;
    }
  }

  if (!foundAny) {
    savedReportsList.innerHTML += `<p>No reports found for "<strong>${searchValue}</strong>".</p>`;
  }

  document.getElementById('reportSearchInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    showSavedReports();
  }
});

}


async function exportToPDF(data, jobId) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Add title and logo
  doc.setFontSize(18);
  doc.text("Backflow Prevention Test Report", 15, 20);

  if (typeof logoBase64 !== 'undefined') {
    doc.addImage(logoBase64, 'JPEG', 165, 10, 30, 30);
  }

  // Add Job
  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text(`Job: ${data.job || jobId || 'N/A'}`, 15, 30);


  // Starting Y position
  let y = 40;

  // Side-by-side owner and tester info
  const ownerFields = [
    `Owner: ${data.owner || ''}`,
    `Address: ${data.address || ''}`,
    `Suburb: ${data.suburb || ''}`,
    `Postcode: ${data.postcode || ''}`,
    `Phone: ${data.phone || ''}`
  ];

let testType = '';
if (data.initial_test === 'on') testType = 'Initial Test';
else if (data.annual_test === 'on') testType = 'Annual Test';

const testerFields = [
  `Tester: ${data.tester_name || ''}`,
  `License: ${data.license || ''}`,
  `Test Date: ${data.test_date || ''}`,
  `Test Type: ${testType}`,
  `Permission to turn off water: ${data.permission_received || ''}`
];



// Headings
doc.setFont(undefined, 'bold');
doc.text("Client Info", 15, y);
doc.text("Tester Info", 110, y);
y += 7;
doc.setFont(undefined, 'normal');

// Info rows
for (let i = 0; i < ownerFields.length; i++) {
  doc.text(ownerFields[i], 15, y);
  if (testerFields[i]) doc.text(testerFields[i], 110, y);
  y += 7;
}



// Test Kit block – aligned left + right
doc.setFont(undefined, 'bold');
doc.text("Test Kit", 15, y);
doc.setFont(undefined, 'normal');
y += 7;
doc.text(`Serial No: ${data.gauge_serial || ''}`, 15, y);
doc.text(`Calibration Date: ${data.gauge_calibration || ''}`, 110, y);
y += 10;

  // ==== Device Details Section ====
doc.setFont(undefined, 'bold');
doc.text("Device Details", 15, y);
y += 10;
doc.setFont(undefined, 'normal');

// Column X positions
const col1 = 15;
const col2 = 90;
const col3 = 160;

// Row 1
doc.text(`Protection Type: ${data.protection_type || ''}`, col1, y);
doc.text(`Location: ${data.device_location || ''}`, col2, y);
doc.text(`Device Type: ${data.device_type || ''}`, col3, y);
y += 7;

// Row 2
doc.text(`Make: ${data.make || ''}`, col1, y);
doc.text(`Model: ${data.model || ''}`, col2, y);
doc.text(`Size: ${data.size || ''}`, col3, y);
y += 7;

// Row 3
doc.text(`Main Meter No: ${data.main_meter_no || ''}`, col1, y);
doc.text(`Serial: ${data.serial || ''}`, col2, y);
  
  let strainerText = '';
if (data.strainer_cleaned === 'on' && data.strainer_installed === 'on') {
  strainerText = 'Cleaned & Installed';
} else if (data.strainer_cleaned === 'on') {
  strainerText = 'Cleaned';
} else if (data.strainer_installed === 'on') {
  strainerText = 'Installed';
}

if (strainerText) {
  doc.text(`Strainer: ${strainerText}`, col3, y);
}
y += 7;

 // ==== Test Results Section ====
doc.setFont(undefined, 'bold');
doc.text("Test Results", 15, y);
y += 10;
doc.setFont(undefined, 'normal');

// Column headers
const headers = ["", "Check", "Check", "Downstream", "Relief"];
const subHeaders = ["", "Valve 1", "Valve 2", "Isolation", "Valve"];

const colX = [15, 60, 80, 100, 130];


headers.forEach((text, i) => {
  doc.text(text, colX[i], y);
});
y += 6;
subHeaders.forEach((text, i) => {
  if (text) doc.text(text, colX[i], y);
});
y += 7;


// Row 1: Closed tight
doc.text("Closed Tight", colX[0], y);
doc.text(data.cv1_closed ? "Yes" : "No", colX[1], y);
doc.text(data.cv2_closed ? "Yes" : "No", colX[2], y);
doc.text(data.downstream_closed ? "Yes" : "No", colX[3], y);
doc.text(data.relief_closed ? "Yes" : "No", colX[4], y);
y += 7;

// Row 2: Leaked
doc.text("Leaked", colX[0], y);
doc.text(data.cv1_leaked ? "Yes" : "No", colX[1], y);
doc.text(data.cv2_leaked ? "Yes" : "No", colX[2], y);
doc.text(data.downstream_leaked ? "Yes" : "No", colX[3], y);
doc.text(data.relief_leaked ? "Yes" : "No", colX[4], y);
y += 7;

// Row 3: Pressure (kPa)
doc.text("Pressure (kPa)", colX[0], y);
doc.text(data.cv1_kpa || "", colX[1], y);
doc.text(data.cv2_kpa || "", colX[2], y);
doc.text(data.downstream_kpa || "", colX[3], y);
doc.text(data.relief_kpa || "", colX[4], y);
y += 10;

// === SCDAT Section ===
doc.setFont(undefined, 'bold');
doc.text("Single Check Valve Testable - SCVT / SCDAT", 15, y);
y += 8;
doc.setFont(undefined, 'normal');

// SCDAT & Fire Service Details
doc.text(`Fire Service Meter No: ${data.fire_meter_no || ''}`, 15, y);
y += 7;
doc.text(`Serial No: ${data.fire_serial_no || ''}`, 15, y);
y += 10;

// Define columns
const valveLabels = [
  "Upstream Isolation Valve",
  "Downstream Isolation Valve",
  "Main Check Valve",
  "By Pass Dual Check Valve"
];
  

const valveFields = [
  { label: "Upstream Isolation Valve", closed: "upstream_isolation_valve_closed", leaked: "upstream_isolation_valve_leaked", kpa: "upstream_isolation_valve_kpa" },
  { label: "Downstream Isolation Valve", closed: "downstream_isolation_valve_closed", leaked: "downstream_isolation_valve_leaked", kpa: "downstream_isolation_valve_kpa" },
  { label: "Main Check Valve", closed: "main_check_valve_closed", leaked: "main_check_valve_leaked", kpa: "main_check_valve_kpa" },
  { label: "By Pass Dual Check Valve", closed: "bypass_dual_check_valve_closed", leaked: "bypass_dual_check_valve_leaked", kpa: "bypass_dual_check_valve_kpa" }
];

valveFields.forEach((v) => {
  doc.text(v.label, 15, y);
  doc.text(`Closed Tight: ${data[v.closed] ? "Yes" : "No"}`, 90, y);
  doc.text(`Leaked: ${data[v.leaked] ? "Yes" : "No"}`, 140, y);
  doc.text(`kPa: ${data[v.kpa] || ''}`, 180, y);
  y += 7;
});

doc.text(`SCDAT Pressure Difference: ${data.scdat_pressure || ''} kPa`, 15, y);
y += 7;



// === Comments / Remarks ===
if (data.comments) {
  doc.setFont(undefined, 'bold');
  doc.text("Comments / Remarks", 15, y);
  y += 7;
  doc.setFont(undefined, 'normal');
  doc.text(data.comments, 15, y, { maxWidth: 180 });
  y += 10;
}

// === Compliance & Test Outcome Section ===
doc.setFont(undefined, 'bold');
doc.text("Installation complies with AS/NZS3500.1:", 15, y);
doc.setFont(undefined, 'normal');
doc.text(data.installation_complies === "yes" ? "Yes" : "No", 130, y);
y += 7;

doc.setFont(undefined, 'bold');
doc.text("Device Test Results:", 15, y);
doc.setFont(undefined, 'normal');
doc.text(data.device_test_result === "pass" ? "Pass" : "Fail", 130, y);
y += 7;


// ==== Certification Section ====
if (data.cert_date || data.cert_license || data.cert_signature) {
  y += 5;
  doc.setFont(undefined, 'bold');
  doc.text("Certification", 15, y);
  y += 7;
  doc.setFont(undefined, 'normal');

  const certLeft = 15;
const certRight = 90;

doc.text(`Cert Date: ${data.cert_date || ''}`, certLeft, y);
doc.text("Signature: _______________________", certRight, y);
y += 10;

}
  doc.save(`BackflowReport-${jobId}.pdf`);
}
