// ==UserScript==
// @name        Combined Productivity Scripts
// @namespace   http://tampermonkey.net/
// @version     4.1
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
        openRCAI: { name: "Open RCAI", default: true }
    };

  // Standard button style for all floating buttons
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
  // Add hover and active states for buttons
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
        <span class="toggle-title">Script Features</span>
        <button id="close-toggle-panel" class="close-btn">&times;</button>
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

  // Updated CSS for toggle panel
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

    // 2. RCAI Expand Findings - Updated Position and Color
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
                    // Look for Show Details button near this "Details of the Findings" text
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

            // Updated styling - positioned above RCAI Results and with Investigate button color
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
// 3) RCAI Results Popup - COMPLETE FIXED VERSION //
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
      height: 350px !important;
      max-height: 90vh !important;
      min-height: 200px !important;
      background: white !important;
      border: 2px solid #8b5cf6 !important;
      border-radius: 8px !important;
      box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2) !important;
      z-index: 10001 !important;
      overflow: hidden !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      resize: both !important;
      display: flex !important;
      flex-direction: column !important;
    }

    #rcai-popup.minimized {
      height: 45px !important;
      min-height: 45px !important;
      max-height: 45px !important;
      resize: none !important;
      overflow: hidden !important;
    }

    #rcai-popup::after {
      content: '' !important;
      position: absolute !important;
      bottom: 0 !important;
      right: 0 !important;
      width: 20px !important;
      height: 20px !important;
      background: linear-gradient(-45deg, transparent 0%, transparent 30%, #8b5cf6 30%, #8b5cf6 35%, transparent 35%, transparent 65%, #8b5cf6 65%, #8b5cf6 70%, transparent 70%) !important;
      cursor: se-resize !important;
      z-index: 10002 !important;
    }

    #rcai-popup.minimized::after {
      display: none !important;
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
      flex-shrink: 0 !important;
    }

    .rcai-header-left {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
    }

    .row-counter-header {
      background: rgba(255,255,255,0.2) !important;
      padding: 4px 8px !important;
      border-radius: 4px !important;
      font-size: 11px !important;
      color: white !important;
      border: 1px solid rgba(255,255,255,0.3) !important;
    }

    .rcai-controls {
      display: flex !important;
      gap: 6px !important;
    }

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

    .rcai-controls button:hover {
      background: rgba(255,255,255,0.3) !important;
    }

    .rcai-controls button:disabled {
      background: rgba(255,255,255,0.1) !important;
      cursor: not-allowed !important;
      opacity: 0.6 !important;
    }

    #rcai-scroll {
      flex: 1 !important;
      overflow: auto !important;
      padding: 8px !important;
      min-height: 0 !important;
      background: white !important;
      position: relative !important;
    }

    #rcai-popup.minimized #rcai-scroll {
      display: none !important;
    }

    #rcai-table {
      width: 100% !important;
      border-collapse: collapse !important;
      font-size: 12px !important;
      table-layout: fixed !important;
    }

    #rcai-table thead {
      position: sticky !important;
      top: 0 !important;
      z-index: 10 !important;
      background: white !important;
    }

    #rcai-table td, #rcai-table th {
      padding: 3px 5px !important;
      border: 1px solid #e5e7eb !important;
      background: white !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    #rcai-table td:nth-child(1), #rcai-table th:nth-child(1) {
      width: 30px !important;
      min-width: 30px !important;
      max-width: 30px !important;
    }

    #rcai-table td:nth-child(2), #rcai-table th:nth-child(2) {
      width: 90px !important;
      min-width: 90px !important;
      max-width: 90px !important;
    }

    #rcai-table td:nth-child(3), #rcai-table th:nth-child(3) {
      width: 70px !important;
      min-width: 70px !important;
      max-width: 70px !important;
    }

    #rcai-table td:nth-child(4), #rcai-table th:nth-child(4) {
      width: 150px !important;
      min-width: 150px !important;
    }

    #rcai-table td:nth-child(5), #rcai-table th:nth-child(5) {
      width: 45px !important;
      min-width: 45px !important;
      max-width: 45px !important;
    }

    #rcai-table td:nth-child(6), #rcai-table th:nth-child(6) {
      width: 60px !important;
      min-width: 60px !important;
      max-width: 60px !important;
    }

    #rcai-table td:nth-child(7), #rcai-table th:nth-child(7) {
      width: 45px !important;
      min-width: 55px !important;
      max-width: 55px !important;
    }

    #rcai-table td:nth-child(8), #rcai-table th:nth-child(8) {
      width: 45px !important;
      min-width: 45px !important;
      max-width: 45px !important;
    }

    #rcai-table td:nth-child(9), #rcai-table th:nth-child(9) {
      width: 45px !important;
      min-width: 45px !important;
      max-width: 45px !important;
    }

    #rcai-table td:nth-child(10), #rcai-table th:nth-child(10) {
      width: 200px !important;
      min-width: 200px !important;
    }

    #rcai-table td:nth-child(11), #rcai-table th:nth-child(11) {
      width: auto !important;
      min-width: 300px !important;
    }

    #rcai-table td:last-child, #rcai-table th:last-child {
      width: 25px !important;
      min-width: 25px !important;
      max-width: 25px !important;
      text-align: center !important;
    }

    #rcai-table input {
      width: 100% !important;
      padding: 3px 5px !important;
      border: none !important;
      font-size: 11px !important;
      outline: none !important;
      background: transparent !important;
      box-sizing: border-box !important;
    }

    #rcai-table input:focus {
      background: #f3f4f6 !important;
      border: 1px solid #8b5cf6 !important;
      border-radius: 2px !important;
    }

    #rcai-table thead tr {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9) !important;
    }

    #rcai-table thead input {
      font-weight: bold !important;
      color: #475569 !important;
      background: transparent !important;
    }

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

    .remove-btn:hover {
      background: #dc2626 !important;
    }
  `);

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
      if (nextIdx >= 0 && nextIdx < inputs.length) {
        inputs[nextIdx].focus();
      }
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
    hdr.forEach(h => {
      const th = document.createElement('th');
      const inp = document.createElement('input');
      inp.value = h;
      inp.readOnly = true;
      inp.style.fontWeight = 'bold';
      inp.style.background = 'transparent';
      th.appendChild(inp);
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
    if (!body) {
      console.error('RCAI Results: Table body not found');
      return;
    }

    const row = createRowElement(data);
    if (typeof position === 'number') {
      const ref = body.children[position] || null;
      body.insertBefore(row, ref);
    } else {
      body.appendChild(row);
    }
    updateRowNumbers();
  }

  function toggleMinimize() {
    const popup = document.getElementById('rcai-popup');
    const btn = document.getElementById('minimize-btn');
    const scrollArea = document.getElementById('rcai-scroll');

    if (popup.classList.contains('minimized')) {
      popup.classList.remove('minimized');
      popup.style.height = '350px';
      popup.style.minHeight = '200px';
      popup.style.maxHeight = '90vh';
      popup.style.resize = 'both';
      btn.textContent = '_';
      if (scrollArea) scrollArea.style.display = 'block';
    } else {
      popup.classList.add('minimized');
      popup.style.height = '45px';
      popup.style.minHeight = '45px';
      popup.style.maxHeight = '45px';
      popup.style.resize = 'none';
      btn.textContent = '□';
      if (scrollArea) scrollArea.style.display = 'none';
    }
  }

  function copyData() {
    const widths = [4,12,12,18,6,10,8,8,8,34,20];
    let out = 'RCAI RESULTS:\n';
    const hdr = ['#','FNSKU','DECISION','RC SUMMARY','DISC','FAULT','FOUND','DENY','RMS','BLURB','NOTES'];
    out += '|' + hdr.map((h,i) => h.padEnd(widths[i])).join('|') + '\n';
    let tF=0, tD=0, tR=0;
    document.querySelectorAll('#rcai-body tr').forEach(r => {
      const cells = Array.from(r.querySelectorAll('td')).slice(0,11);
      const vals = cells.map((cell,i) => {
        let v = cell.querySelector('input')?.value || '-';
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
    console.log('Starting autofillFromPage, append:', append);

    const codeRx = /^[A-Z0-9]{10}$/;
    const decRx = /^(DECLINE|APPROVE|PENDING|PARTIAL_DECLINE|PARTIAL|MANUAL)$/i;
    const coll = [];

    // Strategy 1: DOM Element scanning
    console.log('Strategy 1: DOM element scanning...');
    const elems = Array.from(document.querySelectorAll('body *'));
    let foundData = false;

    elems.forEach((el, i) => {
      const txt = (el.textContent || '').trim();
      if (!decRx.test(txt)) return;

      const decision = txt.toUpperCase().replace('PARTIAL_DECLINE', 'PARTIAL');
      const codes = [];

      // Look for shortage quantity
      let disc = '';
      for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
        const t = (elems[j].textContent || '').trim();
        if (t.toLowerCase().includes('shortage quantity')) {
          for (let k = j + 1; k <= Math.min(elems.length - 1, j + 5); k++) {
            const numText = (elems[k].textContent || '').trim();
            if (/^\d+$/.test(numText)) {
              disc = numText;
              console.log('Found shortage quantity:', disc, 'near element', k);
              break;
            }
          }
          if (disc) break;
        }
        if (j === i - 2 && !disc) {
          const fallbackText = t.trim();
          if (/^\d+$/.test(fallbackText)) {
            disc = fallbackText;
          }
        }
      }

      // Find FNSKU codes
      for (let j = i - 1; j >= Math.max(0, i - 15); j--) {
        const t = (elems[j].textContent || '').trim();
        if (codeRx.test(t)) codes.push(t);
      }

      // Get RC Summary
      const next = elems[i + 1]?.textContent?.trim() || '';
      const rcSummary = next.split(',').map(it =>
        it.replace(/\/\d+/g, '').trim() || it.split(' ')[0]
      ).join(', ');

      // Determine fault
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
        console.log('Added row:', codes[1], 'with shortage:', disc);
      }
    });

    // Strategy 2: Table-based extraction as fallback
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

    console.log('Total entries found:', coll.length);

    const uniqueData = [];
    const seenFNSKUs = new Set();
    coll.forEach(row => {
      if (!seenFNSKUs.has(row[0])) {
        seenFNSKUs.add(row[0]);
        uniqueData.push(row);
      }
    });

    console.log('Unique entries:', uniqueData.length);

    if (!append) {
      document.querySelectorAll('#rcai-body tr').forEach(r => r.remove());
    }

    uniqueData.forEach(r => addRow(r));
    updateRowNumbers();
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

    addHeaderRow();
    restoring = true;
    const ok = restorePopupState();
    restoring = false;
    if (!ok) autofillFromPage(false);
    if (!document.querySelector('#rcai-body tr')) addRow();
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
      btn.className = 'standard-floating-btn';
      btn.textContent = 'Extract Serenity IDs';
      btn.style.bottom = '20px';
      btn.style.right = '20px';
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
// 6) Check Mapping - IMPROVED UI //
/////////////////////////////////

if (isFeatureEnabled('filterAllMID') && location.href.startsWith('https://fba-fnsku-commingling-console-na.aka.amazon.com/')) {
    console.log('FNSKU MID Search: Initializing floating button...');

    let isSearching = false;
    let searchResults = [];

    // Add improved CSS styles for Check Mapping
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
            font-size: 16px;
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

    // Create floating button
    function createFloatingButton() {
        // Check if button already exists
        if (document.getElementById('fnsku-mid-search-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'fnsku-mid-search-btn';
        btn.textContent = 'MID Search';

        btn.className = 'standard-floating-btn';
        btn.style.bottom = '20px';
        btn.style.right = '20px';

        btn.addEventListener('click', showMidSearchPanel);
        document.body.appendChild(btn);

        console.log('FNSKU MID Search: Floating button created');
    }

    // Create search panel - IMPROVED VERSION
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
                <span class="mid-panel-title">MID Search Tool</span>
                <button class="mid-panel-close" id="close-mid-panel">&times;</button>
            </div>
            <div class="mid-panel-content">
                <div class="mid-input-group">
                    <label class="mid-input-label">Enter MID to Search:</label>
                    <input type="text" id="mid-search-input" class="mid-input-field" placeholder="Paste MID here..." />
                </div>
                <button id="start-mid-search" class="mid-search-btn">
                    Search All Pages
                </button>
                <div id="search-status" class="mid-status"></div>
                <div id="search-results" class="mid-results" style="display: none;"></div>
            </div>
        `;

        // Position panel
        Object.assign(panel.style, {
            bottom: '80px',
            right: '20px'
        });

        document.body.appendChild(panel);

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
        button.textContent = 'Searching...';
        results.innerHTML = '';
        results.style.display = 'none';
        searchResults = [];

        // Clear any previous highlights
        clearAllHighlights();

        try {
            let pageCount = 0;
            const maxPages = 200;
            const searchMIDLower = searchMID.toLowerCase();
            let found = false;

            showStatus('Searching pages...', 'info');

            while (pageCount < maxPages && !found) {
                pageCount++;
                button.textContent = `Page ${pageCount}`;

                // Search current page
                const pageResults = searchCurrentPage(searchMIDLower, pageCount);

                if (pageResults.length > 0) {
                    // Only take the first result
                    searchResults.push(pageResults[0]);

                    // Highlight only the first matching row
                    highlightRow(pageResults[0].element, pageResults[0].mid);

                    // Display result
                    displayResults();
                    addResultLine(`Page ${pageCount}: Found match! Stopping search.`);

                    found = true; // Stop searching
                    break;
                } else {
                    addResultLine(`Page ${pageCount}: No matches`);
                }

                if (!found) {
                    // Look for next button BEFORE trying to continue
                    const nextBtn = findNextButton();
                    if (!nextBtn) {
                        console.log('FNSKU MID Search: No next button found - reached end of results');
                        //addResultLine(`Page ${pageCount}: End of results (no next button)`);
                        //break; // Exit the loop immediately
                    }

                    // Click next and wait
                    nextBtn.click();

                    // Wait for page load and add timeout check
                    const pageLoadSuccess = await waitForPageLoad(5000);
                    if (!pageLoadSuccess) {
                        console.log('FNSKU MID Search: Page load timeout');
                        addResultLine(`Page ${pageCount}: Page load timeout`);
                        break;
                    }

                    await new Promise(resolve => setTimeout(resolve, 800));

                    // Double-check that we actually have new content after clicking next
                    const currentPageContent = document.body.innerText;

                    // If the page content seems unchanged or no new results, we might be stuck
                    if (currentPageContent.includes('no results') || currentPageContent.includes('no matches')) {
                        console.log('FNSKU MID Search: Detected end of results');
                        addResultLine(`Page ${pageCount}: No more results available`);
                        break;
                    }
                }
            }

            // Final results
            if (found) {
                showStatus(`Found match on page ${pageCount}!`, 'success');
                displayResults(true);
            } else {
                showStatus(`No matches found for "${searchMID}" across ${pageCount} pages.`, 'warning');
                addResultLine(`Search completed - no matches found across ${pageCount} pages.`);
            }

            if (pageCount >= maxPages) {
                showStatus(`Search stopped at ${maxPages} page limit.`, 'warning');
                addResultLine(`Reached maximum page limit of ${maxPages} pages.`);
            }

        } catch (error) {
            console.error('FNSKU MID Search: Error during search:', error);
            showStatus('Error occurred during search. Check console for details.', 'error');
            addResultLine(`Error: ${error.message}`);
        } finally {
            // Reset button
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

    // Display functions with improved styling
    function displayResults(final = false) {
        const resultsDiv = document.getElementById('search-results');
        if (!resultsDiv) return;

        let html = '';

        if (final && searchResults.length > 0) {
            html += `<div class="mid-result-title" style="padding: 8px; margin: 8px; background: white; border-radius: 6px;">
                Search Results (${searchResults.length} matches with same FNSKU/ASIN):</div>`;
        }

        searchResults.forEach((result, index) => {
            html += `
                <div class="mid-result-item">
                    <div class="mid-result-title">Match ${index + 1} (Page ${result.page})</div>
                    <div class="mid-result-details">
                        <strong>Merchant:</strong> ${result.merchantId}<br>
                        <strong>MSKU:</strong> ${result.msku}<br>
                        <strong>FNSKU/ASIN:</strong> ${result.fnsku}<br>
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

    // Enhanced findNextButton function with better detection:
    function findNextButton() {
        // First try common pagination selectors
        const selectors = [
            'button[aria-label*="next" i]:not([disabled])',
            'button[title*="next" i]:not([disabled])',
            'a[aria-label*="next" i]:not(.disabled)',
            'a[title*="next" i]:not(.disabled)',
            '.pagination button:not([disabled]):not(.current)',
            '.pagination a:not(.disabled):not(.active)',
            '.pager button:not([disabled])',
            '.pager a:not(.disabled)'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                if (el.offsetParent !== null &&
                    window.getComputedStyle(el).display !== 'none' &&
                    window.getComputedStyle(el).visibility !== 'hidden') {
                    return el;
                }
            }
        }

        // Then try text-based search
        const clickableElements = document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]');

        for (const el of clickableElements) {
            const text = (el.textContent || el.value || '').toLowerCase().trim();
            const nextWords = ['next', 'next page', '→', '>', 'continue', 'more'];

            if (nextWords.some(word => text.includes(word))) {
                // Make sure it's not a "previous" or "back" button
                if (!text.includes('previous') && !text.includes('back') && !text.includes('prev')) {
                    // Check if element is actually clickable and visible
                    if (!el.disabled &&
                        el.offsetParent !== null &&
                        window.getComputedStyle(el).display !== 'none' &&
                        window.getComputedStyle(el).visibility !== 'hidden' &&
                        !el.classList.contains('disabled')) {

                        return el;
                    }
                }
            }
        }

        // No valid next button found
        return null;
    }

    // Enhanced waitForPageLoad function to return success indicator:
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

                // Check if content has stabilized
                if (currentRowCount === lastRowCount) {
                    stableCount++;
                } else {
                    stableCount = 0;
                }

                const contentStabilized = stableCount >= 3; // Content stable for 3 checks (300ms)

                if (hasContent && noLoadingIndicator && contentStabilized) {
                    clearInterval(checkInterval);
                    resolve(true); // Success
                    return;
                }

                if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    resolve(false); // Timeout
                    return;
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


/////////////////////////////////
// 7) Open RCAI                //
/////////////////////////////////

if (isFeatureEnabled('openRCAI') && /paragon-.*\.amazon\.com\/ilac\/view-ilac-report/.test(location.href)) {

    function addRCAIButton() {
        // Find the Copy Shipment ID button
        const buttons = Array.from(document.querySelectorAll('button'));
        const copyShipmentBtn = buttons.find(btn =>
            btn.textContent && btn.textContent.trim() === 'Copy Shipment ID'
        );

        if (!copyShipmentBtn || document.getElementById('rcai-link-btn')) {
            return;
        }

        const rcaiBtn = document.createElement('button');
        rcaiBtn.id = 'rcai-link-btn';
        rcaiBtn.textContent = 'RCAI';

        // Copy styles from the existing button
        rcaiBtn.className = copyShipmentBtn.className;
        rcaiBtn.style.cssText = copyShipmentBtn.style.cssText;
        rcaiBtn.style.marginLeft = '10px';

        rcaiBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Get all cells in the table
            const cells = document.querySelectorAll('td');
            let shipmentId = '';

            // Look for FBA pattern in cells
            for (const cell of cells) {
                // Look for FBA pattern with 9 characters after it
                const matches = cell.textContent.match(/FBA[A-Z0-9]{9}/g) || [];
                for (const match of matches) {
                    if (match.length === 12) { // FBA + 9 characters
                        shipmentId = match;
                        break;
                    }
                }
                if (shipmentId) break;
            }

            if (shipmentId) {
                console.log('Found shipment ID:', shipmentId);
                const rcaiUrl = `https://console.harmony.a2z.com/fba-mfi-rce/mfi-rca?shipmentId=${shipmentId}`;
                window.open(rcaiUrl, '_blank');
            } else {
                console.log('Could not find valid shipment ID');
                alert('Could not find valid shipment ID');
            }
        });

        copyShipmentBtn.parentNode.insertBefore(rcaiBtn, copyShipmentBtn.nextSibling);
        console.log('RCAI button added successfully');
    }

    // Add observer to handle dynamic content loading
    const rcaiObserver = new MutationObserver((mutations, observer) => {
        if (!document.getElementById('rcai-link-btn')) {
            addRCAIButton();
        }
    });

    rcaiObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial checks with increasing delays
    setTimeout(addRCAIButton, 1000);
    setTimeout(addRCAIButton, 2000);
    setTimeout(addRCAIButton, 3000);
}


})();
