// ==UserScript==
// @name        Combined Productivity Scripts
// @namespace   http://tampermonkey.net/
// @version     1.7
// @description Combines Hygiene Checks, RCAI Expand Findings, RCAI Results Popup, Serenity ID Extractor, SANTOS Checker and Check Mapping with Alt+X toggle panel
// @include     https://paragon-*.amazon.com/hz/view-case?caseId=*
// @include     https://paragon-na.amazon.com/hz/case?caseId=*
// @include     https://paragon-na.amazon.com/ilac/view-ilac-report?*
// @match       https://console.harmony.a2z.com/*
// @match       https://fba-registration-console-na.aka.amazon.com/*
// @match       https://moonraker-na.aka.amazon.com/serenity/open*
// @match       https://fba-fnsku-commingling-console-na.aka.amazon.com/*
// @require     https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @grant       GM_setClipboard
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @updateURL   https://raw.githubusercontent.com/Abhinav-VK/Productivity-Scripts/main/Combined%20Productivity%20Script.user.js
// @downloadURL https://raw.githubusercontent.com/Abhinav-VK/Productivity-Scripts/main/Combined%20Productivity%20Script.user.js

// ==/UserScript==

(function() {
  'use strict';

  /////////////////////////////
  // Feature Toggle System   //
  /////////////////////////////

    const FEATURES = {
        hygieneChecks: { name: "Hygiene Checks", default: true },
        rcaiExpand: { name: "RCAI Expand Findings", default: true },
        rcaiResults: { name: "RCAI Results Popup", default: true },
        serenityExtractor: { name: "Serenity ID Extractor", default: true },
        santosChecker: { name: "SANTOS Checker", default: true },
        filterAllMID: { name: "Check Mapping", default: true }
    };


  function isFeatureEnabled(feature) {
    return GM_getValue(feature, FEATURES[feature].default);
  }

  function setFeatureEnabled(feature, enabled) {
    GM_setValue(feature, enabled);
  }

  function createTogglePanel() {
    // Remove existing panel if it exists
    const existingPanel = document.getElementById('feature-toggle-panel');
    if (existingPanel) {
      existingPanel.remove();
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'feature-toggle-panel';
    panel.innerHTML = `
      <div class="toggle-header">
        <span>🔧 Script Features</span>
      </div>
      <div class="toggle-content">
        ${Object.entries(FEATURES).map(([key, feature]) => `
          <div class="toggle-item">
            <label class="toggle-checkbox">
              <input type="checkbox" id="toggle-${key}" ${isFeatureEnabled(key) ? 'checked' : ''}>
              <span class="checkmark"></span>
              <span class="feature-name">${feature.name}</span>
            </label>
          </div>
        `).join('')}
        <div class="toggle-actions">
          <button id="close-toggle-panel">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    setupToggleListeners();

    // Position panel in center
    panel.style.left = '50%';
    panel.style.top = '50%';
    panel.style.transform = 'translate(-50%, -50%)';
  }

  function setupToggleListeners() {
    // Close button
    document.getElementById('close-toggle-panel').onclick = () => {
      document.getElementById('feature-toggle-panel').remove();
    };

    // Feature toggles
    Object.keys(FEATURES).forEach(feature => {
      const checkbox = document.getElementById(`toggle-${feature}`);
      checkbox.onchange = () => {
        setFeatureEnabled(feature, checkbox.checked);
        // Optionally reload page to apply changes
        if (confirm('Feature updated! Reload page to apply changes?')) {
          location.reload();
        }
      };
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const panel = document.getElementById('feature-toggle-panel');
        if (panel) panel.remove();
      }
    });
  }

  // Global CSS for toggle panel and fixes
  GM_addStyle(`
    #feature-toggle-panel {
      position: fixed;
      background: white;
      border: 2px solid #333;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: Arial, sans-serif;
      min-width: 280px;
      max-width: 400px;
    }

    .toggle-header {
      background: #f0f0f0;
      padding: 12px 16px;
      border-bottom: 1px solid #ddd;
      font-weight: bold;
      font-size: 16px;
      border-radius: 6px 6px 0 0;
    }

    .toggle-content {
      padding: 16px;
    }

    .toggle-item {
      margin-bottom: 12px;
    }

    .toggle-checkbox {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 14px;
      user-select: none;
    }

    .toggle-checkbox input[type="checkbox"] {
      margin-right: 10px;
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .feature-name {
      flex: 1;
    }

    .toggle-actions {
      margin-top: 20px;
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 15px;
    }

    #close-toggle-panel {
      background: #007BFF;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    #close-toggle-panel:hover {
      background: #0056b3;
    }

    /* Fixed Radio inputs styling - only apply to script forms */
    #HygieneCheckForm input[type="radio"],
    #MissingUnitsForm input[type="radio"] {
      position: relative !important;
      box-sizing: border-box !important;
      width: 16px !important;
      height: 16px !important;
      appearance: none !important;
      border: 2px solid #ccc !important;
      border-radius: 4px !important;
      cursor: pointer !important;
      vertical-align: middle !important;
      margin-right: 8px !important;
      background-clip: content-box !important;
    }

    /* When checked, fill the square - only for script forms */
    #HygieneCheckForm input[type="radio"]:checked,
    #MissingUnitsForm input[type="radio"]:checked {
      background-color: #007BFF !important;
      border-color: #007BFF !important;
    }

    /* RCAI Popup Styles */
    #rcai-popup {
      position: fixed;
      top: 10%;
      left: 10%;
      width: 80%;
      height: 250px;
      resize: vertical;
      overflow: hidden;
      background: #f9f9f9;
      border: 2px solid #333;
      z-index: 9999;
      font-family: Consolas, monospace;
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
    }
    .rcai-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ddd;
      padding: 5px 10px;
      cursor: move;
      user-select: none;
    }
    .rcai-controls { display: flex; gap: 8px; }
    .rcai-controls button {
      padding: 4px 10px;
      background: #0078D4;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .rcai-controls button:hover { background: #005A9E; }
    #rcai-scroll { flex: 1; overflow-y: auto; }
    #rcai-table { width: 100%; border-collapse: collapse; }
    #rcai-body tr[data-header="true"] { position: sticky; top: 0; background: #ddd; z-index: 1; }
    #rcai-table td { border: 1px solid #ccc; padding: 0; text-align: center; }
    #rcai-table input {
      width: 100%;
      height: 32px;
      box-sizing: border-box;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4px;
      font-size: 14px;
    }
    .remove-btn { background: #d9534f; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
    .remove-btn:hover { background: #c9302c; }
    #minimize-btn { background: #444; color: #fff; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; }
  `);

  // Global keyboard listener for Alt+X
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 'x') {
      e.preventDefault();
      createTogglePanel();
    }
  });

  ////////////////////////////////
  // 1) Hygiene Checks Script   //
  ////////////////////////////////

  if (isFeatureEnabled('hygieneChecks') &&
      (/paragon-.*\.amazon\.com\/hz\/view-case\?caseId=/.test(location.href) ||
       /paragon-na\.amazon\.com\/hz\/case\?caseId=/.test(location.href))) {

    let reviewButtonGlobal = null;
    let updateButtonGlobal = null;
    const caseIdMatch = location.href.match(/caseId=([^&]+)/);
    const currentCaseId = caseIdMatch ? caseIdMatch[1] : null;

    function getAnnotationMap() {
      const map = localStorage.getItem('hygieneAnnotationMap');
      return map ? JSON.parse(map) : {};
    }

    function setAnnotationForCase(caseId, value) {
      const map = getAnnotationMap();
      map[caseId] = value;
      localStorage.setItem('hygieneAnnotationMap', JSON.stringify(map));
    }

    function isCaseAnnotated(caseId) {
      const map = getAnnotationMap();
      return map[caseId] === true;
    }

    function initializeButtons() {
      document.querySelectorAll('button').forEach(btn => {
        const t = btn.textContent.replace(/\s+/g, '').toLowerCase();
        if (t === 'review') {
          reviewButtonGlobal = btn;
          btn.disabled = true;
        }
        if (t === 'updatecasestatus') {
          updateButtonGlobal = btn;
          btn.disabled = true;
        }
      });
      if (currentCaseId && isCaseAnnotated(currentCaseId)) {
        if (reviewButtonGlobal) reviewButtonGlobal.disabled = false;
        if (updateButtonGlobal) updateButtonGlobal.disabled = false;
      }
    }
    setTimeout(initializeButtons, 2000);

    // Peek shortcut: V+S
    let keysPressed = new Set();
    document.addEventListener('keydown', e => {
      keysPressed.add(e.key.toLowerCase());
      if (keysPressed.has('v') && keysPressed.has('s')) {
        const btn = document.querySelector('#peek-now-button button');
        if (btn) btn.click();
      }
    });
    document.addEventListener('keyup', e => keysPressed.delete(e.key.toLowerCase()));

    // Alt+Y opens Hygiene form; Escape closes forms
    document.addEventListener('keydown', event => {
      const hf = document.getElementById('HygieneCheckForm');
      const mf = document.getElementById('MissingUnitsForm');
      if (event.key === 'Escape') {
        if (hf && hf.style.display === 'block') hf.style.display = 'none';
        if (mf && mf.style.display === 'block') mf.style.display = 'none';
      }
      if (event.altKey && event.key.toLowerCase() === 'y' &&
          !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
        event.preventDefault();
        const link = document.getElementById('HygieneCheckLink');
        if (link) link.click();
      }
    });

    // Inject Easy Access Links (removed the label)
    const sidebar = document.querySelector('#page-sidebar');
    if (sidebar) {
      const container = document.createElement('div');
      Object.assign(container.style, {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '100%', marginTop: '10px', marginBottom: '20px'
      });

      const links = document.createElement('div');
      Object.assign(links.style, {
        display:'flex', gap:'15px', width:'100%'
      });

      const hcLink = document.createElement('a');
      hcLink.href = '#';
      hcLink.id = 'HygieneCheckLink';
      hcLink.textContent = 'Hygiene Checks';
      Object.assign(hcLink.style, {
        fontSize: '14px', color: '#6a5acd',
        textDecoration: 'underline', cursor: 'pointer'
      });
      hcLink.addEventListener('click', e => {
        e.preventDefault();
        HygieneCheckForm.style.display = 'block';
      });

      const muLink = document.createElement('a');
      muLink.href = '#';
      muLink.id = 'MissingUnitsLink';
      muLink.textContent = 'ILAC Missing Units Credit';
      Object.assign(muLink.style, {
        fontSize: '14px', color: '#6a5acd',
        textDecoration: 'underline', cursor: 'pointer',
        display: 'none'
      });
      muLink.addEventListener('click', e => {
        e.preventDefault();
        MissingUnitsForm.style.display = 'block';
      });

      links.appendChild(hcLink);
      links.appendChild(muLink);
      container.appendChild(links);
      sidebar.insertBefore(container, sidebar.firstChild);
    }

    // Hygiene Check Form
    const HygieneCheckForm = document.createElement('div');
    HygieneCheckForm.id = 'HygieneCheckForm';
    Object.assign(HygieneCheckForm.style, {
      display: 'none', position: 'fixed',
      top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      background: 'white', padding: '30px',
      borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      zIndex: '1001', maxHeight: '80vh', overflowY: 'auto',
      width: '800px', maxWidth: '90vw'
    });
    document.body.appendChild(HygieneCheckForm);

    const questions = [
      "Is the POO/POD Docs & RCAI screenshot attached to File Storage SIM-T?",
      "Have you attached all relevant TTs, SIMs & Duplicate Case IDs (if any) to the case?",
      "Have you selected the correct REASON CODE on paragon?",
      "Have you selected \"No Root Cause Summary\" for \"Overages\" asked by the seller?",
      "Have you verified the Shortages discrepancies b/w ILAC & Seller ask?",
      "Have you selected correct Blurb & RC basis your RCAI?",
      "Have you completed the Invoice Analysis?",
      "Proof-read the entire blurb to ensure that all FNSKUs under investigation are addressed in the outbound.",
      "Is there a RMS ticket created below 5K? If yes, have you resolved it?"
    ];

    let formHTML = `<h2 style="text-align:center;color:#333;margin-bottom:15px;">ILAC Investigation Checklist</h2><form id="checklistForm">`;
    questions.forEach((q, i) => {
      formHTML += `
        <div style="margin-bottom:5px;"><b>${i+1})</b> ${q}</div>
        <div style="display:flex;gap:50px;align-items:center;margin-bottom:20px;">
          <label>
            <input type="radio" name="q${i+1}" value="Yes"> Yes
          </label>
          <label>
            <input type="radio" name="q${i+1}" value="No"> No
          </label>
        </div>`;
    });
    formHTML += `
      <div style="text-align:center;margin-top:20px;">
        <button type="button" id="submitChecklist" style="
          background:#007BFF;color:white;padding:12px 24px;
          font-size:16px;border:none;border-radius:5px;cursor:pointer;">
          Annotate
        </button>
      </div>
      <pre id="output" style="
        display:none;margin-top:20px;background:#f8f9fa;padding:10px;
        border-radius:5px;color:black;"></pre>
    </form>`;
    HygieneCheckForm.innerHTML = formHTML;

    // Submit handler
    document.getElementById('submitChecklist').addEventListener('click', () => {
      let output = 'ILAC Investigation Checklist:\n';
      for (let i = 1; i <= questions.length; i++) {
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        if (!sel) return alert('Please answer all questions');
        output += `${i}) ${questions[i-1]} - ${sel.value}\n`;
      }
      navigator.clipboard.writeText(output).then(() => {
        const btn = document.querySelector('kat-button[label="Annotate"]');
        if (btn) {
          btn.click();
          setTimeout(() => {
            let area = document.getElementById('katal-id-17')
                    || document.querySelector('kat-textarea[label="Annotation"] textarea');
            const saveBtn = document.querySelector('kat-button[label="Save annotation"] button');
            if (area && saveBtn) {
              area.value = output;
              area.dispatchEvent(new Event('input', { bubbles: true }));
              saveBtn.click();
              if (reviewButtonGlobal) reviewButtonGlobal.disabled = false;
              if (updateButtonGlobal) updateButtonGlobal.disabled = false;
              if (currentCaseId) setAnnotationForCase(currentCaseId, true);
              HygieneCheckForm.style.display = 'none';
            }
          }, 100);
        } else {
          alert('Annotate button not found!');
        }
      });
    });

    // Missing Units Credit Form
    const MissingUnitsForm = document.createElement('div');
    MissingUnitsForm.id = 'MissingUnitsForm';
    Object.assign(MissingUnitsForm.style, {
      display: 'none', position: 'fixed',
      top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      background: 'white', padding: '30px',
      borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      zIndex: '1001', maxWidth: '400px', width: '100%',
      flexDirection: 'column', alignItems: 'center'
    });
    MissingUnitsForm.innerHTML = `
      <h2 style="text-align:center;margin-bottom:15px;">ILAC Missing Units Credit</h2>
      <input type="text" placeholder="Shipment ID" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:5px;margin-bottom:10px;">
      <div style="display:flex;gap:10px;width:100%;margin-bottom:10px;">
        <input type="text" placeholder="FNSKU" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:5px;">
        <input type="text" placeholder="Qty" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:5px;">
      </div>
      <input type="text" placeholder="RMS ID" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:5px;margin-bottom:10px;">
      <button style="
        background:#007BFF;color:white;padding:10px 20px;
        border:none;border-radius:5px;cursor:pointer;">
        Submit
      </button>`;
    document.body.appendChild(MissingUnitsForm);

    document.addEventListener('click', e => {
      if (HygieneCheckForm.style.display === 'block' &&
          !HygieneCheckForm.contains(e.target) &&
          e.target.id !== 'HygieneCheckLink') {
        HygieneCheckForm.style.display = 'none';
      }
      if (MissingUnitsForm.style.display === 'block' &&
          !MissingUnitsForm.contains(e.target) &&
          e.target.id !== 'MissingUnitsLink') {
        MissingUnitsForm.style.display = 'none';
      }
    });
  }

  /////////////////////////////////
  // 2) RCAI Expand Findings     //
  /////////////////////////////////

  if (isFeatureEnabled('rcaiExpand') && /console\.harmony\.a2z\.com/.test(location.href)) {
    const RCAI_TEXT = 'mfi root cause analysis and investigation';
    const DETAILS_TEXT = 'details of the findings';
    const SHOW_DETAILS_TEXT = 'show details';
    function norm(txt) { return txt.trim().toLowerCase().replace(/\s+/g,' '); }
    function hasRCAI() { return norm(document.body.innerText).includes(RCAI_TEXT); }
    function hasDetailsFindings() {
      return norm(document.body.innerText).includes(DETAILS_TEXT);
    }
    function hasShow() {
      return Array.from(document.querySelectorAll('button,a')).some(el =>
        el.offsetParent && norm(el.textContent).includes(SHOW_DETAILS_TEXT)
      );
    }
    function findDetailsOfFindingsButtons() {
      const buttons = [];
      const allElements = Array.from(document.querySelectorAll('*'));
      allElements.forEach(el => {
        if (norm(el.textContent).includes(DETAILS_TEXT)) {
          // Look for "Show Details" button near this "Details of the Findings" text
          const parent = el.closest('div') || el.parentElement;
          if (parent) {
            const showDetailsBtn = parent.querySelector('button, a');
            if (showDetailsBtn && norm(showDetailsBtn.textContent).includes(SHOW_DETAILS_TEXT)) {
              buttons.push(showDetailsBtn);
            }
          }
        }
      });
      return buttons;
    }
    function addExpandBtn() {
      if (document.getElementById('rcai-expand-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'rcai-expand-btn';
      btn.textContent = 'Expand Findings';
      Object.assign(btn.style, {
        position:'fixed', bottom:'20px', right:'20px',
        zIndex:'9999', padding:'12px 16px',
        background:'#000', color:'#fff', border:'none',
        borderRadius:'6px', cursor:'pointer',
        fontSize:'14px', fontWeight:'bold',
        boxShadow:'0 2px 6px rgba(0,0,0,0.2)'
      });
      btn.onclick = () => {
        btn.textContent = 'Expanding Findings...';
        const detailsButtons = findDetailsOfFindingsButtons();
        if (detailsButtons.length === 0) {
          btn.textContent = 'No Details Found';
          btn.style.color = 'orange';
          setTimeout(() => {
            btn.textContent = 'Expand Findings';
            btn.style.color = '#fff';
          }, 2000);
          return;
        }
        detailsButtons.forEach((el, i) => {
          setTimeout(() => el.click(), i * 300);
        });
        setTimeout(() => {
          btn.textContent = 'Completed';
          btn.style.color = 'limegreen';
        }, detailsButtons.length * 300 + 500);
        setTimeout(() => {
          btn.textContent = 'Expand Findings';
          btn.style.color = '#fff';
        }, detailsButtons.length * 300 + 2500);
      };
      document.body.appendChild(btn);
    }
    const obs = new MutationObserver(() => {
      if (hasRCAI() && (hasDetailsFindings() || hasShow())) addExpandBtn();
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { if (hasRCAI() && (hasDetailsFindings() || hasShow())) addExpandBtn(); }, 3000);
  }
  /////////////////////////////////
  // 3) RCAI Results Popup       //
  /////////////////////////////////

  if (isFeatureEnabled('rcaiResults') && /console\.harmony\.a2z\.com/.test(location.href)) {

    let popupVisible = false, removedStack = [], restoring = false;

    // Check if RCAI content is present (same logic as Expand Findings)
    const RCAI_TEXT = 'mfi root cause analysis and investigation';
    const SHOW_DETAILS_TEXT = 'show details';
    function norm(txt) { return txt.trim().toLowerCase().replace(/\s+/g,' '); }
    function hasRCAI() { return norm(document.body.innerText).includes(RCAI_TEXT); }
    function hasShow() {
      return Array.from(document.querySelectorAll('button,a')).some(el =>
        el.offsetParent && norm(el.textContent).includes(SHOW_DETAILS_TEXT)
      );
    }

    // Add RCAI Results button only when RCAI content is present
    function addRcaiResultsBtn() {
      if (!(hasRCAI() && hasShow())) return; // CHANGED: require both RCAI and Show Details
      if (document.getElementById('rcai-results-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'rcai-results-btn';
      btn.textContent = 'RCAI Results';
      Object.assign(btn.style, {
        position:'fixed', bottom:'20px', left:'20px',
        zIndex:'9999', padding:'12px 16px',
        background:'#000', color:'#fff', border:'none',
        borderRadius:'6px', cursor:'pointer',
        fontSize:'14px', fontWeight:'bold',
        boxShadow:'0 2px 6px rgba(0,0,0,0.2)'
      });
      btn.onclick = createPopup;
      document.body.appendChild(btn);
    }

    // Add button with proper RCAI detection
    const buttonObs = new MutationObserver(() => {
      if (hasRCAI() && hasShow()) addRcaiResultsBtn(); // CHANGED: require both RCAI and Show Details
    });
    buttonObs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { if (hasRCAI() && hasShow()) addRcaiResultsBtn(); }, 3000); // CHANGED: require both

    function storageKey() { return 'rcai:' + location.href; }
    function savePopupState() {
      const rows = Array.from(document.querySelectorAll('#rcai-body tr:not([data-header])'));
      const data = rows.map(r =>
        Array.from(r.querySelectorAll('td')).slice(1,11).map(td => td.querySelector('input')?.value||'')
      );
      localStorage.setItem(storageKey(), JSON.stringify(data));
    }
    function restorePopupState() {
      const s = localStorage.getItem(storageKey());
      if (!s) return false;
      try {
        const arr = JSON.parse(s);
        if (!Array.isArray(arr) || !arr.length) return false;
        arr.forEach(r => addRow(r));
        updateRowNumbers();
        return true;
      } catch { return false; }
    }
    function updateRowNumbers() {
      let c = 0;
      document.querySelectorAll('#rcai-body tr:not([data-header])').forEach(r => {
        r.querySelector('td:first-child input').value = ++c;
      });
    }
    function handleTab(e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const inputs = Array.from(document.querySelectorAll('#rcai-body tr:not([data-header]) input'));
        const idx = inputs.indexOf(e.target);
        const next = inputs[e.shiftKey ? idx-1 : idx+1];
        if (next) next.focus();
      }
    }
    function removeRow(tr) {
      const all = Array.from(document.querySelectorAll('#rcai-body tr:not([data-header])'));
      removedStack.push({
        data: Array.from(tr.querySelectorAll('td')).slice(1,11).map(td => td.querySelector('input')?.value||''),
        position: all.indexOf(tr)
      });
      document.getElementById('undo-btn').disabled = false;
      tr.remove();
      updateRowNumbers();
      adjustPopupHeight();
    }
    function undoRemove() {
      if (!removedStack.length) return;
      const { data, position } = removedStack.pop();
      addRow(data, position);
      if (!removedStack.length) document.getElementById('undo-btn').disabled = true;
    }
    function addHeaderRow() {
      const hdr = ["#","FNSKU","DECISION","RC SUMMARY","DISC","FAULT","FOUND","DENY","RMS","BLURB","NOTES"];
      const tr = document.createElement('tr'); tr.dataset.header = 'true';
      hdr.forEach(h => {
        const td = document.createElement('td');
        const inp = document.createElement('input');
        inp.value = h; inp.readOnly = true; td.appendChild(inp); tr.appendChild(td);
      });
      document.getElementById('rcai-body').appendChild(tr);
    }
    function createRowElement(data=[]) {
      const tr = document.createElement('tr');
      // Number
      const numTd = document.createElement('td');
      const numIn = document.createElement('input');
      numIn.readOnly = true; numTd.appendChild(numIn); tr.appendChild(numTd);
      // Cells 1–9
      for (let i=0; i<9; i++) {
        const td = document.createElement('td');
        const inp = document.createElement('input');
        inp.value = data[i] || '';
        inp.onkeydown = handleTab;
        inp.oninput =() => { if (!restoring) savePopupState(); };
        td.appendChild(inp); tr.appendChild(td);
      }
      // Notes
      const notesTd = document.createElement('td');
      const notesIn = document.createElement('input');
      notesIn.maxLength = 20; notesIn.value = data[9] || '';
      notesIn.onkeydown = handleTab;
      notesIn.oninput = () => { if (!restoring) savePopupState(); };
      notesTd.appendChild(notesIn); tr.appendChild(notesTd);
      // Remove btn
      const rmTd = document.createElement('td');
      const rmBtn = document.createElement('button');
      rmBtn.textContent = 'Remove'; rmBtn.className = 'remove-btn';
      rmBtn.onclick = () => { removeRow(tr); savePopupState(); };
      rmTd.appendChild(rmBtn); tr.appendChild(rmTd);
      return tr;
    }
    function addRow(data=[], position=null) {
      const body = document.getElementById('rcai-body');
      const row = createRowElement(data);
      if (typeof position === 'number') {
        const ref = body.children[position+1] || null;
        body.insertBefore(row, ref);
      } else {
        body.appendChild(row);
      }
      updateRowNumbers(); adjustPopupHeight();
    }
    function toggleMinimize() {
      const pop = document.getElementById('rcai-popup');
      const scr = document.getElementById('rcai-scroll');
      const btn = document.getElementById('minimize-btn');
      const header = document.querySelector('.rcai-header');
      const hidden = scr.style.display === 'none';
      if (hidden) {
        scr.style.display = 'block';
        pop.style.height = pop.dataset.expandedHeight || '';
        pop.style.resize = 'vertical';
        btn.textContent = '_';
      } else {
        pop.dataset.expandedHeight = pop.offsetHeight + 'px';
        scr.style.display = 'none';
        pop.style.height = header.offsetHeight + 'px';
        pop.style.resize = 'none';
        btn.textContent = '▢';
      }
    }
    function copyData() {
      const widths = [4,12,12,18,6,10,8,8,8,34,20];
      let out = 'RCAI RESULTS:\n';
      const hdr = ['#','FNSKU','DECISION','RC SUMMARY','DISC','FAULT','FOUND','DENY','RMS','BLURB','NOTES'];
      out += '|' + hdr.map((h,i) => h.padEnd(widths[i])).join('|') + '\n';
      let tF=0, tD=0, tR=0;
      document.querySelectorAll('#rcai-body tr:not([data-header])').forEach(r => {
        const cells = Array.from(r.querySelectorAll('td')).slice(0,11);
        const vals = cells.map((cell,i) => {
          let v = cell.querySelector('input')?.value || '-';
          if (i === 3) {
            const seg = v.split(/[\/,]|\s{2,}/).map(s=>s.trim()).filter(Boolean);
            if (seg.length > 1) {
              const dflt = seg.map(s=>s.split(' ')[0]).join(', ');
              const exc = seg.map(s => {
                if (s==='Item Substitution') return 'Item Sub';
                if (s==='Item Label Defect') return 'Item Label';
                if (s==='Seller Short Ship') return 'Short Ship';
                return s.split(' ')[0];
              }).join(', ');
              if (dflt.length < widths[i]) v = dflt;
              else if (exc.length < widths[i]) v = exc;
              else v = dflt.slice(0,widths[i]-1);
            } else if (v.length >= widths[i]) {
              v = v.slice(0,widths[i]-1);
            }
          }
          if (i === 6) tF += parseFloat(v) || 0;
          if (i === 7) tD += parseFloat(v) || 0;
          if (i === 8) tR += parseFloat(v) || 0;
          return v.slice(0,widths[i]-1).padEnd(widths[i]);
        });
        out += '|' + vals.join('|') + '\n';
      });
      const total = widths.map((w,i) => {
        if (i === 5) return 'TOTALS →'.padEnd(w);
        if (i === 6) return tF.toString().padEnd(w);
        if (i === 7) return tD.toString().padEnd(w);
        if (i === 8) return tR.toString().padEnd(w);
        return ''.padEnd(w);
      });
      out += '|' + total.join('|') + '\n';
      navigator.clipboard.writeText(out);
    }
    function autofillFromPage(append=false) {
      const elems = Array.from(document.querySelectorAll('body *'));
      const codeRx = /^[A-Z0-9]{10}$/;
      const decRx = /^(DECLINE|APPROVE|PENDING|PARTIAL_DECLINE|MANUAL)$/i;
      const coll = [];
      elems.forEach((el,i) => {
        const txt = (el.textContent||'').trim();
        if (!decRx.test(txt)) return;
        const decision = txt.toUpperCase().replace('PARTIAL_DECLINE','PARTIAL');
        const codes = [];
        const disc = elems[i-2]?.textContent?.trim()||'';
        for (let j=i-1; j>=Math.max(0,i-15); j--) {
          const t = elems[j].textContent?.trim()||'';
          if (codeRx.test(t)) codes.push(t);
        }
        const next = elems[i+1]?.textContent?.trim()||'';
        const rcSummary = next.split(',').map(it=>it.replace(/\/\d+/g,'').trim()||it.split(' ')[0]).join(', ');
        let fault = 'NONE';
        for (let k=i+1; k<Math.min(elems.length,i+20); k++) {
          const s = (elems[k].textContent||'').toLowerCase();
          if (s.includes('summary of the findings')) {
            const hasS = s.includes('no shortage was caused by seller fault');
            const hasA = s.includes('no shortage was caused by amazon fault');
            if (!hasS && hasA) fault = 'Seller';
            else if (!hasA && hasS) fault = 'Amazon';
            else if (!hasS && !hasA) fault = 'BOTH';
            break;
          }
        }
        if (codes.length >= 2) {
          coll.push([codes[1], decision, rcSummary, disc, fault, '', '', '', '', '']);
        }
      });
      if (!append) {
        document.querySelectorAll('#rcai-body tr:not([data-header])').forEach(r => r.remove());
      }
      coll.forEach(r => addRow(r));
      updateRowNumbers();
      adjustPopupHeight();
    }
    function createPopup() {
      if (popupVisible) return;
      popupVisible = true;
      const popup = document.createElement('div');
      popup.id = 'rcai-popup';
      popup.innerHTML = `
        <div class="rcai-header" id="rcai-drag">
          <span>RCAI RESULTS:</span>
          <div class="rcai-controls">
            <button id="add-row">Add Row</button>
            <button id="rescan-btn">Rescan</button>
            <button id="undo-btn" disabled>Undo</button>
            <button id="copy-only">Copy</button>
            <button id="copy-close">Copy & Close</button>
            <button id="minimize-btn">_</button>
          </div>
        </div>
        <div id="rcai-scroll">
          <table id="rcai-table"><tbody id="rcai-body"></tbody></table>
        </div>`;
      document.body.appendChild(popup);
      document.getElementById('add-row').onclick = () => { addRow(); savePopupState(); };
      document.getElementById('rescan-btn').onclick = () => { autofillFromPage(true); savePopupState(); };
      document.getElementById('undo-btn').onclick = () => { undoRemove(); savePopupState(); };
      document.getElementById('copy-only').onclick = copyData;
      document.getElementById('copy-close').onclick = () => { copyData(); popup.remove(); popupVisible = false; };
      document.getElementById('minimize-btn').onclick = toggleMinimize;
      dragElement(popup);
      addHeaderRow();
      restoring = true;
      const ok = restorePopupState();
      restoring = false;
      if (!ok) autofillFromPage(false);
      if (!document.querySelector('#rcai-body tr:not([data-header])')) addRow();
      adjustPopupHeight();
    }

    // Helper functions for popup functionality
    function dragElement(el) {
      const handle = document.getElementById('rcai-drag');
      let sx, sy, ox, oy;
      handle.onmousedown = e => {
        e.preventDefault();
        sx = e.clientX; sy = e.clientY;
        ox = el.offsetLeft; oy = el.offsetTop;
        document.onmousemove = onDrag;
        document.onmouseup = stopDrag;
      };
      function onDrag(e) {
        e.preventDefault();
        const dx = e.clientX - sx, dy = e.clientY - sy;
        const nx = Math.max(0, Math.min(ox + dx, window.innerWidth- el.offsetWidth));
        const ny = Math.max(0, Math.min(oy + dy, window.innerHeigh- el.offsetHeight));
        el.style.left = nx + 'px';
        el.style.top = ny + 'px';
      }
      function stopDrag() {
        document.onmousemove = null;
        document.onmouseup = null;
      }
    }

    function adjustPopupHeight() {
      const popup = document.getElementById('rcai-popup');
      if (!popup) return;
      const header = document.querySelector('.rcai-header');
      const scrollA = document.getElementById('rcai-scroll');
      if (!header || !scrollA) return;
      const contentH = header.offsetHeight + scrollA.scrollHeight;
      popup.style.maxHeight = contentH + 'px';
      if (popup.offsetHeight > contentH) {
        popup.style.height = contentH + 'px';
      }
    }

    // Keyboard shortcut Alt+R to open popup (only when RCAI content is present)
    document.addEventListener('keydown', e => {
      if (e.altKey && e.key.toLowerCase() === 'r' && hasRCAI()) createPopup();
    });
  }

  //////////////////////////////////
  // 4) Serenity ID Extractor     //
  //////////////////////////////////

  if (isFeatureEnabled('serenityExtractor') &&
      /moonraker-na\.aka\.amazon\.com\/serenity\/open/.test(location.href)) {

    function toYMD(str) {
      const p = str.split('/');
      if (p.length !== 3) return null;
      const [mm, dd, yyyy] = p;
      return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
    }

    function addDays(dateStr, days) {
      const date = new Date(dateStr + 'T00:00:00');
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    }

    function extractFromCurrentPage(startDate, endDate) {
      const rows = document.querySelectorAll('table tr');
      const map = new Map();

      rows.forEach(r => {
        const cells = r.querySelectorAll('td');
        let uid = null;

        // Find Serenity ID (long alphanumeric string)
        cells.forEach(c => {
          const m = c.textContent.trim().match(/\b[A-Za-z0-9]{55,}\b/);
          if (m) uid = m[0];
        });

        if (!uid) return;

        // Find date in row
        const dm = r.textContent.match(/\b(\d{4}-\d{2}-\d{2})\b/);
        if (!dm) return;

        const ds = dm[1];

        // Check if date is within range (inclusive)
        if (ds < startDate || ds > endDate) return;

        // Find quantity
        let qty = 0;
        cells.forEach(c => {
          const m = c.textContent.trim().match(/^\d+$/);
          if (m) qty = parseInt(m[0], 10);
        });

        // Add to map (sum quantities for duplicate IDs)
        map.set(uid, (map.get(uid) || 0) + qty);
      });

      return map;
    }

    function waitForPageLoad() {
      return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 10 seconds max wait

        const checkInterval = setInterval(() => {
          attempts++;

          // Check if page has loaded by looking for table content
          const hasContent = document.querySelectorAll('table tr').length > 1;

          if (hasContent || attempts >= maxAttempts) {
            clearInterval(checkInterval);
            // Additional small delay to ensure content is fully rendered
            setTimeout(resolve, 200);
          }
        }, 200);
      });
    }

    async function extractSerenityIDs() {
      const inp = prompt('Enter First Receive Date or Delivery Date');
      if (!inp) return;

      const startDate = toYMD(inp.trim());
      if (!startDate) return alert('Invalid date format. Use MM/DD/YYYY');

      const endDate = addDays(startDate, 46);
      const allResults = new Map();
      let pageCount = 1;
      const maxPages = 50; // Safety limit

      // Update button text to show processing
      btn.textContent = `Processing Page ${pageCount}...`;
      btn.disabled = true;

      while (pageCount <= maxPages) {
        // Process current page
        const pageResults = extractFromCurrentPage(startDate, endDate);

        // Merge results
        pageResults.forEach((qty, uid) => {
          allResults.set(uid, (allResults.get(uid) || 0) + qty);
        });

        // Look for "Get next batch" button with more specific detection
        const nextBatchBtn = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"], span'))
          .find(el => {
            const text = (el.textContent || el.value || '').toLowerCase().trim();
            return text.includes('get next batch') ||
                   text.includes('next batch') ||
                   text.includes('get next') ||
                   (text.includes('next') && text.includes('batch'));
          });

        // More robust check for button availability
        if (!nextBatchBtn ||
            nextBatchBtn.disabled ||
            nextBatchBtn.style.display === 'none' ||
            nextBatchBtn.offsetParent === null ||
            window.getComputedStyle(nextBatchBtn).display === 'none') {
          console.log('No more pages - next batch button not found or disabled');
          break; // No more pages
        }

        console.log(`Found next batch button on page ${pageCount}, clicking...`);

        // Click next batch and wait for page to load
        pageCount++;
        btn.textContent = `Processing Page ${pageCount}...`;
        nextBatchBtn.click();

        // Wait for new content to load
        await waitForPageLoad();
      }

      if (pageCount > maxPages) {
        console.log('Stopped at safety limit of', maxPages, 'pages');
      }

      // Reset button
      btn.textContent = 'Extract Serenity IDs';
      btn.disabled = false;

      if (!allResults.size) {
        return alert(`No Serenity IDs found between ${startDate} and ${endDate} (45 days across ${pageCount} pages)`);
      }

      const ids = Array.from(allResults.keys()).join(',');
      const total = Array.from(allResults.values()).reduce((a, b) => a + b, 0);

      GM_setClipboard(ids);
      alert(`Copied ${allResults.size} Serenity ID(s) from ${startDate} to ${endDate} across ${pageCount} pages. Total Quantity: ${total}`);
    }

    const btn = document.createElement('button');
    btn.textContent = 'Extract Serenity IDs';
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '9999',
      padding: '10px 14px',
      fontSize: '14px',
      background: '#000',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
    });
    btn.addEventListener('click', extractSerenityIDs);
    document.body.appendChild(btn);
  }




/////////////////////////////////
// 5) SANTOS Checker - Fixed    //
/////////////////////////////////

if (isFeatureEnabled('santosChecker') &&
    /paragon-na\.amazon\.com\/ilac\/view-ilac-report\?/.test(location.href)) {

    function createSubtleNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 14px;
            font-family: Arial, sans-serif;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.style.opacity = '1', 10);
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    async function extractMIDFromCopyButton() {
        // Find the Copy MID button
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const copyMIDBtn = buttons.find(btn =>
                                        btn.textContent && btn.textContent.trim() === 'Copy MID'
                                       );

        if (!copyMIDBtn) {
            console.log('Copy MID button not found');
            return null;
        }

        // Find MID in the page near the Copy MID button
        const parentElement = copyMIDBtn.closest('tr') || copyMIDBtn.parentElement;
        if (parentElement) {
            const text = parentElement.textContent;
            // Look for MID pattern in text
            const midMatch = text.match(/\((\d{7,15})\)/);
            if (midMatch && midMatch[1]) {
                return midMatch[1];
            }

            // Alternative: look for text before "Copy MID" button
            const buttonText = copyMIDBtn.previousSibling?.textContent?.trim();
            if (buttonText && /^\d{7,15}$/.test(buttonText)) {
                return buttonText;
            }
        }

        // If still not found, try finding MID in the page
        const pageText = document.body.innerText;
        const merchantPattern = /(?:Merchant[^\n]*?|Customer[^\n]*?ID:)\s*([A-Z0-9]+)\s*\(\s*(\d{7,15})\s*\)/i;
        const merchantMatch = pageText.match(merchantPattern);
        if (merchantMatch && merchantMatch[2]) {
            return merchantMatch[2];
        }

        return null;
    }


    async function checkForSANTOS() {
        console.log('SANTOS check started');

        try {
            const mid = await extractMIDFromCopyButton();

            if (!mid) {
                createSubtleNotification('Could not extract MID from Copy button', 'error');
                return;
            }

            console.log('Found MID:', mid);
            localStorage.setItem('santosCheckerMID', mid);
            createSubtleNotification('Found MID: ' + mid + '. Opening SANTOS checker...', 'success');

            const santosURL = `https://fba-registration-console-na.aka.amazon.com/merchants/${mid}`;
            window.open(santosURL, '_blank');
        } catch (error) {
            console.error('Error during SANTOS check:', error);
            createSubtleNotification('Error extracting MID', 'error');
        }
    }

    function addSANTOSButton() {
        if (document.getElementById('santos-check-btn')) {
            return;
        }

        const buttons = document.querySelectorAll('button, input[type="button"], a');
        let copyMIDButton = null;

        for (let btn of buttons) {
            if (btn.textContent && btn.textContent.trim() === 'Copy MID') {
                copyMIDButton = btn;
                break;
            }
        }

        if (!copyMIDButton) {
            return;
        }

        const santosBtn = document.createElement('button');
        santosBtn.id = 'santos-check-btn';
        santosBtn.textContent = 'Check for SANTOS';

        santosBtn.style.cssText = copyMIDButton.style.cssText;
        santosBtn.className = copyMIDButton.className;
        santosBtn.style.marginLeft = '10px';

        santosBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            checkForSANTOS();
        });

        if (copyMIDButton.nextSibling) {
            copyMIDButton.parentNode.insertBefore(santosBtn, copyMIDButton.nextSibling);
        } else {
            copyMIDButton.parentNode.appendChild(santosBtn);
        }

        console.log('SANTOS button added');
    }

    setTimeout(addSANTOSButton, 1000);
    setTimeout(addSANTOSButton, 3000);

    const observer = new MutationObserver(addSANTOSButton);
    observer.observe(document.body, { childList: true, subtree: true });
}

