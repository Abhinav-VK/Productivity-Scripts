// ==UserScript==
// @name        Combined Productivity Scripts
// @namespace   http://tampermonkey.net/
// @version     6.6.0
// @description Combines Hygiene Checks, RCAI Expand Findings, RCAI Results Popup, Serenity ID Extractor, SANTOS Checker, Check Mapping, Open RCAI and ILAC Auto Attach with Alt+X toggle panel
// @author      Abhinav
// @include     https://paragon-*.amazon.com/hz/view-case?caseId=*
// @include     https://paragon-na.amazon.com/hz/case?caseId=*
// @include     https://paragon-na.amazon.com/ilac/view-ilac-report?*
// @match       https://console.harmony.a2z.com/*
// @match       https://fba-registration-console-na.aka.amazon.com/*
// @match       https://moonraker-na.aka.amazon.com/serenity/open*
// @match       https://fba-fnsku-commingling-console-na.aka.amazon.com/tool/fnsku-mappings-tool*
// @require     https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @grant       GM_setClipboard
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @updateURL   https://raw.githubusercontent.com/Abhinav-VK/Productivity-Scripts/refs/heads/main/Script.js
// @downloadURL https://raw.githubusercontent.com/Abhinav-VK/Productivity-Scripts/refs/heads/main/Script.js
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
    filterAllMID: { name: "Check Mapping", default: true },
    openRCAI: { name: "Open RCAI", default: true },
    ilacAutoAttach: { name: "ILAC Auto Attach", default: true }
  };

  const STANDARD_BUTTON_STYLE = `
    position: fixed;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #000000;
    color: #ffffff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
    z-index: 9999;
    min-width: 140px;
    text-align: center;
    user-select: none;
  `;

  GM_addStyle(`
    .standard-floating-btn {
      ${STANDARD_BUTTON_STYLE}
    }

    .standard-floating-btn:hover {
      background: #333333 !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    }

    .standard-floating-btn:active {
      background: #000000 !important;
      transform: translateY(0) !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
    }

    .standard-floating-btn:disabled {
      background: #666666 !important;
      cursor: not-allowed !important;
      transform: none !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    }
  `);

  function isFeatureEnabled(feature) {
    return GM_getValue(feature, FEATURES[feature].default);
  }

  function setFeatureEnabled(feature, enabled) {
    GM_setValue(feature, enabled);
  }

  function createTogglePanel() {
    const existingPanel = document.getElementById('feature-toggle-panel');
    if (existingPanel) {
      existingPanel.remove();
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'feature-toggle-panel';
    panel.innerHTML = `
      <div class="toggle-header">
        <span class="toggle-title">Script Features</span>
        <button id="close-toggle-panel" class="close-btn">✕</button>
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
      </div>
    `;

    document.body.appendChild(panel);
    setupToggleListeners();

    panel.style.left = '50%';
    panel.style.top = '50%';
    panel.style.transform = 'translate(-50%, -50%)';
  }

  function setupToggleListeners() {
    document.getElementById('close-toggle-panel').onclick = () => {
      document.getElementById('feature-toggle-panel').remove();
    };

    Object.keys(FEATURES).forEach(feature => {
      const checkbox = document.getElementById(`toggle-${feature}`);
      checkbox.onchange = () => {
        setFeatureEnabled(feature, checkbox.checked);
        if (confirm('Feature updated! Reload page to apply changes?')) {
          location.reload();
        }
      };
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const panel = document.getElementById('feature-toggle-panel');
        if (panel) panel.remove();
      }
    });
  }

  GM_addStyle(`
    #feature-toggle-panel {
      position: fixed;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-width: 320px;
      max-width: 420px;
      overflow: hidden;
      border: 1px solid #e1e5e9;
    }

    .toggle-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .toggle-title {
      color: white;
      font-size: 18px;
      font-weight: 700;
      margin: 0;
    }

    .close-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      transition: background 0.2s ease;
      text-align: center;
    }

    .close-btn:hover {
      background: rgba(255,255,255,0.3);
    }

    .toggle-content {
      padding: 16px;
      background: #fafbfc;
    }

    .toggle-item {
      margin-bottom: 10px;
      display: flex;
      align-items: center;
    }

    .toggle-item:last-child {
      margin-bottom: 0;
    }

    .toggle-checkbox {
      display: flex;
      align-items: center;
      width: 100%;
      cursor: pointer;
      font-size: 15px;
      user-select: none;
      padding: 12px 16px;
      border-radius: 8px;
      background: white;
      border: 1px solid #e1e5e9;
      transition: all 0.2s ease;
    }

    .toggle-checkbox:hover {
      border-color: #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
    }

    .toggle-checkbox input[type="checkbox"] {
      margin-right: 12px;
      width: 18px;
      height: 18px;
      accent-color: #667eea;
    }

    .feature-name {
      font-weight: 500;
      color: #2d3748;
    }
  `);

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

    let keysPressed = new Set();
    document.addEventListener('keydown', e => {
      keysPressed.add(e.key.toLowerCase());
      if (keysPressed.has('v') && keysPressed.has('s')) {
        const btn = document.querySelector('#peek-now-button button');
        if (btn) btn.click();
      }
    });
    document.addEventListener('keyup', e => keysPressed.delete(e.key.toLowerCase()));

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

    const RCAITEXT = 'mfi root cause analysis and investigation';
    const DETAILSTEXT = 'details of the findings';
    const SHOWDETAILSTEXT = 'show details';

    function norm(txt) {
      return txt.trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function hasRCAI() {
      return norm(document.body.innerText).includes(RCAITEXT);
    }

    function hasDetailsFindings() {
      return norm(document.body.innerText).includes(DETAILSTEXT);
    }

    function hasShow() {
      return Array.from(document.querySelectorAll('button,a')).some(el =>
        el.offsetParent && norm(el.textContent).includes(SHOWDETAILSTEXT)
      );
    }

    function findDetailsOfFindingsButtons() {
      const buttons = [];
      const allElements = Array.from(document.querySelectorAll('*'));
      allElements.forEach(el => {
        if (norm(el.textContent).includes(DETAILSTEXT)) {
          const parent = el.closest('div') || el.parentElement;
          if (parent) {
            const showDetailsBtn = parent.querySelector('button, a');
            if (showDetailsBtn && norm(showDetailsBtn.textContent).includes(SHOWDETAILSTEXT)) {
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
      btn.className = 'standard-floating-btn';
      btn.style.bottom = '80px';
      btn.style.left = '20px';

      btn.onclick = function() {
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

        detailsButtons.forEach(function(el, i) {
            setTimeout(function() { el.click(); }, i * 300);
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
      if (hasRCAI() && hasDetailsFindings() && hasShow()) {
        addExpandBtn();
      }
    });

    obs.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      if (hasRCAI() && hasDetailsFindings() && hasShow()) {
        addExpandBtn();
      }
    }, 3000);
  }



  /////////////////////////////////
  // 3) RCAI Results Popup       //
  /////////////////////////////////

  if (isFeatureEnabled('rcaiResults') && /console\.harmony\.a2z\.com/.test(location.href)) {

    let popupVisible = false, removedStack = [], restoring = false;

    const RCAI_TEXT = 'mfi root cause analysis and investigation';
    const SHOW_DETAILS_TEXT = 'show details';
    function norm(txt) { return txt.trim().toLowerCase().replace(/\s+/g,' '); }
    function hasRCAI() { return norm(document.body.innerText).includes(RCAI_TEXT); }
    function hasShow() {
      return Array.from(document.querySelectorAll('button,a')).some(el =>
        el.offsetParent && norm(el.textContent).includes(SHOW_DETAILS_TEXT)
      );
    }

    function addRcaiResultsBtn() {
      if (!(hasRCAI() && hasShow())) return;
      if (document.getElementById('rcai-results-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'rcai-results-btn';
      btn.className = 'standard-floating-btn';
      btn.textContent = 'RCAI Results';
      btn.style.bottom = '20px';
      btn.style.left = '20px';
      btn.onclick = createPopup;
      document.body.appendChild(btn);
    }

    const buttonObs = new MutationObserver(() => {
      if (hasRCAI() && hasShow()) addRcaiResultsBtn();
    });
    buttonObs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { if (hasRCAI() && hasShow()) addRcaiResultsBtn(); }, 3000);

    GM_addStyle(`
      #rcai-popup {
        position: fixed !important;
        top: 10px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: 90vw !important;
        max-width: 1400px !important;
        min-width: 400px !important;
        background: white !important;
        border: 2px solid #8b5cf6 !important;
        border-radius: 8px !important;
        box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2) !important;
        z-index: 10001 !important;
        overflow: hidden !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }

      #rcai-popup.minimized {
        height: 45px !important;
        overflow: hidden !important;
      }

      .rcai-header {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6) !important;
        color: white !important;
        padding: 10px 12px !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        font-weight: bold !important;
        font-size: 15px !important;
        user-select: none !important;
        height: 45px !important;
        box-sizing: border-box !important;
      }

      .rcai-header-left { display: flex !important; align-items: center !important; gap: 12px !important; }

      .row-counter-header {
        background: rgba(255,255,255,0.2) !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        font-size: 11px !important;
        color: white !important;
        border: 1px solid rgba(255,255,255,0.3) !important;
      }

      .rcai-controls { display: flex !important; gap: 6px !important; }

      .rcai-controls button {
        padding: 5px 9px !important;
        font-size: 12px !important;
        background: rgba(255,255,255,0.2) !important;
        color: white !important;
        border: 1px solid rgba(255,255,255,0.3) !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-weight: 500 !important;
      }

      .rcai-controls button:hover { background: rgba(255,255,255,0.3) !important; }
      .rcai-controls button:disabled { background: rgba(255,255,255,0.1) !important; cursor: not-allowed !important; opacity: 0.6 !important; }

      .rcai-close-btn {
        padding: 5px 10px !important;
        font-size: 14px !important;
        background: rgba(255,255,255,0.2) !important;
        color: white !important;
        border: 1px solid rgba(255,255,255,0.3) !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-weight: bold !important;
        line-height: 1 !important;
      }

      .rcai-close-btn:hover { background: rgba(239, 68, 68, 0.8) !important; }

      #rcai-scroll {
        padding: 8px !important;
        background: white !important;
        overflow-x: auto !important;
        overflow-y: auto !important;
      }

      #rcai-popup.minimized #rcai-scroll { display: none !important; }

      #rcai-table {
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 12px !important;
        table-layout: fixed !important;
      }

      #rcai-table thead { position: sticky !important; top: 0 !important; z-index: 10 !important; background: white !important; }

      #rcai-table td, #rcai-table th {
        padding: 3px 5px !important;
        border: 1px solid #e5e7eb !important;
        background: white !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        height: 24px !important;
        box-sizing: border-box !important;
      }

      #rcai-table td:nth-child(1), #rcai-table th:nth-child(1) { width: 50px !important; min-width: 50px !important; max-width: 50px !important; }
      #rcai-table td:nth-child(2), #rcai-table th:nth-child(2) { width: 100px !important; min-width: 100px !important; max-width: 100px !important; }
      #rcai-table td:nth-child(3), #rcai-table th:nth-child(3) { width: 100px !important; min-width: 100px !important; max-width: 100px !important; }
      #rcai-table td:nth-child(4), #rcai-table th:nth-child(4) { width: 200px !important; min-width: 200px !important; }
      #rcai-table td:nth-child(5), #rcai-table th:nth-child(5) { width: 50px !important; min-width: 50px !important; max-width: 50px !important; }
      #rcai-table td:nth-child(6), #rcai-table th:nth-child(6) { width: 60px !important; min-width: 60px !important; max-width: 60px !important; }
#rcai-table td:nth-child(7), #rcai-table th:nth-child(7) { width: 70px !important; min-width: 70px !important; max-width: 70px !important; }
#rcai-table td:nth-child(8), #rcai-table th:nth-child(8) { width: 70px !important; min-width: 70px !important; max-width: 70px !important; }
#rcai-table td:nth-child(9), #rcai-table th:nth-child(9) { width: 70px !important; min-width: 70px !important; max-width: 70px !important; }
      #rcai-table td:nth-child(10), #rcai-table th:nth-child(10) { width: 200px !important; min-width: 200px !important; }
      #rcai-table td:nth-child(11), #rcai-table th:nth-child(11) { width: auto !important; min-width: 300px !important; }
      #rcai-table td:last-child, #rcai-table th:last-child { width: 25px !important; min-width: 25px !important; max-width: 25px !important; text-align: center !important; }

      #rcai-table input:not([type="checkbox"]) {
        width: 100% !important;
        padding: 3px 5px !important;
        border: none !important;
        font-size: 11px !important;
        outline: none !important;
        background: transparent !important;
        box-sizing: border-box !important;
      }

      #rcai-table input[type="checkbox"] {
        width: 11px !important;
        height: 11px !important;
        margin: 0 0 0 4px !important;
        cursor: pointer !important;
        accent-color: #8b5cf6 !important;
        vertical-align: middle !important;
        display: inline !important;
      }

      .rcai-header-checkbox {
        white-space: nowrap !important;
      }

      .rcai-header-checkbox label {
        font-size: 11px !important;
        font-weight: bold !important;
        color: #475569 !important;
        cursor: pointer !important;
        user-select: none !important;
        vertical-align: middle !important;
        display: inline !important;
      }

      #rcai-table input:focus { background: #f3f4f6 !important; border: 1px solid #8b5cf6 !important; border-radius: 2px !important; }
      #rcai-table thead tr { background: linear-gradient(135deg, #f8fafc, #f1f5f9) !important; }
      #rcai-table thead th { border: 2px solid #cbd5e1 !important; }
      #rcai-table thead input { font-weight: bold !important; color: #475569 !important; background: transparent !important; }

      .remove-btn {
        padding: 1px 3px !important;
        font-size: 10px !important;
        background: #ef4444 !important;
        color: white !important;
        border: none !important;
        border-radius: 2px !important;
        cursor: pointer !important;
        width: 16px !important;
        height: 16px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        line-height: 1 !important;
      }

      .remove-btn:hover { background: #dc2626 !important; }
    `);

    // Constants for height calculation
    const HEADER_HEIGHT = 45;
    const ROW_HEIGHT = 26;
    const HEADER_ROW_HEIGHT = 26;
    const PADDING = 18;
    const MAX_VISIBLE_ROWS = 10;

    function adjustPopupHeight() {
      const popup = document.getElementById('rcai-popup');
      const scrollArea = document.getElementById('rcai-scroll');

      if (!popup || !scrollArea || popup.classList.contains('minimized')) return;

      const rowCount = document.querySelectorAll('#rcai-body tr').length;
      const visibleRows = Math.min(rowCount, MAX_VISIBLE_ROWS);

      // Calculate scroll area height
      const scrollHeight = HEADER_ROW_HEIGHT + (visibleRows * ROW_HEIGHT) + PADDING;

      // Set scroll area height
      scrollArea.style.height = scrollHeight + 'px';

      // Enable/disable scrolling
      if (rowCount > MAX_VISIBLE_ROWS) {
        scrollArea.style.overflowY = 'auto';
      } else {
        scrollArea.style.overflowY = 'hidden';
      }
    }

    function storageKey() { return 'rcai:' + location.href; }

    function savePopupState() {
      const rows = Array.from(document.querySelectorAll('#rcai-body tr'));
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
        updateRowCounter();
        return true;
      } catch { return false; }
    }

    function updateRowNumbers() {
      let c = 0;
      document.querySelectorAll('#rcai-body tr').forEach(r => {
        r.querySelector('td:first-child input').value = ++c;
      });
      updateRowCounter();
    }

    function updateRowCounter() {
      const counter = document.querySelector('.row-counter-header');
      if (counter) {
        const rowCount = document.querySelectorAll('#rcai-body tr').length;
        counter.textContent = `${rowCount} rows`;
      }
    }

    function handleTab(e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const inputs = Array.from(document.querySelectorAll('#rcai-body tr input'));
        const idx = inputs.indexOf(e.target);
        const next = inputs[e.shiftKey ? idx-1 : idx+1];
        if (next) next.focus();
      }
      if (e.ctrlKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const inputs = Array.from(document.querySelectorAll('#rcai-body tr input'));
        const idx = inputs.indexOf(e.target);
        const cols = 11;
        let nextIdx = idx;
        switch(e.key) {
          case 'ArrowUp': nextIdx = idx - cols; break;
          case 'ArrowDown': nextIdx = idx + cols; break;
          case 'ArrowLeft': nextIdx = idx - 1; break;
          case 'ArrowRight': nextIdx = idx + 1; break;
        }
        if (nextIdx >= 0 && nextIdx < inputs.length) inputs[nextIdx].focus();
      }
    }

    function removeRow(tr) {
      const all = Array.from(document.querySelectorAll('#rcai-body tr'));
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
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');

      hdr.forEach((h, index) => {
        const th = document.createElement('th');
        th.style.textAlign = 'center';

        if (index === 9 || index === 10) {
          const span = document.createElement('span');
          span.className = 'rcai-header-checkbox';
          span.innerHTML = `<label for="${index === 9 ? 'include-blurb' : 'include-notes'}">${h}</label><input type="checkbox" id="${index === 9 ? 'include-blurb' : 'include-notes'}" checked>`;
          th.appendChild(span);
        } else {
          const inp = document.createElement('input');
          inp.value = h;
          inp.readOnly = true;
          inp.style.fontWeight = 'bold';
          inp.style.background = 'transparent';
          inp.style.textAlign = 'center';
          th.appendChild(inp);
        }

        tr.appendChild(th);
      });

      const th = document.createElement('th');
      th.innerHTML = '';
      tr.appendChild(th);
      thead.appendChild(tr);
      document.getElementById('rcai-table').appendChild(thead);
    }

    function createRowElement(data=[]) {
      const tr = document.createElement('tr');
      const numTd = document.createElement('td');
      const numIn = document.createElement('input');
      numIn.readOnly = true;
      numIn.style.background = '#f8fafc';
      numTd.appendChild(numIn);
      tr.appendChild(numTd);
      for (let i=0; i<9; i++) {
        const td = document.createElement('td');
        const inp = document.createElement('input');
        inp.value = data[i] || '';
        inp.onkeydown = handleTab;
        inp.oninput = () => { if (!restoring) savePopupState(); };
        td.appendChild(inp);
        tr.appendChild(td);
      }
      const notesTd = document.createElement('td');
      const notesIn = document.createElement('input');
      notesIn.maxLength = 50;
      notesIn.value = data[9] || '';
      notesIn.onkeydown = handleTab;
      notesIn.oninput = () => { if (!restoring) savePopupState(); };
      notesTd.appendChild(notesIn);
      tr.appendChild(notesTd);
      const rmTd = document.createElement('td');
      const rmBtn = document.createElement('button');
      rmBtn.textContent = '-';
      rmBtn.className = 'remove-btn';
      rmBtn.onclick = () => { removeRow(tr); savePopupState(); };
      rmTd.appendChild(rmBtn);
      tr.appendChild(rmTd);
      return tr;
    }

    function addRow(data=[], position=null) {
      const body = document.getElementById('rcai-body');
      if (!body) { console.error('RCAI Results: Table body not found'); return; }
      const row = createRowElement(data);
      if (typeof position === 'number') {
        const ref = body.children[position] || null;
        body.insertBefore(row, ref);
      } else {
        body.appendChild(row);
      }
      updateRowNumbers();
      adjustPopupHeight();
    }

    function toggleMinimize() {
      const popup = document.getElementById('rcai-popup');
      const btn = document.getElementById('minimize-btn');
      const scrollArea = document.getElementById('rcai-scroll');

      if (popup.classList.contains('minimized')) {
        popup.classList.remove('minimized');
        btn.textContent = '_';
        if (scrollArea) scrollArea.style.display = 'block';
        adjustPopupHeight();
      } else {
        popup.classList.add('minimized');
        btn.textContent = '□';
        if (scrollArea) scrollArea.style.display = 'none';
      }
    }

    function closePopup() {
      const popup = document.getElementById('rcai-popup');
      if (popup) {
        popup.remove();
        popupVisible = false;
      }
    }

    function copyData() {
      const includeBlurb = document.getElementById('include-blurb')?.checked ?? true;
      const includeNotes = document.getElementById('include-notes')?.checked ?? true;

      // Build dynamic headers and widths based on selections
      const allHeaders = ['#','FNSKU','DECISION','RC SUMMARY','DISC','FAULT','FOUND','DENY','RMS','BLURB','NOTES'];
      const allWidths = [4,12,12,18,6,10,8,8,8,34,20];

      const hdr = [];
      const widths = [];
      const includeColumn = [];

      allHeaders.forEach((h, i) => {
        if (i === 9 && !includeBlurb) {
          includeColumn.push(false);
          return;
        }
        if (i === 10 && !includeNotes) {
          includeColumn.push(false);
          return;
        }
        includeColumn.push(true);
        hdr.push(h);
        widths.push(allWidths[i]);
      });

      let out = 'RCAI RESULTS:\n';
      out += '|' + hdr.map((h,i) => h.padEnd(widths[i])).join('|') + '\n';

      let tF=0, tD=0, tR=0;

      document.querySelectorAll('#rcai-body tr').forEach(r => {
        const cells = Array.from(r.querySelectorAll('td')).slice(0,11);
        const vals = [];

        cells.forEach((cell, i) => {
          if (!includeColumn[i]) return;

          let v = cell.querySelector('input')?.value || '-';
          if (i === 6) tF += parseFloat(v) || 0;
          if (i === 7) tD += parseFloat(v) || 0;
          if (i === 8) tR += parseFloat(v) || 0;

          const widthIndex = hdr.indexOf(allHeaders[i]);
          vals.push(v.slice(0, widths[widthIndex]-1).padEnd(widths[widthIndex]));
        });

        out += '|' + vals.join('|') + '\n';
      });

      // Build totals row
      const total = hdr.map((h, i) => {
        const originalIndex = allHeaders.indexOf(h);
        if (originalIndex === 5) return 'TOTALS →'.padEnd(widths[i]);
        if (originalIndex === 6) return tF.toString().padEnd(widths[i]);
        if (originalIndex === 7) return tD.toString().padEnd(widths[i]);
        if (originalIndex === 8) return tR.toString().padEnd(widths[i]);
        return ''.padEnd(widths[i]);
      });

      out += '|' + total.join('|') + '\n';
      navigator.clipboard.writeText(out);
    }

    function autofillFromPage(append=false) {
      console.log('Starting autofillFromPage, append:', append);
      const codeRx = /^[A-Z0-9]{10}$/;
      const decRx = /^(DECLINE|APPROVE|PENDING|PARTIAL_DECLINE|PARTIAL|MANUAL)$/i;
      const coll = [];

      console.log('Strategy 1: DOM element scanning...');
      const elems = Array.from(document.querySelectorAll('body *'));
      let foundData = false;

      elems.forEach((el, i) => {
        const txt = (el.textContent || '').trim();
        if (!decRx.test(txt)) return;

        const decision = txt.toUpperCase().replace('PARTIAL_DECLINE', 'PARTIAL');
        const codes = [];

        let disc = '';
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
          const t = (elems[j].textContent || '').trim();
          if (t.toLowerCase().includes('shortage quantity')) {
            for (let k = j + 1; k <= Math.min(elems.length - 1, j + 5); k++) {
              const numText = (elems[k].textContent || '').trim();
              if (/^\d+$/.test(numText)) { disc = numText; break; }
            }
            if (disc) break;
          }
          if (j === i - 2 && !disc) {
            const fallbackText = t.trim();
            if (/^\d+$/.test(fallbackText)) disc = fallbackText;
          }
        }

        for (let j = i - 1; j >= Math.max(0, i - 15); j--) {
          const t = (elems[j].textContent || '').trim();
          if (codeRx.test(t)) codes.push(t);
        }

        const next = elems[i + 1]?.textContent?.trim() || '';
        const rcParts = next.split(',');

        const rcSummary = rcParts.length > 1 ?
          rcParts.map(it => {
            const trimmed = it.trim();
            if (trimmed.toLowerCase().includes('item label defect')) return 'Label';
            const firstWord = trimmed.split(/\s+/)[0];
            return firstWord || trimmed;
          }).join(', ')
          : rcParts[0].trim();

        let fault = 'NONE';
        for (let k = i + 1; k < Math.min(elems.length, i + 20); k++) {
          const s = (elems[k].textContent || '').toLowerCase();
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
          foundData = true;
        }
      });

      if (!foundData) {
        console.log('Strategy 2: Table-based extraction...');
        const allTables = document.querySelectorAll('table');

        allTables.forEach((table) => {
          const headerRow = Array.from(table.querySelectorAll('tr')).find(row => {
            const text = row.textContent.toLowerCase();
            return text.includes('fnsku') && text.includes('shortage quantity') && text.includes('decision');
          });

          if (!headerRow) return;

          const headerCells = headerRow.querySelectorAll('th, td');
          let fnskuIndex = -1, asinIndex = -1, decisionIndex = -1, summaryIndex = -1, shortageIndex = -1;

          headerCells.forEach((cell, index) => {
            const text = cell.textContent.toLowerCase().trim();
            if (text === 'fnsku') fnskuIndex = index;
            else if (text === 'asin') asinIndex = index;
            else if (text === 'decision') decisionIndex = index;
            else if (text.includes('root cause')) summaryIndex = index;
            else if (text === 'shortage quantity') shortageIndex = index;
          });

          if (fnskuIndex === -1 || decisionIndex === -1 || shortageIndex === -1) return;

          const allRows = Array.from(table.querySelectorAll('tr'));
          const dataRows = allRows.filter(row => row !== headerRow && row.querySelectorAll('td').length > 0);

          dataRows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 0) return;

            const fnsku = cells[fnskuIndex]?.textContent?.trim() || '';
            const asin = cells[asinIndex]?.textContent?.trim() || '';
            const decision = cells[decisionIndex]?.textContent?.trim() || '';
            const rcSummary = cells[summaryIndex]?.textContent?.trim() || '';
            const shortage = cells[shortageIndex]?.textContent?.trim() || '';

            if (fnsku && asin && fnsku === asin && decision && decRx.test(decision)) {
              const fault = determineFaultFromSummary(rcSummary);
              const normalizedDecision = decision.toUpperCase().replace('PARTIAL_DECLINE', 'PARTIAL');
              coll.push([fnsku, normalizedDecision, rcSummary, shortage, fault, '', '', '', '', '']);
              foundData = true;
            }
          });
        });
      }

      const uniqueData = [];
      const seenFNSKUs = new Set();
      coll.forEach(row => {
        if (!seenFNSKUs.has(row[0])) {
          seenFNSKUs.add(row[0]);
          uniqueData.push(row);
        }
      });

      if (!append) document.querySelectorAll('#rcai-body tr').forEach(r => r.remove());
      uniqueData.forEach(r => addRow(r));
      updateRowNumbers();
      adjustPopupHeight();
    }

    function determineFaultFromSummary(summary) {
      if (!summary) return 'NONE';
      const text = summary.toLowerCase();
      if (text.includes('item substitution') || text.includes('carton missing')) return 'Seller';
      if (text.includes('fc operation') || text.includes('amazon') || text.includes('warehouse')) return 'Amazon';
      if (text.includes('damaged') || text.includes('defective')) return 'Unknown';
      return 'NONE';
    }

    function createPopup() {
      if (popupVisible) return;
      popupVisible = true;
      const popup = document.createElement('div');
      popup.id = 'rcai-popup';
      popup.innerHTML = `
        <div class="rcai-header">
          <div class="rcai-header-left">
            <span>RCAI RESULTS</span>
            <span class="row-counter-header">0 rows</span>
          </div>
          <div class="rcai-controls">
            <button id="add-row">Add Row</button>
            <button id="rescan-btn">Rescan</button>
            <button id="undo-btn" disabled>Undo</button>
            <button id="copy-only">Copy</button>
            <button id="copy-close">Copy & Close</button>
            <button id="minimize-btn">_</button>
            <button id="close-btn" class="rcai-close-btn">✕</button>
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
      document.getElementById('copy-close').onclick = () => { copyData(); closePopup(); };
      document.getElementById('minimize-btn').onclick = toggleMinimize;
      document.getElementById('close-btn').onclick = closePopup;

      addHeaderRow();
      restoring = true;
      const ok = restorePopupState();
      restoring = false;
      if (!ok) autofillFromPage(false);
      if (!document.querySelector('#rcai-body tr')) addRow();

      // Adjust height after content is loaded
      setTimeout(adjustPopupHeight, 50);
    }

    document.addEventListener('keydown', e => {
      if (e.altKey && e.key.toLowerCase() === 'r' && hasRCAI()) createPopup();
    });
  }




//////////////////////////////////
// 4) Serenity ID Extractor     //
//////////////////////////////////

if (isFeatureEnabled('serenityExtractor') &&
    /moonraker-na\.aka\.amazon\.com\/serenity\/open/.test(location.href)) {

  let isExtracting = false;

  // Add styles for Serenity panel
  GM_addStyle(`
    #serenity-extract-panel {
      position: fixed;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      width: 400px;
      overflow: hidden;
      border: 1px solid #e1e5e9;
      animation: serenitySlideIn 0.3s ease-out;
    }

    @keyframes serenitySlideIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .serenity-panel-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .serenity-panel-title {
      color: white;
      font-size: 16px;
      font-weight: 700;
      margin: 0;
    }

    .serenity-panel-close {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      line-height: 1;
      transition: background 0.2s ease;
    }

    .serenity-panel-close:hover {
      background: rgba(255,255,255,0.3);
    }

    .serenity-panel-content {
      padding: 16px;
      background: #fafbfc;
    }

    .serenity-input-group {
      margin-bottom: 16px;
    }

    .serenity-input-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #2d3748;
      font-size: 14px;
    }

    .serenity-input-hint {
      display: block;
      margin-bottom: 8px;
      font-size: 12px;
      color: #718096;
    }

    .serenity-input-field {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: all 0.2s ease;
      background: white;
      font-family: inherit;
      box-sizing: border-box;
    }

    .serenity-input-field:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .serenity-extract-btn {
      width: 100%;
      padding: 12px 16px;
      background: #000000;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
      box-sizing: border-box;
    }

    .serenity-extract-btn:hover:not(:disabled) {
      background: #333333;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .serenity-extract-btn:disabled {
      background: #666666;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .serenity-status {
      font-size: 13px;
      text-align: center;
      min-height: 18px;
      margin: 12px 0 0 0;
      padding: 10px;
      border-radius: 6px;
      font-weight: 500;
      display: none;
    }

    .serenity-status.visible {
      display: block;
    }

    .serenity-status.info {
      background: #dbeafe;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }

    .serenity-status.success {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .serenity-status.error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .serenity-status.warning {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fed7aa;
    }

    .serenity-results {
      margin-top: 12px;
      padding: 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e1e5e9;
      display: none;
    }

    .serenity-results.visible {
      display: block;
    }

    .serenity-results-title {
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 8px;
      font-size: 13px;
    }

    .serenity-results-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .serenity-stat-item {
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 6px;
      border-left: 3px solid #667eea;
    }

    .serenity-stat-item.highlighted {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-left: none;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .serenity-stat-item.highlighted .serenity-stat-label {
      color: rgba(255, 255, 255, 0.85);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .serenity-stat-item.highlighted .serenity-stat-value {
      color: white;
      font-size: 28px;
      font-weight: 800;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .serenity-stat-label {
      font-size: 11px;
      color: #718096;
      text-transform: uppercase;
    }

    .serenity-stat-value {
      font-size: 16px;
      font-weight: 700;
      color: #2d3748;
    }

    .serenity-copy-again-container {
      text-align: center;
      margin-top: 12px;
      position: relative;
    }

    .serenity-copy-again-btn {
      display: none;
      background: #000000;
      color: white;
      padding: 10px 24px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .serenity-copy-again-btn:hover {
      background: #333333;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .serenity-copy-again-btn:active {
      transform: translateY(0);
    }

    .serenity-copy-feedback {
      display: block;
      margin-top: 8px;
      font-size: 12px;
      color: #166534;
      font-weight: 500;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .serenity-copy-feedback.visible {
      opacity: 1;
    }
  `);

  // Store extracted IDs for copy again functionality
  let extractedIds = '';

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

      cells.forEach(c => {
        const m = c.textContent.trim().match(/\b[A-Za-z0-9]{55,}\b/);
        if (m) uid = m[0];
      });

      if (!uid) return;

      const dm = r.textContent.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      if (!dm) return;

      const ds = dm[1];
      if (ds < startDate || ds > endDate) return;

      let qty = 0;
      cells.forEach(c => {
        const m = c.textContent.trim().match(/^\d+$/);
        if (m) qty = parseInt(m[0], 10);
      });

      map.set(uid, (map.get(uid) || 0) + qty);
    });

    return map;
  }

  function waitForPageLoad() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50;

      const checkInterval = setInterval(() => {
        attempts++;
        const hasContent = document.querySelectorAll('table tr').length > 1;

        if (hasContent || attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setTimeout(resolve, 200);
        }
      }, 200);
    });
  }

  function showSerenityPanel() {
    const existing = document.getElementById('serenity-extract-panel');
    if (existing) {
      existing.remove();
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'serenity-extract-panel';

    panel.innerHTML = `
      <div class="serenity-panel-header">
        <span class="serenity-panel-title">Serenity ID Extractor</span>
        <button class="serenity-panel-close" id="close-serenity-panel">✕</button>
      </div>
      <div class="serenity-panel-content">
        <div class="serenity-input-group">
          <label class="serenity-input-label">First Receive Date / Delivery Date</label>
          <span class="serenity-input-hint">Format: MM/DD/YYYY (e.g., 01/15/2025)</span>
          <input type="text" id="serenity-date-input" class="serenity-input-field" placeholder="MM/DD/YYYY" />
        </div>
        <button id="start-serenity-extract" class="serenity-extract-btn">Extract Serenity IDs</button>
        <div id="serenity-status" class="serenity-status"></div>
        <div id="serenity-results" class="serenity-results">
          <div class="serenity-results-title">Extraction Results</div>
          <div class="serenity-results-stats">
            <div class="serenity-stat-item highlighted">
              <div class="serenity-stat-label">Total Quantity</div>
              <div class="serenity-stat-value" id="serenity-qty">0</div>
            </div>
            <div class="serenity-stat-item">
              <div class="serenity-stat-label">Pages Scanned</div>
              <div class="serenity-stat-value" id="serenity-pages">0</div>
            </div>
            <div class="serenity-stat-item">
              <div class="serenity-stat-label">Date Range</div>
              <div class="serenity-stat-value" id="serenity-range" style="font-size:11px;">-</div>
            </div>
          </div>
          <div class="serenity-copy-again-container">
            <button class="serenity-copy-again-btn" id="serenity-copy-again-btn">📋 Copy Again</button>
            <span class="serenity-copy-feedback" id="serenity-copy-feedback">✓ Copied!</span>
          </div>
        </div>
      </div>
    `;

    Object.assign(panel.style, { bottom: '80px', right: '20px', position: 'fixed' });
    document.body.appendChild(panel);

    document.getElementById('close-serenity-panel').onclick = () => panel.remove();
    document.getElementById('start-serenity-extract').onclick = startExtraction;

    // Copy Again button handler
    document.getElementById('serenity-copy-again-btn').onclick = copyAgain;

    const input = document.getElementById('serenity-date-input');
    input.focus();
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !isExtracting) startExtraction();
    });
  }

  function copyAgain() {
    if (extractedIds) {
      GM_setClipboard(extractedIds);
      const feedback = document.getElementById('serenity-copy-feedback');
      if (feedback) {
        feedback.classList.add('visible');
        setTimeout(() => {
          feedback.classList.remove('visible');
        }, 2000);
      }
    }
  }

  function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('serenity-status');
    if (!statusDiv) return;
    statusDiv.textContent = message;
    statusDiv.className = `serenity-status visible ${type}`;
  }

  function hideStatus() {
    const statusDiv = document.getElementById('serenity-status');
    if (statusDiv) {
      statusDiv.className = 'serenity-status';
    }
  }

  function showResults(count, total, pages, startDate, endDate) {
    const resultsDiv = document.getElementById('serenity-results');
    if (!resultsDiv) return;

    document.getElementById('serenity-qty').textContent = total;
    document.getElementById('serenity-pages').textContent = pages;
    document.getElementById('serenity-range').textContent = `${startDate} to ${endDate}`;

    resultsDiv.className = 'serenity-results visible';

    const copyAgainBtn = document.getElementById('serenity-copy-again-btn');
    if (copyAgainBtn) {
      copyAgainBtn.style.display = 'inline-block';
    }
  }

  function hideResults() {
    const resultsDiv = document.getElementById('serenity-results');
    if (resultsDiv) {
      resultsDiv.className = 'serenity-results';
    }
    const copyAgainBtn = document.getElementById('serenity-copy-again-btn');
    if (copyAgainBtn) {
      copyAgainBtn.style.display = 'none';
    }
  }

  async function startExtraction() {
    if (isExtracting) return;

    const input = document.getElementById('serenity-date-input');
    const button = document.getElementById('start-serenity-extract');
    const inp = input?.value?.trim();

    if (!inp) {
      showStatus('Please enter a date', 'error');
      return;
    }

    const startDate = toYMD(inp);
    if (!startDate) {
      showStatus('Invalid date format. Use MM/DD/YYYY', 'error');
      return;
    }

    isExtracting = true;
    button.disabled = true;
    hideResults();
    extractedIds = ''; // Reset stored IDs

    const endDate = addDays(startDate, 46);
    const allResults = new Map();
    let pageCount = 1;
    const maxPages = 50;

    showStatus(`Processing Page ${pageCount}...`, 'info');
    button.textContent = `Processing Page ${pageCount}...`;

    while (pageCount <= maxPages) {
      const pageResults = extractFromCurrentPage(startDate, endDate);

      pageResults.forEach((qty, uid) => {
        allResults.set(uid, (allResults.get(uid) || 0) + qty);
      });

      const nextBatchBtn = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"], span'))
        .find(el => {
          const text = (el.textContent || el.value || '').toLowerCase().trim();
          return text.includes('get next batch') || text.includes('next batch') || text.includes('get next') || (text.includes('next') && text.includes('batch'));
        });

      if (!nextBatchBtn || nextBatchBtn.disabled || nextBatchBtn.style.display === 'none' ||
          nextBatchBtn.offsetParent === null || window.getComputedStyle(nextBatchBtn).display === 'none') {
        break;
      }

      pageCount++;
      showStatus(`Processing Page ${pageCount}...`, 'info');
      button.textContent = `Processing Page ${pageCount}...`;
      nextBatchBtn.click();
      await waitForPageLoad();
    }

    button.textContent = 'Extract Serenity IDs';
    button.disabled = false;
    isExtracting = false;

    if (!allResults.size) {
      showStatus(`No Serenity IDs found between ${startDate} and ${endDate} (45 days across ${pageCount} pages)`, 'warning');
      return;
    }

    const ids = Array.from(allResults.keys()).join(',');
    const total = Array.from(allResults.values()).reduce((a, b) => a + b, 0);

    // Store IDs for copy again functionality
    extractedIds = ids;

    GM_setClipboard(ids);

    // Updated status message
    showStatus(`Copied ${allResults.size} IDs to Clipboard`, 'success');
    showResults(allResults.size, total, pageCount, startDate, endDate);
  }

  const btn = document.createElement('button');
  btn.className = 'standard-floating-btn';
  btn.textContent = 'Extract Serenity IDs';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.addEventListener('click', showSerenityPanel);
  document.body.appendChild(btn);
}




  /////////////////////////////////
  // 5) SANTOS Checker           //
  /////////////////////////////////

  if (isFeatureEnabled('santosChecker') &&
      /paragon-na\.amazon\.com\/ilac\/view-ilac-report\?/.test(location.href)) {

    function createSubtleNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed; top: 10px; right: 10px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
        padding: 12px 16px; border-radius: 4px; font-size: 14px; font-family: Arial, sans-serif;
        z-index: 10000; max-width: 300px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        opacity: 0; transition: opacity 0.3s ease-in-out;
      `;
      notification.textContent = message;
      document.body.appendChild(notification);
        setTimeout(function() { notification.style.opacity = '1'; }, 10);
        setTimeout(function() {
            notification.style.opacity = '0';
            setTimeout(function() { notification.remove(); }, 300);
        }, 5000);
    }

    async function extractMIDFromCopyButton() {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const copyMIDBtn = buttons.find(btn => btn.textContent && btn.textContent.trim() === 'Copy MID');

      if (!copyMIDBtn) return null;

      const parentElement = copyMIDBtn.closest('tr') || copyMIDBtn.parentElement;
      if (parentElement) {
        const text = parentElement.textContent;
        const midMatch = text.match(/\((\d{7,15})\)/);
        if (midMatch && midMatch[1]) return midMatch[1];

        const buttonText = copyMIDBtn.previousSibling?.textContent?.trim();
        if (buttonText && /^\d{7,15}$/.test(buttonText)) return buttonText;
      }

      const pageText = document.body.innerText;
      const merchantPattern = /(?:Merchant[^\n]*?|Customer[^\n]*?ID:)\s*([A-Z0-9]+)\s*\(\s*(\d{7,15})\s*\)/i;
      const merchantMatch = pageText.match(merchantPattern);
      if (merchantMatch && merchantMatch[2]) return merchantMatch[2];

      return null;
    }

    async function checkForSANTOS() {
      try {
        const mid = await extractMIDFromCopyButton();

        if (!mid) {
          createSubtleNotification('Could not extract MID from Copy button', 'error');
          return;
        }

        localStorage.setItem('santosCheckerMID', mid);
        createSubtleNotification('Found MID: ' + mid + '. Opening SANTOS checker...', 'success');

        const santosURL = `https://fba-registration-console-na.aka.amazon.com/merchants/${mid}`;
        window.open(santosURL, '_blank');
      } catch (error) {
        createSubtleNotification('Error extracting MID', 'error');
      }
    }

    function addSANTOSButton() {
      if (document.getElementById('santos-check-btn')) return;

      const buttons = document.querySelectorAll('button, input[type="button"], a');
      let copyMIDButton = null;

      for (let btn of buttons) {
        if (btn.textContent && btn.textContent.trim() === 'Copy MID') {
          copyMIDButton = btn;
          break;
        }
      }

      if (!copyMIDButton) return;

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
    }

    setTimeout(addSANTOSButton, 1000);
    setTimeout(addSANTOSButton, 3000);

    const observer = new MutationObserver(addSANTOSButton);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // SANTOS PAGE SCRIPT
  if (location.href.includes('fba-registration-console-na.aka.amazon.com')) {
    function createSantosNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed; top: 10px; right: 10px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
        padding: 12px 16px; border-radius: 4px; font-size: 14px; font-family: Arial, sans-serif;
        z-index: 10000; max-width: 300px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        opacity: 0; transition: opacity 0.3s ease-in-out;
      `;
      notification.textContent = message;
      document.body.appendChild(notification);
        setTimeout(function() { notification.style.opacity = '1'; }, 10);
        setTimeout(function() {
            notification.style.opacity = '0';
            setTimeout(function() { notification.remove(); }, 300);
        }, 3000);
    }

    setTimeout(() => {
      const pageText = document.body.innerText.toUpperCase();
      const hasSANTOS = pageText.includes('SANTOS');

      if (hasSANTOS) {
        createSantosNotification('SANTOS found and highlighted!', 'success');

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
  // 6) Check Mapping            //
  /////////////////////////////////

  if (isFeatureEnabled('filterAllMID') && location.href.startsWith('https://fba-fnsku-commingling-console-na.aka.amazon.com/tool/fnsku-mappings-tool')) {
    console.log('FNSKU MID Search: Initializing floating button...');

    let isSearching = false;
    let searchResults = [];

    GM_addStyle(`
        #mid-search-panel {
            position: fixed;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            width: 380px;
            overflow: hidden;
            border: 1px solid #e1e5e9;
            animation: slideUpIn 0.3s ease-out;
        }

        @keyframes slideUpIn {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .mid-panel-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .mid-panel-title {
            color: white;
            font-size: 16px;
            font-weight: 700;
            margin: 0;
        }

        .mid-mapping-type-indicator {
            font-style: italic;
            font-weight: 400;
            color: white;
            opacity: 0.9;
            font-size: 13px;
        }

        .mid-panel-close {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            line-height: 1;
            transition: background 0.2s ease;
        }

        .mid-panel-close:hover {
            background: rgba(255,255,255,0.3);
        }

        .mid-panel-content {
            padding: 16px;
            background: #fafbfc;
        }

        .mid-input-group {
            margin-bottom: 16px;
        }

        .mid-input-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #2d3748;
            font-size: 14px;
        }

        .mid-input-field {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 14px;
            outline: none;
            transition: all 0.2s ease;
            background: white;
            font-family: inherit;
            box-sizing: border-box;
        }

        .mid-input-field:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .mid-search-btn {
            width: 100%;
            padding: 12px 16px;
            background: #000000;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
            box-sizing: border-box;
            margin-bottom: 0;
        }

        .mid-search-btn:hover:not(:disabled) {
            background: #333333;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .mid-search-btn:disabled {
            background: #666666;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .mid-status {
            font-size: 13px;
            text-align: center;
            min-height: 18px;
            margin: 12px 0 0 0;
            padding: 8px;
            border-radius: 6px;
            font-weight: 500;
        }

        .mid-status:empty {
            padding: 0;
            margin: 0;
            min-height: 0;
        }

        .mid-status.info {
            background: #dbeafe;
            color: #1e40af;
            border: 1px solid #bfdbfe;
        }
        .mid-status.success {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
        }
        .mid-status.error {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }
        .mid-status.warning {
            background: #fffbeb;
            color: #d97706;
            border: 1px solid #fed7aa;
        }

        .mid-results {
            max-height: 200px;
            overflow-y: auto;
            margin-top: 12px;
            border-radius: 6px;
            background: white;
            border: 1px solid #e1e5e9;
        }

        .mid-results:empty {
            display: none !important;
        }

        .mid-result-item {
            margin: 8px;
            padding: 12px;
            background: #f8fafc;
            border-radius: 6px;
            border-left: 3px solid #667eea;
            font-size: 12px;
        }

        .mid-result-title {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 6px;
        }

        .mid-result-details {
            color: #64748b;
            line-height: 1.4;
        }

        .mid-result-log {
            padding: 6px;
            margin: 2px 8px;
            font-size: 11px;
            color: #6b7280;
            border-bottom: 1px solid #f1f5f9;
        }

        .mid-result-log:last-child {
            border-bottom: none;
        }
    `);

    // Function to get the current mapping type
    function getMappingType() {
      // Try using the XPath first
      try {
        const xpathResult = document.evaluate(
          '//*[@id="includeInactive"]//*[@id="getMappingsType"]',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        const selector = xpathResult.singleNodeValue;

        if (selector) {
          // Handle select element
          if (selector.tagName === 'SELECT') {
            const selectedOption = selector.options[selector.selectedIndex];
            const value = selectedOption?.textContent?.trim() || selector.value || '';
            console.log('[FNSKU MID Search] Mapping type from XPath (select):', value);
            return value;
          }
          // Handle other element types
          const value = selector.value || selector.textContent?.trim() || '';
          console.log('[FNSKU MID Search] Mapping type from XPath:', value);
          return value;
        }
      } catch (e) {
        console.log('[FNSKU MID Search] XPath evaluation error:', e);
      }

      // Fallback: Try direct ID selector
      const selector = document.querySelector('#getMappingsType');
      if (selector) {
        if (selector.tagName === 'SELECT') {
          const selectedOption = selector.options[selector.selectedIndex];
          const value = selectedOption?.textContent?.trim() || selector.value || '';
          console.log('[FNSKU MID Search] Mapping type from ID (select):', value);
          return value;
        }
        const value = selector.value || selector.textContent?.trim() || '';
        console.log('[FNSKU MID Search] Mapping type from ID:', value);
        return value;
      }

      // Another fallback: Look for any dropdown with mapping options
      const allSelects = document.querySelectorAll('select');
      for (const sel of allSelects) {
        const options = Array.from(sel.options).map(o => o.textContent.toLowerCase());
        if (options.some(o => o.includes('asin mapping') || o.includes('fnsku mapping'))) {
          const selectedOption = sel.options[sel.selectedIndex];
          const value = selectedOption?.textContent?.trim() || '';
          console.log('[FNSKU MID Search] Mapping type from fallback select:', value);
          return value;
        }
      }

      console.log('[FNSKU MID Search] Could not determine mapping type, defaulting to FNSKU');
      return 'FNSKU Mappings'; // Default
    }

    function isAsinMappingMode() {
      const mappingType = getMappingType().toLowerCase();
      return mappingType.includes('asin');
    }

    function isFnskuMappingMode() {
      const mappingType = getMappingType().toLowerCase();
      return mappingType.includes('fnsku') || !mappingType.includes('asin');
    }

    function getMappingTypeShort() {
      return isAsinMappingMode() ? '(ASIN)' : '(FNSKU)';
    }

    function getMappingTypeDisplay() {
      return isAsinMappingMode() ? 'ASIN Mappings' : 'FNSKU Mappings';
    }



      function updatePanelMappingType() {
  const mappingTypeShort = getMappingTypeShort();
  const mappingType = getMappingTypeDisplay();
  const isAsin = isAsinMappingMode();

  // Update the header indicator
  const indicator = document.querySelector('.mid-mapping-type-indicator');
  if (indicator) {
    indicator.textContent = mappingTypeShort;
  }

  // Update the info box
  const infoBox = document.querySelector('#mid-search-panel .mid-panel-content > div:nth-child(2)');
  if (infoBox) {
    infoBox.innerHTML = `
      <strong>Mode:</strong> ${mappingType}<br>
      ${isAsin
        ? '<em>Will check for matching FNSKU = ASIN</em>'
        : '<em>Will search for MID matches only</em>'}
    `;
  }
}


    function createFloatingButton() {
      if (document.getElementById('fnsku-mid-search-btn')) return;

      const btn = document.createElement('button');
      btn.id = 'fnsku-mid-search-btn';
      btn.textContent = 'MID Search';
      btn.className = 'standard-floating-btn';
      btn.style.bottom = '20px';
      btn.style.right = '20px';

      btn.addEventListener('click', showMidSearchPanel);
      document.body.appendChild(btn);
    }

    function showMidSearchPanel() {
      const existing = document.getElementById('mid-search-panel');
      if (existing) { existing.remove(); return; }

      const mappingType = getMappingTypeDisplay();
      const mappingTypeShort = getMappingTypeShort();
      const isAsin = isAsinMappingMode();

      const panel = document.createElement('div');
      panel.id = 'mid-search-panel';

      panel.innerHTML = `
        <div class="mid-panel-header">
          <span class="mid-panel-title">MID Search Tool <span class="mid-mapping-type-indicator">${mappingTypeShort}</span></span>
          <button class="mid-panel-close" id="close-mid-panel">✕</button>
        </div>
        <div class="mid-panel-content">
          <div class="mid-input-group">
            <label class="mid-input-label">Enter MID to Search:</label>
            <input type="text" id="mid-search-input" class="mid-input-field" placeholder="Paste MID here..." />
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 12px; padding: 8px; background: #f0f4ff; border-radius: 6px;">
            <strong>Mode:</strong> ${mappingType}<br>
            ${isAsin
              ? '<em>Will check for matching FNSKU = ASIN</em>'
              : '<em>Will search for MID matches only</em>'}
          </div>
          <button id="start-mid-search" class="mid-search-btn">Search All Pages</button>
          <div id="search-status" class="mid-status"></div>
          <div id="search-results" class="mid-results" style="display: none;"></div>
        </div>
      `;

      Object.assign(panel.style, { bottom: '80px', right: '20px' });
      document.body.appendChild(panel);

      document.getElementById('close-mid-panel').onclick = () => {
  // Cleanup observers and listeners
  if (panel.mappingObserver) {
    panel.mappingObserver.disconnect();
  }
  if (panel.mappingTypeSelector && panel.mappingTypeHandler) {
    panel.mappingTypeSelector.removeEventListener('change', panel.mappingTypeHandler);
  }
  panel.remove();
};
      document.getElementById('start-mid-search').onclick = startMidSearch;
      document.getElementById('mid-search-input').focus();

      document.getElementById('mid-search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isSearching) startMidSearch();
      });
        // Watch for mapping type dropdown changes
const mappingTypeSelector = document.querySelector('#getMappingsType');
if (mappingTypeSelector) {
  mappingTypeSelector.addEventListener('change', updatePanelMappingType);

  // Store reference for cleanup
  panel.mappingTypeSelector = mappingTypeSelector;
  panel.mappingTypeHandler = updatePanelMappingType;
}

// Also observe via MutationObserver as fallback
const mappingObserver = new MutationObserver(() => {
  updatePanelMappingType();
});

const dropdownContainer = document.querySelector('#includeInactive');
if (dropdownContainer) {
  mappingObserver.observe(dropdownContainer, {
    subtree: true,
    attributes: true,
    characterData: true,
    childList: true
  });
}

// Store observer for cleanup
panel.mappingObserver = mappingObserver;
    }

    async function startMidSearch() {
      if (isSearching) return;

      const input = document.getElementById('mid-search-input');
      const button = document.getElementById('start-mid-search');
      const results = document.getElementById('search-results');

      const searchMID = input.value.trim();
      if (!searchMID) { showStatus('Please enter a MID to search!', 'error'); return; }

      isSearching = true;
      button.disabled = true;
      button.textContent = 'Searching...';
      results.innerHTML = '';
      results.style.display = 'none';
      searchResults = [];

      clearAllHighlights();

      // Determine the mapping mode at the start of search
      const isAsinMode = isAsinMappingMode();
      const mappingType = getMappingTypeDisplay();
      console.log(`[FNSKU MID Search] Starting search in ${mappingType} mode`);

      try {
        let pageCount = 0;
        const maxPages = 200;
        const searchMIDLower = searchMID.toLowerCase();
        let found = false;

        showStatus(`Searching pages (${mappingType})...`, 'info');

        while (pageCount < maxPages) {
          pageCount++;
          button.textContent = `Page ${pageCount}`;

          const pageResults = searchCurrentPage(searchMIDLower, pageCount);

          if (pageResults.length > 0) {
            if (isAsinMode) {
              // ASIN Mappings mode: Check for matching FNSKU = ASIN
              const matchingResults = pageResults.filter(result => result.fnsku === result.asin);

              if (matchingResults.length > 0) {
                searchResults = matchingResults;
                matchingResults.forEach(result => highlightRow(result.element, result.mid));
                scrollToElement(matchingResults[0].element);
                addResultLine(`Page ${pageCount}: Found ${matchingResults.length} result(s) with matching FNSKU/ASIN!`);
                displayResults(false, isAsinMode);
                found = true;
                break;
              } else {
                // Found MID but FNSKU != ASIN, show but continue searching
                addResultLine(`Page ${pageCount}: Found ${pageResults.length} MID match(es) but FNSKU ≠ ASIN, continuing...`);
                // Don't stop, keep searching for matching FNSKU/ASIN
              }
            } else {
              // FNSKU Mappings mode: Just check for MID match
              searchResults = pageResults;
              pageResults.forEach(result => highlightRow(result.element, result.mid));
              scrollToElement(pageResults[0].element);
              addResultLine(`Page ${pageCount}: Found ${pageResults.length} MID match(es)!`);
              displayResults(false, isAsinMode);
              found = true;
              break;
            }
          } else {
            addResultLine(`Page ${pageCount}: No matches`);
          }

          const nextBtn = findNextButton();
          if (!nextBtn) break;

          nextBtn.click();
          const pageLoadSuccess = await waitForPageLoad(5000);
          if (!pageLoadSuccess) { addResultLine(`Page ${pageCount}: Page load timeout`); break; }

          await new Promise(resolve => setTimeout(resolve, 800));
        }

        if (found) {
          if (isAsinMode) {
            showStatus(`Found FNSKU=ASIN match on page ${pageCount}!`, 'success');
          } else {
            showStatus(`Found MID match on page ${pageCount}!`, 'success');
          }
          displayResults(true, isAsinMode);
        } else {
          if (isAsinMode) {
            showStatus(`No FNSKU=ASIN matches found for "${searchMID}" across ${pageCount} pages.`, 'warning');
            addResultLine(`Search completed - no matching FNSKU/ASIN found across ${pageCount} pages.`);
          } else {
            showStatus(`No MID matches found for "${searchMID}" across ${pageCount} pages.`, 'warning');
            addResultLine(`Search completed - no MID matches found across ${pageCount} pages.`);
          }
        }

        if (pageCount >= maxPages) {
          showStatus(`Search stopped at ${maxPages} page limit.`, 'warning');
        }

      } catch (error) {
        console.error('FNSKU MID Search: Error during search:', error);
        showStatus('Error occurred during search.', 'error');
        addResultLine(`Error: ${error.message}`);
      } finally {
        isSearching = false;
        button.disabled = false;
        button.textContent = 'Search All Pages';
      }
    }

    function searchCurrentPage(searchMIDLower, pageNumber) {
      const results = [];
      const tables = document.querySelectorAll('table');

      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach((row, rowIndex) => {
          if (rowIndex === 0) return;

          const cells = row.querySelectorAll('td');
          const fnsku = cells[2]?.textContent?.trim() || '';
          const asin = cells[3]?.textContent?.trim() || '';
          const merchantId = cells[0]?.textContent?.trim() || '';
          const msku = cells[1]?.textContent?.trim() || '';
          const condition = cells[4]?.textContent?.trim() || '';
          const status = cells[5]?.textContent?.trim() || '';

          // For both modes, we first find rows with matching MID
          if (merchantId.toLowerCase().includes(searchMIDLower)) {
            results.push({
              element: row, page: pageNumber, row: rowIndex, mid: searchMIDLower,
              merchantId, msku, fnsku, asin, condition, status, fullText: row.textContent.trim()
            });
          }
        });
      });

      return results;
    }

    function displayResults(final = false, isAsinMode = true) {
      const resultsDiv = document.getElementById('search-results');
      if (!resultsDiv) return;

      let html = '';

      if (final && searchResults.length > 0) {
        if (isAsinMode) {
          const fnskuAsinMatch = searchResults.some(r => r.fnsku === r.asin);
          html += `<div class="mid-result-title" style="padding: 8px; margin: 8px; background: white; border-radius: 6px;">
            ASIN Mappings Results (${searchResults.length} matches${fnskuAsinMatch ? ' with' : ' without'} same FNSKU/ASIN):</div>`;
        } else {
          html += `<div class="mid-result-title" style="padding: 8px; margin: 8px; background: white; border-radius: 6px;">
            FNSKU Mappings Results (${searchResults.length} MID matches):</div>`;
        }
      }

      searchResults.forEach((result, index) => {
        const fnskuAsinMatch = result.fnsku === result.asin;

        let fnskuAsinDisplay = '';
        if (isAsinMode) {
          fnskuAsinDisplay = fnskuAsinMatch
            ? '<span style="color: green; font-weight: bold;">✓ FNSKU = ASIN</span>'
            : '<span style="color: orange;">✗ FNSKU ≠ ASIN</span>';
        }

        html += `
          <div class="mid-result-item">
            <div class="mid-result-title">Match ${index + 1} (Page ${result.page}) ${fnskuAsinDisplay}</div>
            <div class="mid-result-details">
              <strong>Merchant:</strong> ${result.merchantId}<br>
              <strong>MSKU:</strong> ${result.msku}<br>
              <strong>FNSKU:</strong> ${result.fnsku}<br>
              <strong>ASIN:</strong> ${result.asin}<br>
              <strong>Condition:</strong> ${result.condition}<br>
              <strong>Status:</strong> ${result.status}
            </div>
          </div>
        `;
      });

      if (html) {
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
      }
    }

    function scrollToElement(element) {
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.transition = 'background-color 0.5s';
        element.style.backgroundColor = '#ffff00';
        setTimeout(() => {
          element.style.backgroundColor = '';
          setTimeout(() => { element.style.backgroundColor = '#ffff00'; }, 500);
        }, 500);
      }
    }

    function highlightRow(row, searchTerm) {
      if (!row) return;
      row.style.cssText += `background-color: #ffff00 !important; border: 3px solid #ff6b6b !important; box-shadow: 0 0 10px rgba(255, 107, 107, 0.5) !important;`;
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
      line.className = 'mid-result-log';
      line.textContent = text;
      resultsDiv.appendChild(line);
      resultsDiv.style.display = 'block';
      resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }

    function showStatus(message, type = 'info') {
      const statusDiv = document.getElementById('search-status');
      if (!statusDiv) return;
      statusDiv.textContent = message;
      statusDiv.className = `mid-status ${type}`;
    }

    function findNextButton() {
      const selectors = [
        'button[aria-label*="next" i]:not([disabled])',
        'button[title*="next" i]:not([disabled])',
        'a[aria-label*="next" i]:not(.disabled)',
        'a[title*="next" i]:not(.disabled)',
        '.pagination button:not([disabled]):not(.current)',
        '.pagination a:not(.disabled):not(.active)'
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (el.offsetParent !== null && window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden') {
            return el;
          }
        }
      }

      const clickableElements = document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]');

      for (const el of clickableElements) {
        const text = (el.textContent || el.value || '').toLowerCase().trim();
        const nextWords = ['next', 'next page', '→', '>', 'continue', 'more'];

        if (nextWords.some(word => text.includes(word))) {
          if (!text.includes('previous') && !text.includes('back') && !text.includes('prev')) {
            if (!el.disabled && el.offsetParent !== null && window.getComputedStyle(el).display !== 'none' &&
                window.getComputedStyle(el).visibility !== 'hidden' && !el.classList.contains('disabled')) {
              return el;
            }
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
        let stableCount = 0;

        const checkInterval = setInterval(() => {
          attempts++;

          const currentRowCount = document.querySelectorAll('table tr').length;
          const hasContent = currentRowCount > 1;
          const noLoadingIndicator = !document.querySelector('.loading, .spinner, [aria-busy="true"], [aria-label*="loading" i]');

          if (currentRowCount === lastRowCount) {
            stableCount++;
          } else {
            stableCount = 0;
          }

          const contentStabilized = stableCount >= 3;

          if (hasContent && noLoadingIndicator && contentStabilized) {
            clearInterval(checkInterval);
            resolve(true);
            return;
          }

          if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            resolve(false);
            return;
          }

          lastRowCount = currentRowCount;
        }, 100);
      });
    }

    setTimeout(createFloatingButton, 2000);
    setTimeout(createFloatingButton, 5000);

    const observer = new MutationObserver(() => {
      if (!document.getElementById('fnsku-mid-search-btn')) createFloatingButton();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }


  /////////////////////////////////
  // 7) Open RCAI                //
  /////////////////////////////////

  if (isFeatureEnabled('openRCAI') && /paragon-.*\.amazon\.com\/ilac\/view-ilac-report/.test(location.href)) {

    function addRCAIButton() {
      const buttons = Array.from(document.querySelectorAll('button'));
      const copyShipmentBtn = buttons.find(btn => btn.textContent && btn.textContent.trim() === 'Copy Shipment ID');

      if (!copyShipmentBtn || document.getElementById('rcai-link-btn')) return;

      const rcaiBtn = document.createElement('button');
      rcaiBtn.id = 'rcai-link-btn';
      rcaiBtn.textContent = 'RCAI';
      rcaiBtn.className = copyShipmentBtn.className;
      rcaiBtn.style.cssText = copyShipmentBtn.style.cssText;
      rcaiBtn.style.marginLeft = '10px';

      rcaiBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const cells = document.querySelectorAll('td');
        let shipmentId = '';

        for (const cell of cells) {
          const matches = cell.textContent.match(/FBA[A-Z0-9]{9}/g) || [];
          for (const match of matches) {
            if (match.length === 12) {
              shipmentId = match;
              break;
            }
          }
          if (shipmentId) break;
        }

        if (shipmentId) {
          const rcaiUrl = `https://console.harmony.a2z.com/fba-mfi-rce/mfi-rca?shipmentId=${shipmentId}`;
          window.open(rcaiUrl, '_blank');
        } else {
          alert('Could not find valid shipment ID');
        }
      });

      copyShipmentBtn.parentNode.insertBefore(rcaiBtn, copyShipmentBtn.nextSibling);
    }

    const rcaiObserver = new MutationObserver((mutations, observer) => {
      if (!document.getElementById('rcai-link-btn')) addRCAIButton();
    });

    rcaiObserver.observe(document.body, { childList: true, subtree: true });

    setTimeout(addRCAIButton, 1000);
    setTimeout(addRCAIButton, 2000);
    setTimeout(addRCAIButton, 3000);
  }

    function ilacSanitizeHTML(html) {
        // Basic sanitization - remove script tags
        const temp = document.createElement('div');
        temp.textContent = ''; // Clear first
        temp.innerHTML = html;
        const scripts = temp.querySelectorAll('script, iframe, object, embed');
        scripts.forEach(function(s) { s.remove(); });
        return temp.innerHTML;
    }



    /////////////////////////////////
// 8) ILAC Auto Attach (FIXED) //
/////////////////////////////////

if (isFeatureEnabled('ilacAutoAttach') &&
    (/paragon-.*\.amazon\.com\/hz\/view-case\?caseId=/.test(location.href) ||
     /paragon-na\.amazon\.com\/hz\/case\?caseId=/.test(location.href))) {

  console.log('[ILAC] Module loaded - checking page...');

  let ILAC_CANCEL_ATTACHMENT = false;
  const ILAC_SESSION_KEY = 'ilac_attached_cases';

  function ilacGetSessionAttachedCases() {
    try {
      return JSON.parse(sessionStorage.getItem(ILAC_SESSION_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function ilacMarkCaseAsAttached(caseId) {
    const attached = ilacGetSessionAttachedCases();
    attached[caseId] = Date.now();
    sessionStorage.setItem(ILAC_SESSION_KEY, JSON.stringify(attached));
  }

  function ilacWasAttachedThisSession(caseId) {
    const attached = ilacGetSessionAttachedCases();
    return !!attached[caseId];
  }

  // Toast styles - matching toggle panel theme
  GM_addStyle(`
    #ilac-auto-attach-toasts {
  position: fixed;
  top: 10px;
  right: 20px;
  z-index: 99999;
  min-width: 380px;
  max-width: 450px;
}

    .ilac-toast {
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(102, 126, 234, 0.25);
      margin-bottom: 12px;
      overflow: hidden;
      animation: ilacSlideIn 0.3s ease-out;
      border: 1px solid #e1e5e9;
    }

    @keyframes ilacSlideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .ilac-toast-header {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
    .ilac-toast-header .icon {
      margin-right: 10px;
      font-size: 18px;
      filter: brightness(0) invert(1);
    }

    .ilac-toast-header .title {
      font-weight: 700;
      color: white;
      flex-grow: 1;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .ilac-toast-header .close-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      cursor: pointer;
      color: white;
      line-height: 1;
      transition: background 0.2s ease;
    }

    .ilac-toast-header .close-btn:hover {
      background: rgba(255,255,255,0.3);
    }

.ilac-toast-body {
  padding: 10px 14px;
  color: #2d3748;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #fafbfc;
  line-height: 1.4;
}

    .ilac-toast-footer {
      display: flex;
      justify-content: flex-end;
      padding: 12px 16px;
      background: white;
      border-top: 1px solid #e1e5e9;
      gap: 10px;
    }

    .ilac-cancel-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 0.2s ease;
    }

    .ilac-cancel-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .ilac-shipment-list {
      margin-top: 10px;
      padding: 12px;
      background: white;
      border-radius: 8px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      border: 1px solid #e1e5e9;
    }

    .ilac-shipment-item {
      padding: 6px 0;
      border-bottom: 1px solid #f0f0f0;
      color: #667eea;
      font-weight: 500;
    }

    .ilac-shipment-item:last-child {
      border-bottom: none;
    }

    /* Status indicator styles */
    .ilac-toast.success .ilac-toast-header {
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    }

    .ilac-toast.danger .ilac-toast-header {
      background: linear-gradient(135deg, #fc8181 0%, #e53e3e 100%);
    }

    .ilac-toast.warning .ilac-toast-header {
      background: linear-gradient(135deg, #f6ad55 0%, #dd6b20 100%);
    }

    .ilac-toast.info .ilac-toast-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    //* Status badge in body */
.ilac-status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  margin-right: 8px;
}

    .ilac-toast.success .ilac-status-badge {
      background: rgba(72, 187, 120, 0.15);
      color: #2f855a;
    }

    .ilac-toast.danger .ilac-status-badge {
      background: rgba(229, 62, 62, 0.15);
      color: #c53030;
    }

    .ilac-toast.warning .ilac-status-badge {
      background: rgba(221, 107, 32, 0.15);
      color: #c05621;
    }

    .ilac-toast.info .ilac-status-badge {
      background: rgba(102, 126, 234, 0.15);
      color: #5a67d8;
    }

    /* Shipment ID highlight */
    .ilac-shipment-id {
      font-family: 'Consolas', 'Monaco', monospace;
      background: rgba(102, 126, 234, 0.1);
      padding: 2px 8px;
      border-radius: 4px;
      color: #667eea;
      font-weight: 600;
    }

    /* Progress indicator */
    .ilac-progress {
      height: 3px;
      background: rgba(102, 126, 234, 0.2);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 12px;
    }

    .ilac-progress-bar {
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 2px;
      animation: ilacProgress 2s ease-in-out infinite;
    }

    @keyframes ilacProgress {
      0% { width: 0%; margin-left: 0%; }
      50% { width: 50%; margin-left: 25%; }
      100% { width: 0%; margin-left: 100%; }
    }
  `);

  function ilacCreateToastContainer() {
    if (!document.getElementById('ilac-auto-attach-toasts')) {
      const container = document.createElement('div');
      container.id = 'ilac-auto-attach-toasts';
      document.body.appendChild(container);
    }
  }

  function ilacCreateToast({ type, message, cancelBtn = false, autoDismiss = false, duration = 5000, showProgress = false }) {
    ilacCreateToastContainer();

    const titles = {
      success: 'Success',
      danger: 'Error',
      info: 'ILAC Auto Attach',
      warning: 'Warning'
    };

    const toastId = 'ilac-toast-' + Date.now();

    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `ilac-toast ${type}`;

    const progressHtml = showProgress ? '<div class="ilac-progress"><div class="ilac-progress-bar"></div></div>' : '';

    toast.innerHTML = `
      <div class="ilac-toast-header">
        <span class="title">${titles[type] || 'ILAC Auto Attach'}</span>
        <button class="close-btn" onclick="this.closest('.ilac-toast').remove()">&times;</button>
      </div>
      <div class="ilac-toast-body">
        ${message}
        ${progressHtml}
      </div>
      ${cancelBtn ? `
        <div class="ilac-toast-footer">
          <button class="ilac-cancel-btn" id="ilac-cancel-${toastId}">Cancel</button>
        </div>
      ` : ''}
    `;

    document.getElementById('ilac-auto-attach-toasts').appendChild(toast);

    if (cancelBtn) {
      const cancelButton = document.getElementById(`ilac-cancel-${toastId}`);
      if (cancelButton) {
        cancelButton.onclick = () => {
          ILAC_CANCEL_ATTACHMENT = true;
        };
      }
    }

    if (autoDismiss) {
      setTimeout(() => {
        const el = document.getElementById(toastId);
        if (el) {
          el.style.animation = 'ilacSlideIn 0.3s ease-out reverse';
          setTimeout(() => el.remove(), 280);
        }
      }, duration);
    }

    return toastId;
  }

  function ilacRemoveToasts() {
    const container = document.getElementById('ilac-auto-attach-toasts');
    if (container) container.innerHTML = '';
  }

  function ilacXhrPromise({ method, url, headers = {}, data }) {
    return new Promise((resolve, reject) => {
      const csrfToken = unsafeWindow?.csrfToken || window?.csrfToken;
      const tenantId = unsafeWindow?.tenantId || window?.tenantId;

      console.log('[ILAC] XHR Request:', method, url.split('?')[0]);

      GM_xmlhttpRequest({
        method: method,
        url: url,
        data: data,
        headers: {
          ...headers,
          "pgn-csrf-token": csrfToken,
          "case-tenant-id": tenantId
        },
        onload: (response) => {
          console.log('[ILAC] XHR Response status:', response.status);
          if (response.status >= 200 && response.status < 300) {
            resolve(response.responseText);
          } else {
            reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
          }
        },
        onerror: (error) => {
          console.error('[ILAC] XHR Error:', error);
          reject(error);
        }
      });
    });
  }

  async function ilacGetCaseHistory(caseId) {
    try {
      const response = await ilacXhrPromise({
        method: "GET",
        url: `https://paragon-na.amazon.com/hz/api/case/history/get?caseId=${caseId}`
      });
      const parsed = JSON.parse(response);
      console.log('[ILAC] Case history entries:', parsed?.entries?.length || 0);
      return parsed;
    } catch (e) {
      console.error("[ILAC] Failed to get case history:", e);
      return null;
    }
  }

  async function ilacGetCaseAttachments(caseId) {
    try {
      const response = await ilacXhrPromise({
        method: "GET",
        url: `https://paragon-na.amazon.com/hz/api/get-all-related-items?caseId=${caseId}`
      });
      const parsed = JSON.parse(response);
      console.log('[ILAC] Case attachments - Reports:', parsed?.Report?.length || 0);
      return parsed;
    } catch (e) {
      console.error("[ILAC] Failed to get case attachments:", e);
      return null;
    }
  }

    function ilacGetCurrentOwner() {
    console.log('[ILAC] Looking for case owner...');

    // Method 1: From deprecated_getViewCaseData (most reliable)
    try {
      const caseData = (unsafeWindow?.deprecated_getViewCaseData || window?.deprecated_getViewCaseData)?.();
      if (caseData?.caseDetails?.owner) {
        console.log('[ILAC] Found owner from caseDetails:', caseData.caseDetails.owner);
        return caseData.caseDetails.owner;
      }
    } catch (e) {
      console.log('[ILAC] Error getting owner from caseDetails:', e);
    }

    // Method 2: Try to get from DOM
    const ownerFromDOM = ilacGetCaseOwnerFromPage();
    if (ownerFromDOM) {
      return ownerFromDOM;
    }

    console.log('[ILAC] Could not determine owner');
    return null;
  }

  function ilacGetCaseOwnerFromPage() {
    console.log('[ILAC] Trying to get owner from DOM (fallback)...');

    const rows = document.querySelectorAll('kat-table-body kat-table-row');
    for (const row of rows) {
      const cells = row.querySelectorAll('kat-table-cell');
      if (cells.length >= 2) {
        const label = cells[0]?.textContent?.trim();
        if (label === 'Owner' || label === 'Case Owner') {
          const owner = cells[1]?.textContent?.trim();
          if (owner && owner.length > 0 && owner.length < 30) {
            console.log('[ILAC] Found owner from DOM (method 1):', owner);
            return owner;
          }
        }
      }
    }

    const allCells = document.querySelectorAll('kat-table-cell, td, th');
    for (let i = 0; i < allCells.length - 1; i++) {
      const text = allCells[i].textContent.trim();
      if (text === 'Owner' || text === 'Case Owner') {
        const nextCell = allCells[i + 1];
        const owner = nextCell?.textContent?.trim();
        if (owner && owner.length > 0 && owner.length < 30 && /^[a-z0-9_-]+$/i.test(owner)) {
          console.log('[ILAC] Found owner from DOM (method 2):', owner);
          return owner;
        }
      }
    }

    console.log('[ILAC] Could not find owner from DOM');
    return null;
  }



    function ilacGetCaseStatus() {
  console.log('[ILAC] Looking for case status...');

  // Method 1: From deprecated_getViewCaseData (most reliable)
  try {
    const caseData = (unsafeWindow?.deprecated_getViewCaseData || window?.deprecated_getViewCaseData)?.();
    if (caseData?.caseDetails?.status) {
      console.log('[ILAC] Found status from caseDetails:', caseData.caseDetails.status);
      return caseData.caseDetails.status;
    }
  } catch (e) {
    console.log('[ILAC] Error getting status from caseDetails:', e);
  }

  // Method 2: Try to get from DOM
  console.log('[ILAC] Trying to get status from DOM (fallback)...');

  const rows = document.querySelectorAll('kat-table-body kat-table-row');
  for (const row of rows) {
    const cells = row.querySelectorAll('kat-table-cell');
    if (cells.length >= 2) {
      const label = cells[0]?.textContent?.trim();
      if (label === 'Status' || label === 'Case Status') {
        const status = cells[1]?.textContent?.trim();
        if (status && status.length > 0) {
          console.log('[ILAC] Found status from DOM (method 1):', status);
          return status;
        }
      }
    }
  }

  // Method 3: Search all table cells
  const allCells = document.querySelectorAll('kat-table-cell, td, th');
  for (let i = 0; i < allCells.length - 1; i++) {
    const text = allCells[i].textContent.trim();
    if (text === 'Status' || text === 'Case Status') {
      const nextCell = allCells[i + 1];
      const status = nextCell?.textContent?.trim();
      if (status && status.length > 0 && status.length < 50) {
        console.log('[ILAC] Found status from DOM (method 2):', status);
        return status;
      }
    }
  }

  // Method 4: Look for status badge/pill elements
  const statusElements = document.querySelectorAll('[class*="status"], [class*="Status"], [data-status]');
  for (const el of statusElements) {
    const text = el.textContent?.trim();
    if (text && (text.toLowerCase().includes('work in progress') ||
                 text.toLowerCase().includes('pending') ||
                 text.toLowerCase().includes('resolved') ||
                 text.toLowerCase().includes('closed'))) {
      console.log('[ILAC] Found status from status element:', text);
      return text;
    }
  }

  console.log('[ILAC] Could not determine case status');
  return null;
}



function ilacIsValidCaseToAttachReport(userId, caseId, caseHistory, caseAttachments) {
  console.log('[ILAC] === VALIDATION START ===');
  console.log('[ILAC] User ID:', userId);
  console.log('[ILAC] Case ID:', caseId);

  // Check 0: Verify case status is "Work in Progress"
  const caseStatus = ilacGetCaseStatus();
  console.log('[ILAC] Case status:', caseStatus);

  if (!caseStatus) {
    console.log('[ILAC] ⚠️ Could not determine case status, proceeding with caution...');
  } else if (!caseStatus.toLowerCase().includes('work in progress')) {
    console.log('[ILAC] ❌ SKIP: Case status is not "Work in Progress"');
    console.log(`[ILAC]    Current status: "${caseStatus}"`);
    return false;
  } else {
    console.log('[ILAC] ✓ Case status is Work in Progress');
  }

  // Check 1: Already attached this browser session
  if (ilacWasAttachedThisSession(caseId)) {
    console.log('[ILAC] ❌ SKIP: Already attached in this browser session');
    return false;
  }

  const allReports = caseAttachments?.Report || [];
  const userReports = allReports.filter(r => r?.associatingAgent === userId);
  console.log('[ILAC] Total attachments:', allReports.length);
  console.log('[ILAC] User\'s attachments:', userReports.length);

  const hasNoPreviousAttachments = userReports.length === 0;

  // Check 2: Verify ownership
  let currentOwner = ilacGetCurrentOwner();

  if (!currentOwner) {
    currentOwner = ilacGetCaseOwnerFromPage();
  }

  console.log('[ILAC] Current owner determined:', currentOwner);
  console.log('[ILAC] Current user:', userId);

  if (currentOwner && currentOwner !== userId) {
    console.log('[ILAC] ❌ SKIP: User does not own case');
    console.log(`[ILAC]    Owner: "${currentOwner}", User: "${userId}"`);
    return false;
  }

  // Check 3: Verify user has activity if ownership unclear
  if (currentOwner === userId) {
    console.log('[ILAC] ✓ User owns the case');
  } else if (hasNoPreviousAttachments) {
    const userActivity = caseHistory?.entries?.filter(e => e?.updatedBy === userId) || [];
    console.log('[ILAC] User activity entries:', userActivity.length);

    if (userActivity.length > 0) {
      const recentActivity = userActivity[0];
      const activityAge = Date.now() - (recentActivity.updatingDate || 0);
      const oneHour = 60 * 60 * 1000;

      console.log('[ILAC] Most recent user activity:', recentActivity.operation);
      console.log('[ILAC] Activity age (minutes):', Math.round(activityAge / 60000));

      if (activityAge < oneHour) {
        console.log('[ILAC] ✓ User has recent activity on this case (within 1 hour)');
      } else {
        console.log('[ILAC] ⚠️ User has activity but it\'s old, proceeding anyway since no previous attachments');
      }
    } else {
      console.log('[ILAC] ❌ SKIP: No user activity found on this case');
      return false;
    }
  } else {
    console.log('[ILAC] ❌ SKIP: Could not verify ownership and user has previous attachments');
    return false;
  }

  // Check 4: No previous attachments - VALID
  if (hasNoPreviousAttachments) {
    console.log('[ILAC] ✅ VALID: No previous attachments by user');
    return true;
  }

  // Check 5: Has previous attachments - check if last one was today
  userReports.sort((a, b) => (b.associationDate || 0) - (a.associationDate || 0));
  const lastAttachmentDate = userReports[0]?.associationDate || 0;
  console.log('[ILAC] Last attachment date:', new Date(lastAttachmentDate).toISOString());

  // Get today's start (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  // Get the day of last attachment (midnight of that day)
  const lastAttachmentDay = new Date(lastAttachmentDate);
  lastAttachmentDay.setHours(0, 0, 0, 0);
  const lastAttachmentDayStart = lastAttachmentDay.getTime();

  console.log('[ILAC] Today start:', new Date(todayStart).toISOString());
  console.log('[ILAC] Last attachment day start:', new Date(lastAttachmentDayStart).toISOString());

  // If last attachment was NOT today, allow new attachment
  if (lastAttachmentDayStart < todayStart) {
    console.log('[ILAC] ✅ VALID: Last attachment was not today (previous day or earlier)');
    return true;
  }

  console.log('[ILAC] Last attachment was today, checking for ownership change...');

  // Check 6: Last attachment was today - check if ownership changed after last attachment
  let ownershipDate = 0;
  if (caseHistory && caseHistory.entries) {
    for (const entry of caseHistory.entries) {
      if (entry?.newState?.owner === userId ||
          entry?.owner === userId ||
          (entry?.updatedBy === userId && entry?.operation?.toLowerCase().includes('assign'))) {
        ownershipDate = entry.updatingDate || 0;
        console.log('[ILAC] Ownership/assignment date:', new Date(ownershipDate).toISOString());
        break;
      }
    }
  }

  if (ownershipDate === 0) {
    console.log('[ILAC] ⚠️ Could not find ownership timestamp');
    console.log('[ILAC] ❌ SKIP: Already attached today');
    return false;
  }

  if (ownershipDate > lastAttachmentDate) {
    console.log('[ILAC] ✅ VALID: Ownership is newer than last attachment (today)');
    return true;
  }

  console.log('[ILAC] ❌ SKIP: Already attached today since last ownership change');
  return false;
}



  function ilacIsValidShipmentId(id) {
    if (!id || typeof id !== 'string') return false;
    return /^FBA[A-Z0-9]{7,12}$/i.test(id);
  }

  function ilacGetAllShipmentIds() {
    console.log('[ILAC] Looking for all shipment IDs...');
    const foundIds = new Set();

    const ilacLinks = document.querySelectorAll('a[href*="view-ilac-report"]');
    console.log('[ILAC] Found ILAC links:', ilacLinks.length);

    ilacLinks.forEach((link, index) => {
      const href = link.href || '';
      console.log(`[ILAC] Link ${index} href:`, href);

      const urlMatch = href.match(/shipmentId=(FBA[A-Z0-9]{7,12})/i);
      if (urlMatch && urlMatch[1]) {
        console.log('[ILAC] Found from URL param:', urlMatch[1]);
        foundIds.add(urlMatch[1].toUpperCase());
      }

      const fbaMatches = href.match(/FBA[A-Z0-9]{7,12}/gi);
      if (fbaMatches) {
        fbaMatches.forEach(id => {
          if (ilacIsValidShipmentId(id)) {
            console.log('[ILAC] Found FBA pattern in URL:', id);
            foundIds.add(id.toUpperCase());
          }
        });
      }
    });

    const caseHeader = document.getElementById('caseHeaderComponent');
    if (caseHeader) {
      const headerText = caseHeader.textContent || caseHeader.innerText || '';
      const headerMatches = headerText.match(/FBA[A-Z0-9]{7,12}/gi);
      if (headerMatches) {
        headerMatches.forEach(id => {
          if (ilacIsValidShipmentId(id)) {
            console.log('[ILAC] Found in header:', id);
            foundIds.add(id.toUpperCase());
          }
        });
      }
    }

    const tableCells = document.querySelectorAll('kat-table-cell, td');
    tableCells.forEach(cell => {
      const text = cell.textContent || cell.innerText || '';
      const cellMatches = text.match(/FBA[A-Z0-9]{7,12}/gi);
      if (cellMatches) {
        cellMatches.forEach(id => {
          if (ilacIsValidShipmentId(id)) {
            foundIds.add(id.toUpperCase());
          }
        });
      }
    });

    if (foundIds.size === 0) {
      const pageText = document.body.innerText || document.body.textContent || '';
      const pageMatches = pageText.match(/FBA[A-Z0-9]{7,12}/gi);
      if (pageMatches) {
        pageMatches.forEach(id => {
          if (ilacIsValidShipmentId(id)) {
            foundIds.add(id.toUpperCase());
          }
        });
      }
    }

    const uniqueIds = Array.from(foundIds);
    console.log('[ILAC] All unique valid shipment IDs found:', uniqueIds);
    return uniqueIds;
  }

  function ilacGetShipmentId() {
    const allIds = ilacGetAllShipmentIds();

    if (allIds.length === 0) {
      console.log('[ILAC] ❌ No valid shipment IDs found on page');
      return { id: null, allIds: [], multipleFound: false };
    }

    if (allIds.length === 1) {
      console.log('[ILAC] ✓ Single shipment ID found:', allIds[0]);
      return { id: allIds[0], allIds: allIds, multipleFound: false };
    }

    console.log('[ILAC] ⚠️ Multiple different shipment IDs found:', allIds);
    return { id: allIds[0], allIds: allIds, multipleFound: true };
  }

  async function ilacGetReport(caseId, shipmentId) {
    console.log('[ILAC] Fetching ILAC report for shipment:', shipmentId);
    const url = `https://paragon-na.amazon.com/ilac/view-ilac-report?shipmentId=${shipmentId}&caseId=${caseId}&updatingSystem=paragon`;
    return await ilacXhrPromise({
      method: "GET",
      url: url
    });
  }

  function ilacSerializeParams(obj) {
    const params = new URLSearchParams();
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        params.append(key, obj[key]);
      }
    }
    return params.toString();
  }

  async function ilacAttachReport(caseId, shipmentId) {
    console.log('[ILAC] Starting attachment process for:', shipmentId);

    if (!ilacIsValidShipmentId(shipmentId)) {
      throw new Error(`Invalid shipment ID format: "${shipmentId}"`);
    }

    const ilacReportHtml = await ilacGetReport(caseId, shipmentId);
    console.log('[ILAC] Report HTML received, length:', ilacReportHtml?.length || 0);

    if (!ilacReportHtml || ilacReportHtml.length < 100) {
      throw new Error('Failed to fetch ILAC report - empty or too short response');
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = ilacReportHtml;

    const reportSnapshotEl = tempDiv.querySelector('#reportSnapshot');
    const reportSnapshot = reportSnapshotEl?.value || '';

    console.log('[ILAC] Report snapshot element found:', !!reportSnapshotEl);
    console.log('[ILAC] Report snapshot length:', reportSnapshot.length);

    if (!reportSnapshot || reportSnapshot.length === 0) {
      console.log('[ILAC] Report snapshot empty, trying alternatives...');

      const errorDiv = tempDiv.querySelector('.error, .alert, [class*="error"]');
      if (errorDiv) {
        const errorText = errorDiv.textContent || 'Unknown error in report';
        throw new Error(`ILAC Report error: ${errorText}`);
      }

      const inputElements = tempDiv.querySelectorAll('input[type="hidden"]');
      console.log('[ILAC] Hidden inputs found:', inputElements.length);
      inputElements.forEach((inp, i) => {
        console.log(`[ILAC] Input ${i}: id="${inp.id}", name="${inp.name}", value length=${inp.value?.length || 0}`);
      });

      throw new Error(`Could not extract report snapshot. The shipment ID "${shipmentId}" may be invalid or the report is not available.`);
    }

    const tenantId = unsafeWindow?.tenantId || window?.tenantId;

    const requestData = {
      "tenantId": tenantId,
      "caseId": caseId,
      "notes": "",
      "updatingSystem": "",
      "problemReceiveReport": "undefined",
      "reportSnapshot": reportSnapshot,
      "asinStatReport": '{"asinStatReport":[]}',
      "deliveryDate": "undefined",
      "jsonBolReport": "undefined"
    };

    const data = ilacSerializeParams(requestData);
    console.log('[ILAC] Sending attach request...');

    const response = await ilacXhrPromise({
      method: "POST",
      url: "https://paragon-na.amazon.com/ilac/attach-ilac-report",
      data: data,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    console.log('[ILAC] Attach response received, length:', response?.length || 0);

    try {
      const result = JSON.parse(response);
      console.log('[ILAC] Parsed response:', JSON.stringify(result).substring(0, 200));
      return result;
    } catch (e) {
      console.error('[ILAC] Failed to parse attach response:', e);
      console.log('[ILAC] Raw response:', response?.substring(0, 500));
      throw new Error('Invalid response from attach endpoint');
    }
  }

  // MAIN FUNCTION
  async function ilacAutoAttachMain() {
    console.log('[ILAC] Auto Attach Main started');

    let checkCount = 0;
    const maxChecks = 100;

    const loadInterval = setInterval(async () => {
      checkCount++;

      const caseId = unsafeWindow?.caseId || window?.caseId;
      const userId = unsafeWindow?.userDetails?.agentLogin || window?.userDetails?.agentLogin;

      if (checkCount % 20 === 0) {
        console.log(`[ILAC] Waiting for page data... (attempt ${checkCount})`);
      }

      if (checkCount >= maxChecks) {
        clearInterval(loadInterval);
        console.log('[ILAC] ❌ Timed out waiting for page data');
        return;
      }

      if (!caseId || !userId) return;

      clearInterval(loadInterval);
      console.log(`[ILAC] ✓ Page data loaded - Case: ${caseId}, User: ${userId}`);

      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        console.log('[ILAC] Fetching case history and attachments...');

        const [caseHistory, caseAttachments] = await Promise.all([
          ilacGetCaseHistory(caseId),
          ilacGetCaseAttachments(caseId)
        ]);

        if (!caseHistory) {
          console.log('[ILAC] ❌ Failed to fetch case history - aborting');
          return;
        }

        const isValid = ilacIsValidCaseToAttachReport(userId, caseId, caseHistory, caseAttachments);

        if (!isValid) {
          console.log('[ILAC] Case not eligible for auto-attach');
          return;
        }

        console.log('[ILAC] ✓ Case is valid for auto-attach, looking for shipment ID...');

        ilacCreateToast({
          type: "info",
          message: `Searching for ILAC Report... <span class="ilac-shipment-id">Case: ${caseId}</span>`,
          cancelBtn: true,
          showProgress: true
        });

        let attempts = 0;
        const maxAttempts = 40;

        const shipmentInterval = setInterval(async () => {
          attempts++;

          if (ILAC_CANCEL_ATTACHMENT) {
            clearInterval(shipmentInterval);
            ilacRemoveToasts();
            ilacCreateToast({
              type: "info",
              message: "Attachment cancelled by user",
              autoDismiss: true
            });
            ILAC_CANCEL_ATTACHMENT = false;
            return;
          }

          const shipmentResult = ilacGetShipmentId();

          if (shipmentResult.id || attempts >= maxAttempts) {
            clearInterval(shipmentInterval);

            if (!shipmentResult.id) {
              ilacRemoveToasts();
              console.log('[ILAC] ❌ No valid shipment ID found after', attempts, 'attempts');
              ilacCreateToast({
                type: "danger",
                message: `No valid shipment ID found on page.<br><br><em>Expected format: FBA + 7-12 characters</em>`,
                autoDismiss: true,
                duration: 7000
              });
              return;
            }

            if (shipmentResult.multipleFound) {
              ilacRemoveToasts();
              const idList = shipmentResult.allIds.map(id => `<div class="ilac-shipment-item">${id}</div>`).join('');
              console.log('[ILAC] ⚠️ Multiple shipment IDs found, showing warning');
              ilacCreateToast({
                type: "warning",
                message: `<strong>Multiple shipment IDs detected!</strong><br><br>
                         Attaching: <span class="ilac-shipment-id">${shipmentResult.id}</span><br><br>
                         All IDs found:<div class="ilac-shipment-list">${idList}</div>
                         <em style="font-size:12px; color:#666;">Cancel within 3 seconds if incorrect</em>`,
                cancelBtn: true,
                autoDismiss: false
              });

              await new Promise(resolve => setTimeout(resolve, 3000));

              if (ILAC_CANCEL_ATTACHMENT) {
                ilacRemoveToasts();
                ilacCreateToast({ type: "info", message: "Attachment cancelled by user", autoDismiss: true });
                ILAC_CANCEL_ATTACHMENT = false;
                return;
              }
            }

            const shipmentId = shipmentResult.id;
            console.log(`[ILAC] ✓ Using shipment ID: ${shipmentId}`);

            ilacRemoveToasts();
            ilacCreateToast({
              type: "info",
              message: `Attaching report for <span class="ilac-shipment-id">${shipmentId}</span>`,
              showProgress: true
            });

            try {
              const result = await ilacAttachReport(caseId, shipmentId);
              ilacRemoveToasts();

              const isSuccess = result?.results?.data?.success ||
                               result?.success ||
                               result?.status === 'success' ||
                               (result?.results?.data?.message && result.results.data.message.toLowerCase().includes('success'));

              if (isSuccess) {
                ilacMarkCaseAsAttached(caseId);
                console.log('[ILAC] ✅ Report attached successfully!');

                let successMsg = `<span class="ilac-status-badge">Attached</span> Report attached: <span class="ilac-shipment-id">${shipmentId}</span>`;

                if (shipmentResult.multipleFound) {
                    successMsg += ` <em style="font-size:11px; color:#666;">(${shipmentResult.allIds.length - 1} other ID(s) not attached)</em>`;
                }

                ilacCreateToast({
                  type: "success",
                  message: successMsg,
                  autoDismiss: true,
                  duration: 7000
                });
              } else {
                const errorMsg = result?.results?.data?.message ||
                                result?.message ||
                                result?.error ||
                                'Unknown error - check console';
                console.error('[ILAC] ❌ Attach failed:', errorMsg);
                console.error('[ILAC] Full result:', JSON.stringify(result, null, 2));
                ilacCreateToast({
                    type: "danger",
                    message: `<span class="ilac-status-badge">Failed</span> Could not attach <span class="ilac-shipment-id">${shipmentId}</span> - ${errorMsg}`,
                  autoDismiss: true,
                  duration: 7000
                });
              }
            } catch (e) {
              ilacRemoveToasts();
              console.error('[ILAC] ❌ Error during attach:', e);
              ilacCreateToast({
                type: "danger",
                message: `<span class="ilac-status-badge">Error</span> ${e.message}`,
                autoDismiss: true,
                duration: 7000
              });
            }
          }
        }, 500);

      } catch (e) {
        console.error('[ILAC] ❌ Main error:', e);
        ilacRemoveToasts();
        ilacCreateToast({
            type: "danger",
            message: `<span class="ilac-status-badge">Error</span> ${e.message}`,
        });
      }
    }, 50);
  }

  // Start
  ilacAutoAttachMain();
}

})();