// SANTOS PAGE SCRIPT - CLEAN VERSION
if (location.href.includes('fba-registration-console-na.aka.amazon.com')) {
    console.log('SANTOS page script loaded');

    // Subtle notification function for SANTOS page
    function createSantosNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 14px;
            font-family: Arial, sans-serif;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.style.opacity = '1', 10);
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setTimeout(() => {
        const pageText = document.body.innerText.toUpperCase();
        const hasSANTOS = pageText.includes('SANTOS');

        if (hasSANTOS) {
            createSantosNotification('SANTOS found and highlighted!', 'success');

            // Highlight all table cells containing SANTOS
            document.querySelectorAll('td').forEach(cell => {
                if (cell.textContent.toUpperCase().includes('SANTOS')) {
                    cell.style.backgroundColor = '#FFFF00';
                    cell.style.border = '5px solid #FF0000';
                    cell.style.fontWeight = 'bold';
                    cell.style.fontSize = '18px';
                }
            });

        } else {
            createSantosNotification('No SANTOS found - closing in 3 seconds', 'error');
            setTimeout(() => window.close(), 3000);
        }

    }, 2000);
}





/////////////////////////////////
// 6) Check Mapping    //
/////////////////////////////////

if (isFeatureEnabled('filterAllMID') && location.href.startsWith('https://fba-fnsku-commingling-console-na.aka.amazon.com/')) {
    console.log('FNSKU MID Search: Initializing floating button...');

    let isSearching = false;
    let searchResults = [];

    // Create floating button
    function createFloatingButton() {
        // Check if button already exists
        if (document.getElementById('fnsku-mid-search-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'fnsku-mid-search-btn';
        btn.textContent = 'MID Search';

        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: '9999',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            background: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
        });

        btn.addEventListener('click', showMidSearchPanel);
        document.body.appendChild(btn);

        console.log('FNSKU MID Search: Floating button created');
    }

    // Create search panel
    function showMidSearchPanel() {
        // Remove existing panel if present
        const existing = document.getElementById('mid-search-panel');
        if (existing) {
            existing.remove();
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'mid-search-panel';

        panel.innerHTML = `
            <div class="mid-panel-header">
                <span>🔍 MID Search Tool</span>
                <button id="close-mid-panel" style="background: none; border: none; color: #666; font-size: 18px; cursor: pointer; padding: 0; margin: 0;">&times;</button>
            </div>
            <div class="mid-panel-content">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Enter MID to Search:</label>
                    <input type="text" id="mid-search-input" placeholder="Paste MID here..."
                           style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 4px; font-size: 14px; outline: none;" />
                </div>
                <div style="margin-bottom: 15px;">
                    <button id="start-mid-search" style="widwidth: 100%; padding: 10px; background: #007BFF; color: white; border: none; border-radius: 4px; font-size: 14px; font-weight: bold; cursor: pointer;">
                        🔍 Search All Pages
                    </button>
                </div>
                <div id="search-status" style="font-size: 12px; color: #666; text-align: center; min-height: 20px;"></div>
                <div id="search-results" s" style="margin-top: 10px; font-size: 12px; max-height: 150px; overflow-y: auto;"></div>
            </div>
        `;

        // Panel styling
        Object.assign(panel.style, {
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '320px',
            background: 'white',
            border: '2px solid #333',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: '1001',
            fontFamily: 'Arial, sans-serif',
            animation: 'slideUp 0.3s ease-out'
        });

        document.body.appendChild(panel);

        // Add animation CSS if not already present
        if (!document.getElementById('mid-search-animations')) {
            const style = document.createElement('style');
            style.id = 'mid-search-animations';
            style.textContent = `
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .mid-panel-header {
                    background: #f0f0f0;
                    padding: 12px 16px;
                    border-bottom: 1px solid #ddd;
                    font-weight: bold;
                    font-size: 16px;
                    border-radius: 6px 6px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .mid-panel-content {
                    padding: 16px;
                }
                #mid-search-input:focus {
                    border-color: #007BFF !important;
                    box-shadow: 0 0 0 3px rgba(0,123,255,0.25) !important;
                }
                #start-mid-search:hover:not(:disabled) {
                    background: #0056b3 !important;
                }
                #start-mid-search:disabled {
                    background: #6c757d !important;
                    cursor: not-allowed !important;
                }
            `;
            document.head.appendChild(style);
        }

        // Event listeners
        document.getElementById('close-mid-panel').onclick = () => panel.remove();
        document.getElementById('start-mid-search').onclick = startMidSearch;

        // Focus input
        document.getElementById('mid-search-input').focus();

        // Enter key to start search
        document.getElementById('mid-search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !isSearching) {
                startMidSearch();
            }
        });
    }

    async function startMidSearch() {
        if (isSearching) return;

        const input = document.getElementById('mid-search-input');
        const button = document.getElementById('start-mid-search');
        const status = document.getElementById('search-status');
        const results = document.getElementById('search-results');

        const searchMID = input.value.trim();
        if (!searchMID) {
            showStatus('Please enter a MID to search!', 'error');
            return;
        }

        console.log('FNSKU MID Search: Starting search for:', searchMID);

        // Start search
        isSearching = true;
        button.disabled = true;
        button.textContent = '🔄 Searching...';
        results.innerHTML = '';
        searchResults = [];

        // Clear any previous highlights
        clearAllHighlights();

        try {
            let pageCount = 0;
            const maxPages = 200;
            const searchMIDLower = searchMID.toLowerCase();

            showStatus('🔍 Searching all pages...', 'info');

            while (pageCount < maxPages) {
                pageCount++;
                //showStatus(`🔍 Searching page ${pageCount}...`, 'info');
                button.textContent = `🔄 Page ${pageCount}`;

                // Search current page
                const pageResults = searchCurrentPage(searchMIDLower, pageCount);

                if (pageResults.length > 0) {
                    searchResults.push(...pageResults);

                    // Highlight all matching rows on this page
                    pageResults.forEach(result => {
                        highlightRow(result.element, result.mid);
                    });

                    // Display running results
                    displayResults();

                    addResultLine(`Page ${pageCount}: Found ${pageResults.length} matches`);
                } else {
                    addResultLine(`Page ${pageCount}: No matches`);
                }

                // Look for next button
                const nextBtn = findNextButton();
                if (!nextBtn) {
                    console.log('FNSKU MID Search: No more pages available');
                    break;
                }

                // Click next and wait
                nextBtn.click();
                await waitForPageLoad(5000);
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            // Final results
            if (searchResults.length > 0) {
                showStatus(`✅ Found ${searchResults.length} matches across ${pageCount} pages!`, 'success');
                displayResults(true);
            } else {
                showStatus(`❌ No matches found for "${searchMID}" across ${pageCount} pages.`, 'error');
                addResultLine('No matches found on any page.');
            }

            if (pageCount >= maxPages) {
                showStatus(`⚠️ Search stopped at ${maxPages} page limit.`, 'warning');
            }

        } catch (error) {
            console.error('FNSKU MID Search: Error during search:', error);
            showStatus('❌ Error occurred during search. Check console for details.', 'error');
        } finally {
            // Reset button
            isSearching = false;
            button.disabled = false;
            button.textContent = '🔍 Search All Pages';
        }
    }

    function searchCurrentPage(searchMIDLower, pageNumber) {
        const results = [];
        const tables = document.querySelectorAll('table');

        tables.forEach(table => {
            const rows = table.querySelectorAll('tr');
            rows.forEach((row, rowIndex) => {
                // Skip header rows
                if (rowIndex === 0) return;

                const cells = row.querySelectorAll('td');

                // Extract FNSKU and ASIN from the row
                const fnsku = cells[2]?.textContent?.trim() || '';
                const asin = cells[3]?.textContent?.trim() || '';
                const merchantId = cells[0]?.textContent?.trim() || '';
                const msku = cells[1]?.textContent?.trim() || '';
                const condition = cells[4]?.textContent?.trim() || '';
                const status = cells[5]?.textContent?.trim() || '';

                // Only include results where FNSKU and ASIN are the same
                if (fnsku && asin && fnsku === asin &&
                    merchantId.toLowerCase().includes(searchMIDLower)) {
                    results.push({
                        element: row,
                        page: pageNumber,
                        row: rowIndex,
                        mid: searchMIDLower,
                        merchantId,
                        msku,
                        fnsku,
                        asin,
                        condition,
                        status,
                        fullText: row.textContent.trim()
                    });
                }
            });
        });

        return results;
    }

    // Display functions
    function displayResults(final = false) {
        const resultsDiv = document.getElementById('search-results');
        if (!resultsDiv) return;

        let html = '';

        if (final && searchResults.length > 0) {
            html += `<div style="font-weight: bold; color: #007BFF; margin-bottom: 10px;">
                📋 Search Results (${searchResults.length} matches with same FNSKU/ASIN):</div>`;
        }

        searchResults.forEach((result, index) => {
            html += `
                <div style="margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #007BFF;">
                    <div style="font-weight: bold;">Match ${index + 1} (Page ${result.page})</div>
                    <div style="font-size: 11px; color: #666;">
                        Merchant: ${result.merchantId}<br>
                        MSKU: ${result.msku}<br>
                        FNSKU/ASIN: ${result.fnsku}<br>
                        Condition: ${result.condition}<br>
                        Status: ${result.status}
                    </div>
                </div>
            `;
        });

        resultsDiv.innerHTML = html;
    }

    // Helper functions
    function highlightRow(row, searchTerm) {
        if (!row) return;

        row.style.cssText += `
            background-color: #ffff00 !important;
            border: 3px solid #ff6b6b !important;
            box-shadow: 0 0 10px rgba(255, 107, 107, 0.5) !important;
        `;
        row.classList.add('mid-search-highlight');

        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            const text = cell.textContent;
            if (text.toLowerCase().includes(searchTerm)) {
                cell.style.fontWeight = 'bold';
                cell.style.textDecoration = 'underline';
            }
        });
    }

    function clearAllHighlights() {
        document.querySelectorAll('.mid-search-highlight').forEach(row => {
            row.style.backgroundColor = '';
            row.style.border = '';
            row.style.boxShadow = '';
            row.classList.remove('mid-search-highlight');

            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                cell.style.fontWeight = '';
                cell.style.textDecoration = '';
            });
        });
    }

    function addResultLine(text) {
        const resultsDiv = document.getElementById('search-results');
        if (!resultsDiv) return;

        const line = document.createElement('div');
        line.style.cssText = 'margin-bottom: 5px; padding: 5px; font-size: 11px; color: #666; border-bottom: 1px solid #eee;';
        line.textContent = text;
        resultsDiv.appendChild(line);
        resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }

    function showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('search-status');
        if (!statusDiv) return;

        const colors = {
            info: '#0c5460',
            success: '#155724',
            error: '#721c24',
            warning: '#856404'
        };

        statusDiv.textContent = message;
        statusDiv.style.color = colors[type] || colors.info;
    }

    function findNextButton() {
        const selectors = [
            'button[aria-label*="next" i]',
            'button[title*="next" i]',
            'a[aria-label*="next" i]',
            'a[title*="next" i]',
            '.pagination button:not([disabled])',
            '.pagination a:not(.disabled)',
            '.pager button:not([disabled])',
            '.pager a:not(.disabled)'
        ];

        for (const selector of selectors) {
            const buttons = document.querySelectorAll(selector);
            for (const btn of buttons) {
                if (!btn.disabled && btn.offsetParent !== null &&
                    window.getComputedStyle(btn).display !== 'none') {
                    return btn;
                }
            }
        }

        const clickableElements = document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]');
        for (const el of clickableElements) {
            const text = (el.textContent || el.value || '').toLowerCase().trim();
            const nextWords = ['next', 'next page', '→', '>', 'continue', 'more'];

            if (nextWords.some(word => text.includes(word))) {
                if (!el.disabled && el.offsetParent !== null &&
                    window.getComputedStyle(el).display !== 'none' &&
                    !text.includes('previous') && !text.includes('back')) {

                    return el;
                }
            }
        }

        return null;
    }

    async function waitForPageLoad(timeout = 5000) {
        return new Promise(resolve => {
            let attempts = 0;
            const maxAttempts = timeout / 100;
            let lastRowCount = -1;

            const checkInterval = setInterval(() => {
                attempts++;

                const currentRowCount = document.querySelectorAll('table tr').length;
                const hasContent = currentRowCount > 1;
                const noLoadingIndicator = !document.querySelector('.loading, .spinner, [aria-busy="true"], [aria-label*="loading" i]');
                const contentStabilized = currentRowCount === lastRowCount;

                if (hasContent && noLoadingIndicator && (contentStabilized || attempts >= maxAttempts)) {
                    clearInterval(checkInterval);
                    resolve();
                }

                lastRowCount = currentRowCount;
            }, 100);
        });
    }

    // Initialize floating button
    setTimeout(createFloatingButton, 2000);
    setTimeout(createFloatingButton, 5000);

    // Observe for page changes
    const observer = new MutationObserver(() => {
        if (!document.getElementById('fnsku-mid-search-btn')) {
            createFloatingButton();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}





})();
