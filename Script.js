// ==UserScript==
// @name        Combined Productivity Scripts
// @namespace   http://tampermonkey.net/
// @version     8.1.1
// @description Combines Hygiene Checks, RCAI Expand Findings, RCAI Results Popup, Serenity ID Extractor, SANTOS Checker, Check Mapping, Open RCAI and ILAC Auto Attach with Alt+X toggle panel
// @author      Abhinav
// @include     https://paragon-*.amazon.com/hz/view-case?caseId=*
// @include     https://paragon-na.amazon.com/hz/case?caseId=*
// @include     https://paragon-na.amazon.com/ilac/view-ilac-report?*
// @match       https://console.harmony.a2z.com/*
// @match       https://fba-registration-console-na.aka.amazon.com/*
// @match       https://moonraker-na.aka.amazon.com/serenity/open*
// @match       https://fba-fnsku-commingling-console-na.aka.amazon.com/*
// @match       https://console-na.seller-reimbursement.amazon.dev/*
// @match       https://console-eu.seller-reimbursement.amazon.dev/*
// @connect     paragon-na.amazon.com
// @connect     paragon-eu.amazon.com
// @require     https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.8/purify.min.js
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

    const $ = window.jQuery;
    const DOMPurify = window.DOMPurify;

  /////////////////////////////
  // Feature Toggle System   //
  /////////////////////////////

    const FEATURES = {
        hygieneChecks: { name: "Hygiene Checks", default: true },
        serenityExtractor: { name: "Serenity ID Extractor", default: true },
        filterAllMID: { name: "Check Mapping", default: true },
        checkMappingILAC: { name: "Check Mapping (ILAC)", default: true },
        ilacAutoAttach: { name: "ILAC Auto Attach", default: true },
        languageCheck: { name: "Language & Overage Check", default: true },
        rmsAutoAttach: { name: "RMS Auto Attach", default: true }
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
    if (!FEATURES[feature]) return true;
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

  if (isFeatureEnabled('hygieneChecks')) {

    const HC_ANNOTATION_KEY = 'hygieneAnnotationMap';
    const HC_SECTIONS = [
      {
        title: 'RC',
        questions: [
          'Are SANTOS and Amazon Distribution checked in Seller Central?',
          'Are all duplicate cases for the shipment thoroughly reviewed before proceeding to merge or transfer to ICON review?',
          'Is the RC selected for all units, including overage and manual investigation?'
        ]
      },
      {
        title: 'PSE',
        questions: [
          'Are additional shipments addressed, if any?',
          'Is the denial quantity mentioned in the final outbound verified as correct?',
          'Is the RMS being approved for the correct units?',
          'Are the Shipment ID and all ASINs confirmed as covered in the final outbound?',
          'Are two RMS IDs mentioned in the blurb and attached to the Paragon case?',
          'Is the pre approved edit added in pushback blurb for HI-ASP queue case?',
          'Is the outbound being sent in seller\'s latest communication language?'
        ]
      },
      {
        title: 'Hygiene',
        questions: [
          'Is the File Storage SIM attached (with RCAI results), if applicable?',
          'Are the Shipment ID, RMS ID, ILAC (twice) attached to the case?',
          'Is the RMS tool Max:0 error annotated?',
          'Are separate RMS IDs created for supported and unsupported FNSKUs?',
          'Are Beacon open events annotated for overages?',
          'Is the ILAC_stranded_inventory blurb included, if newly mapped units were recovered?',
          'Is corresponding BOO mentioned instead of different seller\'s X00 in substitution decline blurb?',
          'Is an Andon raised for Custom OB, if applicable?',
          'Is the source of the shipped date annotated in POO section of Beacon?',
          'Is the status of the created RMS confirmed?',
          'Is the RMS approval reason selected based on which root cause has the majority of units being approved RMS for?',
          'Is the reason code selected based on the majority of FNSKUs?'
        ]
      }
    ];

    function hcGetCaseIdFromUrl() {
      const match = location.href.match(/caseId=([^&]+)/);
      return match ? match[1] : null;
    }

    function hcGetAnnotationMap() {
      try {
        const map = GM_getValue(HC_ANNOTATION_KEY, '{}');
        return JSON.parse(map);
      } catch {
        return {};
      }
    }

    function hcSetAnnotationForCase(caseId, value) {
      const map = hcGetAnnotationMap();
      map[caseId] = { annotated: value, timestamp: Date.now() };
      GM_setValue(HC_ANNOTATION_KEY, JSON.stringify(map));
    }

    function hcIsCaseAnnotated(caseId) {
      if (!caseId) return false;
      const map = hcGetAnnotationMap();
      const entry = map[caseId];
      if (!entry) return false;
      return entry.annotated === true;
    }

    GM_addStyle(`
      #hc-checklist-form {
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        border: 1px solid #e1e5e9;
        overflow: hidden;
        margin-bottom: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: none;
      }

      #hc-checklist-form.visible {
        display: block;
      }

      .hc-form-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .hc-form-title {
        color: white;
        font-weight: 700;
        font-size: 15px;
      }

      .hc-form-body {
        padding: 14px;
        max-height: 60vh;
        overflow-y: auto;
      }

      .hc-section-title {
        font-size: 13px;
        font-weight: 700;
        color: #667eea;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 8px 0 6px 0;
        margin-top: 10px;
        border-bottom: 2px solid #667eea;
        margin-bottom: 8px;
      }

      .hc-section-title:first-child {
        margin-top: 0;
      }

      .hc-question {
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
      }

      .hc-question:last-child {
        border-bottom: none;
      }

      .hc-question-text {
        font-size: 12.5px;
        color: #2d3748;
        margin-bottom: 6px;
        line-height: 1.4;
      }

      .hc-question-number {
        font-weight: 700;
        color: #667eea;
        margin-right: 4px;
      }

      .hc-options {
        display: flex;
        gap: 16px;
        padding-left: 20px;
      }

      .hc-options label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #4a5568;
        cursor: pointer;
        user-select: none;
      }

      .hc-options input[type="radio"] {
        margin: 0;
        accent-color: #667eea;
        cursor: pointer;
      }

      .hc-form-footer {
        padding: 12px 14px;
        background: #fafbfc;
        border-top: 1px solid #e1e5e9;
        display: flex;
        justify-content: center;
      }

      #hc-annotate-btn {
        padding: 10px 32px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      #hc-annotate-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      #hc-annotate-btn:active {
        transform: translateY(0);
      }

      .hc-status-msg {
        text-align: center;
        padding: 8px;
        font-size: 12px;
        font-weight: 600;
        display: none;
      }

      .hc-status-msg.error {
        display: block;
        color: #e53e3e;
        background: #fef2f2;
        border-radius: 4px;
        margin: 0 14px 10px 14px;
      }

      .hc-status-msg.success {
        display: block;
        color: #166534;
        background: #dcfce7;
        border-radius: 4px;
        margin: 0 14px 10px 14px;
      }

      #hc-toggle-btn {
        display: block;
        width: 100%;
        padding: 10px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        margin-bottom: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      #hc-toggle-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      #hc-toggle-btn.annotated {
        background: linear-gradient(135deg, #48bb78, #38a169);
      }

      .hc-blocked-btn {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
        pointer-events: none !important;
      }

      .hc-block-prompt {
        display: block;
        font-size: 12px;
        color: #e53e3e;
        font-weight: 600;
        margin-top: 8px;
        padding: 6px 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: hcFadeIn 0.3s ease-out;
      }

      @keyframes hcFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .hc-annotated-badge {
        display: inline-block;
        padding: 3px 10px;
        background: linear-gradient(135deg, #48bb78, #38a169);
        color: white;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 700;
        margin-bottom: 8px;
      }
    `);

    // =============================================
    // PARAGON PAGE
    // =============================================

    if (/paragon-.*\.amazon\.com\/hz\/(view-case|case)\?caseId=/.test(location.href)) {

      const hcCaseId = hcGetCaseIdFromUrl();
      let hcFormVisible = false;

      function hcBuildFormHTML() {
        let questionIndex = 0;
        let html = '';

        HC_SECTIONS.forEach(section => {
          html += `<div class="hc-section-title">${section.title}</div>`;
          section.questions.forEach(q => {
            questionIndex++;
            html += `
              <div class="hc-question">
                <div class="hc-question-text">
                  <span class="hc-question-number">${questionIndex})</span> ${q}
                </div>
                <div class="hc-options">
                  <label><input type="radio" name="hc-q${questionIndex}" value="Yes"> Yes</label>
                  <label><input type="radio" name="hc-q${questionIndex}" value="No"> No</label>
                  <label><input type="radio" name="hc-q${questionIndex}" value="NA"> NA</label>
                </div>
              </div>
            `;
          });
        });

        return { html, totalQuestions: questionIndex };
      }

      function hcRemovePrompts() {
        document.querySelectorAll('.hc-block-prompt').forEach(p => p.remove());
      }

      function hcUnblockAllButtons() {
        document.querySelectorAll('.hc-blocked-btn').forEach(btn => {
          btn.classList.remove('hc-blocked-btn');
          btn.removeAttribute('data-hc-blocked');
        });
        hcRemovePrompts();
      }

      function hcFindAndBlockButtons() {
        if (hcIsCaseAnnotated(hcCaseId)) {
          hcUnblockAllButtons();
          return;
        }

        // Find the Review kat-button specifically
        const reviewKatBtn = document.querySelector('kat-button.transition-button[label="Review"]');
        if (reviewKatBtn) {
          // Block the inner <button> inside kat-button
          const innerBtn = reviewKatBtn.querySelector('button');
          if (innerBtn && !innerBtn.classList.contains('hc-blocked-btn')) {
            innerBtn.classList.add('hc-blocked-btn');
            innerBtn.setAttribute('data-hc-blocked', 'true');
          }
          // Also block the kat-button itself
          if (!reviewKatBtn.classList.contains('hc-blocked-btn')) {
            reviewKatBtn.classList.add('hc-blocked-btn');
            reviewKatBtn.setAttribute('data-hc-blocked', 'true');
          }

          // Add prompt after the button group div (once)
          if (!document.querySelector('.hc-block-prompt')) {
            const buttonGroup = reviewKatBtn.closest('.transition-button-group') || reviewKatBtn.parentElement;
            if (buttonGroup) {
              const prompt = document.createElement('div');
              prompt.className = 'hc-block-prompt';
              prompt.textContent = 'Complete the Hygiene Checks to proceed further';
              buttonGroup.insertAdjacentElement('afterend', prompt);
            }
          }
          return;
        }

        // Fallback: search all buttons by text
        document.querySelectorAll('button, kat-button').forEach(btn => {
          const text = (btn.textContent || btn.getAttribute('label') || '').replace(/\s+/g, ' ').trim().toLowerCase();
          if (text === 'review') {
            if (!btn.classList.contains('hc-blocked-btn')) {
              btn.classList.add('hc-blocked-btn');
              btn.setAttribute('data-hc-blocked', 'true');
            }
            // Also block inner button if kat-button
            const inner = btn.querySelector('button');
            if (inner && !inner.classList.contains('hc-blocked-btn')) {
              inner.classList.add('hc-blocked-btn');
              inner.setAttribute('data-hc-blocked', 'true');
            }
          }
        });

        // Add prompt once below the button area
        if (!document.querySelector('.hc-block-prompt')) {
          const blocked = document.querySelector('.hc-blocked-btn');
          if (blocked) {
            const container = blocked.closest('.transition-button-group') || blocked.closest('div') || blocked.parentElement;
            if (container) {
              const prompt = document.createElement('div');
              prompt.className = 'hc-block-prompt';
              prompt.textContent = 'Complete the Hygiene Checks to proceed further';
              container.insertAdjacentElement('afterend', prompt);
            }
          }
        }
      }

      function hcInjectSidebar() {
        const sidebar = document.querySelector('#page-sidebar');
        if (!sidebar || document.getElementById('hc-sidebar-container')) return;

        const container = document.createElement('div');
        container.id = 'hc-sidebar-container';
        container.style.cssText = 'width: 100%; padding: 0 10px; box-sizing: border-box; margin-top: 10px;';

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'hc-toggle-btn';

        if (hcIsCaseAnnotated(hcCaseId)) {
          toggleBtn.textContent = '✓ Checklist Completed';
          toggleBtn.classList.add('annotated');
        } else {
          toggleBtn.textContent = 'Hygiene Checks';
        }

        toggleBtn.addEventListener('click', () => {
          const form = document.getElementById('hc-checklist-form');
          if (!form) return;

          if (form.classList.contains('visible')) {
            form.classList.remove('visible');
            hcFormVisible = false;
            toggleBtn.textContent = hcIsCaseAnnotated(hcCaseId) ? '✓ Checklist Completed' : 'Hygiene Checks';
          } else {
            form.classList.add('visible');
            hcFormVisible = true;
            toggleBtn.textContent = 'Hide Checklist';
          }
        });

        const { html, totalQuestions } = hcBuildFormHTML();

        const form = document.createElement('div');
        form.id = 'hc-checklist-form';

        if (hcIsCaseAnnotated(hcCaseId)) {
          form.innerHTML = `
            <div class="hc-form-header">
              <span class="hc-form-title">ILAC Investigation Checklist</span>
            </div>
            <div class="hc-form-body" style="text-align: center; padding: 20px;">
              <div class="hc-annotated-badge">✓ Checklist Completed</div>
              <p style="font-size: 12px; color: #718096; margin-top: 8px;">This case has been annotated.</p>
            </div>
          `;
        } else {
          form.innerHTML = `
            <div class="hc-form-header">
              <span class="hc-form-title">ILAC Investigation Checklist</span>
            </div>
            <div class="hc-form-body">
              ${html}
            </div>
            <div id="hc-status" class="hc-status-msg"></div>
            <div class="hc-form-footer">
              <button id="hc-annotate-btn">Annotate</button>
            </div>
          `;
        }

        container.appendChild(toggleBtn);
        container.appendChild(form);

        sidebar.insertBefore(container, sidebar.firstChild);

        if (!hcIsCaseAnnotated(hcCaseId)) {
          const annotateBtn = document.getElementById('hc-annotate-btn');
          if (annotateBtn) {
            annotateBtn.addEventListener('click', () => {
              hcSubmitChecklist(totalQuestions);
            });
          }
        }
      }

      function hcSubmitChecklist(totalQuestions) {
        const statusEl = document.getElementById('hc-status');

        for (let i = 1; i <= totalQuestions; i++) {
          const selected = document.querySelector(`input[name="hc-q${i}"]:checked`);
          if (!selected) {
            if (statusEl) {
              statusEl.textContent = `Please answer all questions (question ${i} is unanswered)`;
              statusEl.className = 'hc-status-msg error';
            }
            const unansweredQ = document.querySelector(`input[name="hc-q${i}"]`);
            if (unansweredQ) {
              unansweredQ.closest('.hc-question')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
          }
        }

        let output = 'ILAC Investigation Checklist:\n\n';
        let questionIndex = 0;

        HC_SECTIONS.forEach(section => {
          output += `[${section.title}]\n`;
          section.questions.forEach(q => {
            questionIndex++;
            const sel = document.querySelector(`input[name="hc-q${questionIndex}"]:checked`);
            output += `${questionIndex}) ${q} — ${sel.value}\n`;
          });
          output += '\n';
        });

        navigator.clipboard.writeText(output).then(() => {
          const annotateKatBtn = document.querySelector('kat-button[label="Annotate"]');
          if (annotateKatBtn) {
            annotateKatBtn.click();
            setTimeout(() => {
              let area = document.getElementById('katal-id-17')
                      || document.querySelector('kat-textarea[label="Annotation"] textarea');
              const saveBtn = document.querySelector('kat-button[label="Save annotation"] button');
              if (area && saveBtn) {
                area.value = output;
                area.dispatchEvent(new Event('input', { bubbles: true }));
                saveBtn.click();

                hcSetAnnotationForCase(hcCaseId, true);
                hcUnblockAllButtons();

                const toggleBtn = document.getElementById('hc-toggle-btn');
                if (toggleBtn) {
                  toggleBtn.textContent = '✓ Checklist Completed';
                  toggleBtn.classList.add('annotated');
                }

                const form = document.getElementById('hc-checklist-form');
                if (form) {
                  form.innerHTML = `
                    <div class="hc-form-header">
                      <span class="hc-form-title">ILAC Investigation Checklist</span>
                    </div>
                    <div class="hc-form-body" style="text-align: center; padding: 20px;">
                      <div class="hc-annotated-badge">✓ Checklist Completed</div>
                      <p style="font-size: 12px; color: #718096; margin-top: 8px;">Annotation saved & copied to clipboard.</p>
                    </div>
                  `;
                }
              } else {
                hcSetAnnotationForCase(hcCaseId, true);
                hcUnblockAllButtons();

                const toggleBtn = document.getElementById('hc-toggle-btn');
                if (toggleBtn) {
                  toggleBtn.textContent = '✓ Checklist Completed';
                  toggleBtn.classList.add('annotated');
                }

                if (statusEl) {
                  statusEl.textContent = '✓ Copied to clipboard! (Annotate manually)';
                  statusEl.className = 'hc-status-msg success';
                }
              }
            }, 200);
          } else {
            hcSetAnnotationForCase(hcCaseId, true);
            hcUnblockAllButtons();

            const toggleBtn = document.getElementById('hc-toggle-btn');
            if (toggleBtn) {
              toggleBtn.textContent = '✓ Checklist Completed';
              toggleBtn.classList.add('annotated');
            }

            if (statusEl) {
              statusEl.textContent = '✓ Copied to clipboard! Annotate button not found.';
              statusEl.className = 'hc-status-msg success';
            }
          }
        }).catch(() => {
          if (statusEl) {
            statusEl.textContent = 'Failed to copy to clipboard';
            statusEl.className = 'hc-status-msg error';
          }
        });
      }

      document.addEventListener('keydown', event => {
        if (event.altKey && event.key.toLowerCase() === 'y' &&
            !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
          event.preventDefault();
          const toggleBtn = document.getElementById('hc-toggle-btn');
          if (toggleBtn) toggleBtn.click();
        }
      });

      setTimeout(() => {
        hcInjectSidebar();
        hcFindAndBlockButtons();
      }, 2000);

      const hcButtonObserver = new MutationObserver(() => {
        if (!hcIsCaseAnnotated(hcCaseId)) {
          hcFindAndBlockButtons();
        }
      });
      hcButtonObserver.observe(document.body, { childList: true, subtree: true });
    }

    // =============================================
    // BEACON 2.0 PAGE (Harmony)
    // =============================================

    if (/console\.harmony\.a2z\.com/.test(location.href)) {

      let hcBeaconBlocked = false;
      let hcBeaconCaseId = null;

      function hcGetCaseIdFromBeacon() {
        const urlMatch = location.href.match(/caseId=([^&]+)/);
        if (urlMatch) return urlMatch[1];

        const pageText = document.body.innerText || '';
        const caseMatch = pageText.match(/Case\s*(?:ID)?:?\s*(\d{10,})/i);
        if (caseMatch) return caseMatch[1];

        return null;
      }

      function hcUnblockBeaconButtons() {
        document.querySelectorAll('.hc-blocked-btn').forEach(btn => {
          btn.classList.remove('hc-blocked-btn');
          btn.removeAttribute('data-hc-blocked');
        });
        document.querySelectorAll('.hc-block-prompt').forEach(p => p.remove());
        hcBeaconBlocked = false;
      }

      function hcBlockBeaconButtons() {
        hcBeaconCaseId = hcGetCaseIdFromBeacon();

        if (!hcBeaconCaseId) return;

        if (hcIsCaseAnnotated(hcBeaconCaseId)) {
          hcUnblockBeaconButtons();
          return;
        }

        // Already blocked, don't re-process
        if (hcBeaconBlocked && document.querySelector('.hc-blocked-btn')) return;

        let foundBtn = null;

        // Strategy 1: Find by exact text "Submit BLURB"
        document.querySelectorAll('button, [role="button"]').forEach(btn => {
          const text = (btn.textContent || '').trim();
          if (text === 'Submit BLURB' || text === 'Submit Blurb' || text === 'submit blurb') {
            if (!btn.classList.contains('hc-blocked-btn')) {
              btn.classList.add('hc-blocked-btn');
              btn.setAttribute('data-hc-blocked', 'true');
              foundBtn = btn;
              hcBeaconBlocked = true;
            }
          }
        });

        // Strategy 2: Check kat-button elements
        if (!foundBtn) {
          document.querySelectorAll('kat-button').forEach(katBtn => {
            const label = (katBtn.getAttribute('label') || '').trim().toLowerCase();
            const text = (katBtn.textContent || '').trim().toLowerCase();
            if (label.includes('submit blurb') || text.includes('submit blurb')) {
              if (!katBtn.classList.contains('hc-blocked-btn')) {
                katBtn.classList.add('hc-blocked-btn');
                katBtn.setAttribute('data-hc-blocked', 'true');
                foundBtn = katBtn;
                hcBeaconBlocked = true;
              }
              const inner = katBtn.querySelector('button');
              if (inner && !inner.classList.contains('hc-blocked-btn')) {
                inner.classList.add('hc-blocked-btn');
                inner.setAttribute('data-hc-blocked', 'true');
              }
            }
          });
        }

        // Add one prompt below the button
        if (foundBtn && !document.querySelector('.hc-block-prompt')) {
          const container = foundBtn.closest('div') || foundBtn.parentElement;
          if (container) {
            const prompt = document.createElement('div');
            prompt.className = 'hc-block-prompt';
            prompt.textContent = 'Complete the Hygiene Checks to proceed further';
            // Try to place after the container, fallback to after the button itself
            try {
              container.insertAdjacentElement('afterend', prompt);
            } catch (e) {
              foundBtn.insertAdjacentElement('afterend', prompt);
            }
          }
        }
      }

      const hcBeaconObserver = new MutationObserver(() => {
        const caseId = hcGetCaseIdFromBeacon();
        if (caseId) {
          if (caseId !== hcBeaconCaseId) {
            hcUnblockBeaconButtons();
          }
          hcBlockBeaconButtons();
        }
      });

      setTimeout(() => {
        hcBlockBeaconButtons();
        hcBeaconObserver.observe(document.body, { childList: true, subtree: true });
      }, 3000);
    }

  } // end of isFeatureEnabled('hygieneChecks')



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

  let tF = 0, tD = 0, tR = 0;
  const rows = document.querySelectorAll('#rcai-body tr');
  let out = `RCAI RESULTS (${rows.length} FNSKUs):\n\n`;

  rows.forEach(r => {
    const cells = Array.from(r.querySelectorAll('td'));
    const get = (i) => cells[i]?.querySelector('input')?.value?.trim() || '-';

    const num = get(0);
    const fnsku = get(1);
    const decision = get(2);
    const rcSummary = get(3);
    const disc = get(4);
    const fault = get(5);
    const found = get(6);
    const deny = get(7);
    const rms = get(8);
    const blurb = get(9);
    const notes = get(10);

    tF += parseFloat(found) || 0;
    tD += parseFloat(deny) || 0;
    tR += parseFloat(rms) || 0;

    out += `${num}. ${fnsku} | ${decision} | ${rcSummary} | Disc: ${disc} | ${fault} | F:${found} D:${deny} R:${rms}`;

    if (includeBlurb && blurb && blurb !== '-') {
      out += `\n   Blurb: ${blurb}`;
    }
    if (includeNotes && notes && notes !== '-') {
      out += `\n   Notes: ${notes}`;
    }

    out += '\n';
  });

  out += `\nTOTALS: Found: ${tF} | Deny: ${tD} | RMS: ${tR}\n`;

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
  let extractedIds = '';
  let extractedResultsArray = []; // Array of [id, qty] pairs for batch processing
  let batchIndex = 0;
  const BATCH_QTY_LIMIT = 300;

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

    .serenity-btn-row {
      display: flex;
      gap: 8px;
      justify-content: center;
      flex-wrap: wrap;
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

    .serenity-copy-batch-btn {
      display: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 10px 24px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .serenity-copy-batch-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .serenity-copy-batch-btn:active {
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

  let extractedIds_stored = '';

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
            <div class="serenity-btn-row">
              <button class="serenity-copy-again-btn" id="serenity-copy-again-btn">📋 Copy All</button>
              <button class="serenity-copy-batch-btn" id="serenity-copy-batch-btn">📦 Copy in batches</button>
            </div>
            <span class="serenity-copy-feedback" id="serenity-copy-feedback">✓ Copied!</span>
          </div>
        </div>
      </div>
    `;

    Object.assign(panel.style, { bottom: '80px', right: '20px', position: 'fixed' });
    document.body.appendChild(panel);

    document.getElementById('close-serenity-panel').onclick = () => panel.remove();
    document.getElementById('start-serenity-extract').onclick = startExtraction;
    document.getElementById('serenity-copy-again-btn').onclick = copyAgain;
    document.getElementById('serenity-copy-batch-btn').onclick = copyNextBatch;

    const input = document.getElementById('serenity-date-input');
    input.focus();
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !isExtracting) startExtraction();
    });
  }

  function copyAgain() {
    if (extractedIds) {
      GM_setClipboard(extractedIds);
      showFeedback('✓ Copied all!');
    }
  }

  function copyNextBatch() {
    if (!extractedResultsArray.length) return;

    const batchIds = [];
    let batchQty = 0;

    while (batchIndex < extractedResultsArray.length) {
      const [id, qty] = extractedResultsArray[batchIndex];
      batchIds.push(id);
      batchQty += qty;
      batchIndex++;

      if (batchQty >= BATCH_QTY_LIMIT) break;
    }

    if (batchIds.length === 0) return;

    const batchStr = batchIds.join(',');
    GM_setClipboard(batchStr);

    showFeedback(`✓ Copied ${batchQty} events!`);

    const batchBtn = document.getElementById('serenity-copy-batch-btn');
    if (batchIndex >= extractedResultsArray.length) {
      // All batches done — reset
      batchIndex = 0;
      batchBtn.textContent = '📦 Copy in batches';
    } else {
      batchBtn.textContent = '📦 Copy next batch';
    }
  }

  function showFeedback(message) {
    const feedback = document.getElementById('serenity-copy-feedback');
    if (feedback) {
      feedback.textContent = message;
      feedback.classList.add('visible');
      setTimeout(() => {
        feedback.classList.remove('visible');
      }, 3000);
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
      copyAgainBtn.textContent = total >= 300 ? '📋 Copy All' : '📋 Copy Again';
    }

    // Show batch button only if total quantity > 300
    const batchBtn = document.getElementById('serenity-copy-batch-btn');
    if (batchBtn) {
      if (total > BATCH_QTY_LIMIT) {
        batchBtn.style.display = 'inline-block';
        batchBtn.textContent = '📦 Copy in batches';
      } else {
        batchBtn.style.display = 'none';
      }
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
    const batchBtn = document.getElementById('serenity-copy-batch-btn');
    if (batchBtn) {
      batchBtn.style.display = 'none';
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
    extractedIds = '';
    extractedResultsArray = [];
    batchIndex = 0;

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

    // Store for copy all
    extractedIds = ids;

    // Store as array for batch processing
    extractedResultsArray = Array.from(allResults.entries());
    batchIndex = 0;

    GM_setClipboard(ids);

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
  if (document.getElementById('santos-check-link')) return;

  const buttons = document.querySelectorAll('button, input[type="button"], a');
  let copyMIDButton = null;

  for (let btn of buttons) {
    if (btn.textContent && btn.textContent.trim() === 'Copy MID') {
      copyMIDButton = btn;
      break;
    }
  }

  if (!copyMIDButton) return;

  // Extract MID now so we can set a real href
  const pageText = document.body.innerText;
  const merchantMatch = pageText.match(/(?:Merchant[^\n]*?|Customer[^\n]*?ID:)\s*([A-Z0-9]+)\s*\(\s*(\d{7,15})\s*\)/i);
  let mid = null;

  if (merchantMatch && merchantMatch[2]) {
    mid = merchantMatch[2];
  } else {
    // Try from Copy MID button's parent
    const parentElement = copyMIDButton.closest('tr') || copyMIDButton.parentElement;
    if (parentElement) {
      const midMatch = parentElement.textContent.match(/\((\d{7,15})\)/);
      if (midMatch && midMatch[1]) mid = midMatch[1];
    }
  }

  const separator = document.createTextNode(' | ');

  const santosLink = document.createElement('a');
  santosLink.id = 'santos-check-link';
  santosLink.textContent = 'Check SANTOS';
  santosLink.style.cssText = 'color:#0066c0; text-decoration:none; cursor:pointer;';


        // Add hover effects matching other ILAC links
  santosLink.addEventListener('mouseenter', function() {
    santosLink.style.color = '#001F5C';
    santosLink.style.textDecoration = 'underline';
  });

  santosLink.addEventListener('mouseleave', function() {
    santosLink.style.color = '#0066c0';
    santosLink.style.textDecoration = 'none';
  });

  if (mid) {
    // Set real URL so middle-click and right-click work
    santosLink.href = `https://fba-registration-console-na.aka.amazon.com/merchants/${mid}`;
    santosLink.target = '_blank';
  } else {
    santosLink.href = '#';
  }

  // Left-click still uses our custom function
  santosLink.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    checkForSANTOS();
  });

  copyMIDButton.parentNode.insertBefore(santosLink, copyMIDButton);
  copyMIDButton.parentNode.insertBefore(separator, copyMIDButton);
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

          // Capture current content before clicking next
          const rowsBefore = document.querySelectorAll('table tr').length;
          const firstRowText = document.querySelector('table tr:nth-child(2)')?.textContent?.trim() || '';

          nextBtn.click();
          const pageLoadSuccess = await waitForPageLoad(3000);

          // Check if page actually changed after clicking next
          const rowsAfter = document.querySelectorAll('table tr').length;
          const firstRowTextAfter = document.querySelector('table tr:nth-child(2)')?.textContent?.trim() || '';

          if (!pageLoadSuccess || (rowsBefore === rowsAfter && firstRowText === firstRowTextAfter)) {
            addResultLine(`Page ${pageCount}: No more pages`);
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 300));
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

// eslint-disable-next-line no-undef
    const observer = new MutationObserver(() => {
        if (!document.getElementById('santos-check-link')) addSANTOSButton();
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
  } else if (!caseStatus.toLowerCase().replace(/-/g, ' ').includes('work in progress')) {
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


  ////////////////////////////////////////
  // 9) Language & Overage Check        //
  ////////////////////////////////////////

  if (isFeatureEnabled('languageCheck')) {

    // CJK, Arabic, Cyrillic, Thai, Hindi, Korean, Japanese — even 1 character is enough
    const NON_LATIN_REGEX = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0600-\u06ff\u0400-\u04ff\u0e00-\u0e7f\u0900-\u097f\u0980-\u09ff\u0a00-\u0a7f\u0b00-\u0b7f\u0c00-\u0c7f\u0d00-\u0d7f\u1100-\u11ff\u3130-\u318f\u3400-\u4dbf\uf900-\ufaff]/;

    // French multi-word phrases only — impossible to appear in English
    const FRENCH_WORDS_REGEX = /\b(s'il vous pla[iî]t|je suis|nous avons|vous avez|mon compte|cher vendeur|je voudrais|il y a|c'est|j'ai|n'est pas|n'a pas|n'ai pas|je ne|nous ne|vous ne|qu'est-ce|est-ce que|merci beaucoup|merci pour|bien cordialement|en attente|mise en vente|en rupture|pas encore|d[ée]j[àa] fait)\b/i;

    // French accented characters — require 5+ to avoid false positives
    const FRENCH_ACCENT_REGEX = /([àâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ].*){5,}/;

    function langGetCaseIdFromUrl() {
      const match = location.href.match(/caseId=([^&]+)/);
      return match ? match[1] : null;
    }

    function langStoreFlags(caseId, nonEnglish, overage) {
      if (!caseId) return;
      const allFlags = JSON.parse(GM_getValue('langCheckFlags', '{}'));
      allFlags[caseId] = {
        nonEnglish: nonEnglish,
        overage: overage,
        timestamp: Date.now()
      };
      GM_setValue('langCheckFlags', JSON.stringify(allFlags));
    }

    function langGetFlags(caseId) {
      if (!caseId) return { nonEnglish: false, overage: false };
      try {
        const allFlags = JSON.parse(GM_getValue('langCheckFlags', '{}'));
        const data = allFlags[caseId];
        if (!data) return { nonEnglish: false, overage: false };
        if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
          delete allFlags[caseId];
          GM_setValue('langCheckFlags', JSON.stringify(allFlags));
          return { nonEnglish: false, overage: false };
        }
        return { nonEnglish: data.nonEnglish || false, overage: data.overage || false };
      } catch {
        return { nonEnglish: false, overage: false };
      }
    }

    function langScanForNonEnglish() {
      const selectors = [
        '[data-paragon-widget-id="initial-contact"]',
        '[data-paragon-widget-id="correspondence-case-section"]'
      ];

      for (const sel of selectors) {
        const elements = document.querySelectorAll(sel);
        for (const el of elements) {
          const text = el.innerText || '';

          // Check 1: Any CJK, Arabic, Cyrillic, etc. character
          if (NON_LATIN_REGEX.test(text)) {
            console.log('[LangCheck] Non-Latin character found in:', sel);
            return true;
          }

          // Check 2: Common French words
          if (FRENCH_WORDS_REGEX.test(text)) {
            console.log('[LangCheck] French text detected in:', sel);
            return true;
          }

          // Check 3: Multiple French accented characters
          if (FRENCH_ACCENT_REGEX.test(text)) {
            console.log('[LangCheck] French accented text detected in:', sel);
            return true;
          }
        }
      }

      // Fallback: case header
      const header = document.getElementById('caseHeaderComponent');
      if (header) {
        const text = header.innerText || '';
        if (NON_LATIN_REGEX.test(text)) {
          console.log('[LangCheck] Non-Latin character found in case header');
          return true;
        }
        if (FRENCH_WORDS_REGEX.test(text)) {
          console.log('[LangCheck] French text found in case header');
          return true;
        }
        if (FRENCH_ACCENT_REGEX.test(text)) {
          console.log('[LangCheck] French accented text found in case header');
          return true;
        }
      }

      return false;
    }

    function langScanForOverage() {
      const text = document.body.innerText || '';
      const regex = /[\w\-:.]+,\s*(\d+)\s*,\s*please\s+investigate/gi;
      let match;

      while ((match = regex.exec(text)) !== null) {
        const num = parseInt(match[1], 10);
        if (num > 0) {
          console.log('[LangCheck] Overage found:', match[0]);
          return true;
        }
      }
      return false;
    }

    function langBuildAlertMessage(flags) {
      const messages = [];

      if (flags.nonEnglish) {
        messages.push('• Non-English text detected. Translate the blurb if required.');
      }
      if (flags.overage) {
        messages.push('• Perform Overage Investigation.');
      }

      if (messages.length === 0) return null;

      return '⚠️ Case Alerts:\n\n' + messages.join('\n\n');
    }

    function langShowAlert(flags) {
      const message = langBuildAlertMessage(flags);
      if (message) alert(message);
    }

    // ---- PARAGON PAGE: Scan + Store + Alert on Review ----
    if (/paragon-.*\.amazon\.com\/hz\/(view-case|case)\?caseId=/.test(location.href)) {

      const caseId = langGetCaseIdFromUrl();
      let detectedFlags = { nonEnglish: false, overage: false };
      let alertListenerAttached = false;

      function langCheckAndStore() {
        const nonEnglish = langScanForNonEnglish();
        const overage = langScanForOverage();
        langStoreFlags(caseId, nonEnglish, overage);
        return { nonEnglish, overage };
      }

      function langAttachReviewListener() {
        if (alertListenerAttached) return;
        if (!detectedFlags.nonEnglish && !detectedFlags.overage) return;

        alertListenerAttached = true;
        console.log('[LangCheck] Alerts active — NonEnglish:', detectedFlags.nonEnglish, 'Overage:', detectedFlags.overage);

        document.addEventListener('click', (e) => {
          const btn = e.target.closest('button, kat-button');
          if (!btn) return;

          const text = (btn.textContent || btn.getAttribute('label') || '').replace(/\s+/g, ' ').trim().toLowerCase();

          if (text === 'review') {
            langShowAlert(detectedFlags);
          }
        }, true);
      }

      setTimeout(() => {
        detectedFlags = langCheckAndStore();
        langAttachReviewListener();
      }, 3000);

      const langParagonObserver = new MutationObserver(() => {
        if (!detectedFlags.nonEnglish || !detectedFlags.overage) {
          detectedFlags = langCheckAndStore();
          langAttachReviewListener();
        }
      });
      langParagonObserver.observe(document.body, { childList: true, subtree: true });
    }

    // ---- BEACON 2.0 PAGE: Only read flag + Alert on Submit Blurb ----
    if (/console\.harmony\.a2z\.com\/beacon2\//.test(location.href)) {

      const caseId = langGetCaseIdFromUrl();
      let beaconAlertAttached = false;

      function langAttachBeaconListener() {
        if (beaconAlertAttached) return;

        const flags = langGetFlags(caseId);
        if (!flags.nonEnglish && !flags.overage) return;

        beaconAlertAttached = true;
        console.log('[LangCheck] Beacon alerts active for case ' + caseId + ' — NonEnglish:', flags.nonEnglish, 'Overage:', flags.overage);

        document.addEventListener('click', (e) => {
          const btn = e.target.closest('button, kat-button, [role="button"]');
          if (!btn) return;

          const text = (btn.textContent || btn.getAttribute('label') || '').replace(/\s+/g, ' ').trim().toLowerCase();

          if (text.includes('submit blurb')) {
            langShowAlert(flags);
          }
        }, true);
      }

      setTimeout(langAttachBeaconListener, 3000);

      const langBeaconObserver = new MutationObserver(langAttachBeaconListener);
      langBeaconObserver.observe(document.body, { childList: true, subtree: true });
    }
  }



  ////////////////////////////////////////
  // 10) RMS ID Auto Attach             //
  ////////////////////////////////////////

  if (isFeatureEnabled('rmsAutoAttach') &&
      /console-(na|eu)\.seller-reimbursement\.amazon\.dev/.test(location.href)) {

    var RMS_TOKEN;

    function rmsGetToken() {
      try {
        const region = window.location.href.match(/na|eu/)[0];
        GM_xmlhttpRequest({
          method: "GET",
          url: `https://paragon-${region}.amazon.com/hz/search`,
          onload: function(response) {
            if (!response.responseText.match(/csrfToken:\s"(\S*)"/)) {
              $('#paragon-status .message').text("Error").css('color', 'red');
              alert("RMS ID Auto Attach:\n\nIssue with Paragon detected. Try reloading Paragon and reload this page");
              return;
            }
            RMS_TOKEN = DOMPurify.sanitize(response.responseText.match(/csrfToken:\s"(\S*)"/)[1]);
            $('#paragon-status .message').text("Ready").css('color', 'green');
          },
          onerror: function(response) {
            $('#paragon-status .message').text("Error").css('color', 'red');
            alert("RMS ID Auto Attach:\n\nIssue with Paragon detected.\nTry reloading Paragon and reload this page to use RMS ID Auto Attach");
          }
        });
      } catch (error) {
        $('#paragon-status .message').text("Error").css('color', 'red');
        alert("RMS ID Auto Attach:\n\nIssue with Paragon detected.\nTry reloading Paragon and reload this page to use RMS ID Auto Attach");
      }
    }

    async function rmsGetTenantId(caseId, region) {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'POST',
          url: `https://paragon-${region}.amazon.com/hz/api/search`,
          headers: { "pgn-csrf-token": RMS_TOKEN, "Content-Type": "application/json;charset=UTF-8" },
          data: JSON.stringify({
            "query": `${caseId}`,
            "searchAllTenants": true,
            "contentTypes": [{ "contentType": "CASE", "pageSize": 100, "pageNum": 1, "sortField": "queue", "sortOrder": "desc" }]
          }),
          onload: function(response) {
            try {
              const results = JSON.parse(response.responseText)?.payload?.resultsByContentType?.CASE?.results;
              if (results) {
                const caseResults = results.filter(result => String(result.document.caseId) === String(caseId));
                const tenantId = DOMPurify.sanitize(caseResults?.[0]?.document?.tenantId);
                resolve(tenantId);
              } else {
                resolve(null);
              }
            } catch (error) {
              console.error("getTenantId Search Response Parsing Error!:\n", error);
              resolve(null);
            }
          },
          onerror: function(error) {
            console.error("getTenantId Error:\n", error);
            reject(error);
          }
        });
      });
    }

    function rmsAttachToCaseRecursive(rmsId, caseId, tenantId, merchId, region, start, stop) {
      try {
        GM_xmlhttpRequest({
          method: 'POST',
          url: `https://paragon-${region}.amazon.com/hz/action/update-related-items`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', "pgn-csrf-token": RMS_TOKEN, "case-tenant-id": tenantId },
          data: `updateAction=add&srcId=${caseId}&srcType=Case&dstIds=${rmsId}&dstType=RMSID&merchantId=${merchId}`,
          onload: function(response) {
            if (start <= stop) {
              if (response.status === 200) {
                const res = JSON.parse(response.responseText);
                if (res?.results?.data?.success) {
                  rmsVerifyAttachedListRecursive(rmsId, caseId, tenantId, merchId, region, start, stop);
                } else {
                  rmsAttachToCaseRecursive(rmsId, caseId, tenantId, merchId, region, start + 1, stop);
                }
              } else {
                rmsAttachToCaseRecursive(rmsId, caseId, tenantId, merchId, region, start + 1, stop);
              }
            } else {
              rmsUpdateFailedHTML(rmsId, caseId, region);
            }
          },
          onerror: function(response) {
            rmsUpdateFailedHTML(rmsId, caseId, region);
            $('#attach-status .message').text("Error").css('color', 'red');
          }
        });
      } catch (e) {
        rmsUpdateFailedHTML(rmsId, caseId, region);
        $('#paragon-status .message').text("Error").css('color', 'red');
      }
    }

    function rmsVerifyAttachedListRecursive(rmsId, caseId, tenantId, merchId, region, start, stop) {
      try {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `https://paragon-${region}.amazon.com/hz/api/get-all-related-items?caseId=${caseId}`,
          headers: { "pgn-csrf-token": RMS_TOKEN, "case-tenant-id": tenantId },
          onload: function(response) {
            if (response.status === 200) {
              const res = JSON.parse(response.responseText);
              const rmsIds = res?.RMSID;

              if (!rmsIds || !rmsIds.length) {
                if (start <= stop) {
                  rmsAttachToCaseRecursive(rmsId, caseId, tenantId, merchId, region, start + 1, stop);
                } else {
                  rmsUpdateFailedHTML(rmsId, caseId, region);
                }
                return;
              }

              for (let i = 0; i < rmsIds.length; i++) {
                if (rmsIds[i]?.id === rmsId) {
                  rmsUpdateSuccessHTML(rmsId, caseId, region);
                  return true;
                }
              }

              if (start <= stop) {
                rmsAttachToCaseRecursive(rmsId, caseId, tenantId, merchId, region, start + 1, stop);
              } else {
                rmsUpdateFailedHTML(rmsId, caseId, region);
              }
            } else {
              rmsAttachToCaseRecursive(rmsId, caseId, tenantId, merchId, region, start + 1, stop);
            }
          },
          onerror: function(response) {
            $('#attach-status .message').text("Error").css('color', 'red');
          }
        });
      } catch (error) {
        $('#paragon-status .message').text("Error").css('color', 'red');
      }
    }

    function rmsAddStatusHTML() {
      const html = `
        <div id="attach-status-section" style="position: absolute;margin: -40% 0px 0px 84%;border: solid 2px;height: 125px;width: 280px;font-size: 14px;font-weight: bold;">
          <h3 style="text-align: center;padding: 15px 0px 15px 0px;">RMS ID Auto Attach</h3>
          <div id="paragon-status" style="padding:0px 0px 12px 14px;">
            <text style="padding: 0px 10px 0px 38px;">Paragon Status:</text><text class="message">Loading...</text>
          </div>
          <div id="attach-status" style="padding:0px 0px 0px 12px;">
            <text style="padding-right: 10px;">RMS ID Attach Status:</text><text class="message" style="color:rgb(227, 179, 38)">Not Attached</text>
          </div>
        </div>`;

      $('#content').append(html);
      (RMS_TOKEN) ? $('#paragon-status .message').text("Ready").css('color', 'green') : $('#paragon-status .message').text("Error").css('color', 'red');
    }

    function rmsUpdateSuccessHTML(rmsId, caseId, region) {
      $('#attach-message').text(`Successfully attached RMS ID to Paragon Case ID!\n\nRMS ID: ${rmsId}\nParagon Case ID: ${caseId}\n\nThe Paragon Case ID page needs to reload to show the attachment\n`);
      $('#attach-message').append(`<a href="https://paragon-${region}.amazon.com/hz/case?caseId=${caseId}" target="_blank">https://paragon-${region}.amazon.com/hz/case?caseId=${caseId}</a>`);
      $('#attach-button').text("Successfully attached!");
      $('#attach-status .message').text("Attached").css('color', 'green');
    }

    function rmsUpdateFailedHTML(rmsId, caseId, region) {
      $('#attach-message').text(`RMS ID was unsuccessfully attached\n\nRMS ID: ${rmsId}\nParagon Case ID: ${caseId}\n\nPlease attach it manually at\n`);
      $('#attach-message').append(`<a href="https://paragon-${region}.amazon.com/hz/case?caseId=${caseId}" target="_blank">https://paragon-${region}.amazon.com/hz/case?caseId=${caseId}</a>`);
      $('#attach-button').text("Unsuccessfully attached!");
      $('#attach-status .message').text("Failed").css('color', 'red');
    }

    function rmsAddCreateButtonListener() {
      $("#single-rms-create").click(async function() {
        const region = window.location.href.match(/na|eu/)[0];
        const caseId = $('#caseId').val();
        const merchId = $('#merchantCustomerId').val();
        const tenantId = await rmsGetTenantId(caseId, region);

        const delayScript = setInterval(function() {
          if ($('a[href^="/rms/view/transaction/"]').length > 0) {
            clearInterval(delayScript);
            const rmsId = $('a[href^="/rms/view/transaction/"]').text();

            $('a[href^="/rms/view/transaction/"]').parent().after(`<br><p id="attach-message" style="white-space:pre-line;">Attaching RMS ID ${rmsId} to Paragon Case ID ${caseId}...</p>`);
            $('a[href^="/rms/view/transaction/"]').parent().parent().find('kat-button').text("Loading RMS ID Auto Attach...").attr("id", "attach-button");

            rmsAttachToCaseRecursive(rmsId, caseId, tenantId, merchId, region, 1, 10);
          }
        }, 25);
      });
    }

    // Initialize RMS Auto Attach
    rmsGetToken();
    const rmsLoadInterval = setInterval(function() {
      if ($('#single-rms-create').length > 0) {
        clearInterval(rmsLoadInterval);
        rmsAddStatusHTML();
        rmsAddCreateButtonListener();
      }
    }, 25);
  }



      ////////////////////////////////////////
  // 11) Check Mapping from ILAC        //
  ////////////////////////////////////////

  if (isFeatureEnabled('checkMappingILAC')) {

    const CM_STORAGE_KEY = 'checkMappingAutoFillParams';

    const CM_MARKETPLACE_MAP = {
        USD: 'ATVPDKIKX0DER',
        CAD: 'A2EUQ1WTGCTBG2',
        MXN: 'A1AM78C64UM0Y8'
    };

    function cmStoreParams(params) {
        GM_setValue(CM_STORAGE_KEY, JSON.stringify({
            ...params,
            timestamp: Date.now()
        }));
    }

    function cmGetParams() {
        try {
            const raw = GM_getValue(CM_STORAGE_KEY, '{}');
            const data = JSON.parse(raw);
            if (!data.timestamp || (Date.now() - data.timestamp > 120000)) {
                return null;
            }
            return data;
        } catch {
            return null;
        }
    }

    function cmClearParams() {
        GM_setValue(CM_STORAGE_KEY, '{}');
    }

    function cmSleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function cmSetNativeValue(element, value) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;

        if (element.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
            nativeTextAreaValueSetter.call(element, value);
        } else if (nativeInputValueSetter) {
            nativeInputValueSetter.call(element, value);
        } else {
            element.value = value;
        }

        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        element.dispatchEvent(new Event('keyup', { bubbles: true }));
    }

    function cmSetSelectValue(selectEl, value) {
        const options = Array.from(selectEl.options);
        const valueLower = value.toLowerCase();
        let found = false;

        for (const opt of options) {
            if (
                opt.value.toLowerCase().includes(valueLower) ||
                opt.textContent.toLowerCase().includes(valueLower)
            ) {
                selectEl.value = opt.value;
                found = true;
                break;
            }
        }

        if (found) {
            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            selectEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return found;
    }

    function cmSetCheckbox(checkbox, checked) {
        if (checkbox.checked !== checked) {
            checkbox.checked = checked;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            checkbox.dispatchEvent(new Event('click', { bubbles: true }));
            checkbox.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    function cmFindInputByLabel(labelText) {
        const labelLower = labelText.toLowerCase();

        const labels = document.querySelectorAll('label');
        for (const label of labels) {
            if (label.textContent.toLowerCase().includes(labelLower)) {
                const forId = label.getAttribute('for');
                if (forId) {
                    const input = document.getElementById(forId);
                    if (input) return input;
                }
                const input = label.querySelector('input, select, textarea');
                if (input) return input;

                const next = label.nextElementSibling;
                if (next && ['INPUT', 'SELECT', 'TEXTAREA'].includes(next.tagName)) {
                    return next;
                }
            }
        }

        const inputs = document.querySelectorAll('input, textarea');
        for (const input of inputs) {
            if (input.placeholder && input.placeholder.toLowerCase().includes(labelLower)) {
                return input;
            }
        }

        const allElements = document.querySelectorAll('td, th, div, span, p');
        for (const el of allElements) {
            const text = el.textContent.trim().toLowerCase();
            if (text === labelLower || (text.includes(labelLower) && text.length < labelLower.length + 20)) {
                const parent = el.closest('tr') || el.closest('div') || el.parentElement;
                if (parent) {
                    const input = parent.querySelector(
                        'input:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]), select, textarea'
                    );
                    if (input) return input;
                }
            }
        }

        const allInputs = document.querySelectorAll('input, select, textarea');
        for (const input of allInputs) {
            const name = (input.name || '').toLowerCase();
            const id = (input.id || '').toLowerCase();
            if (name.includes(labelLower) || id.includes(labelLower)) {
                return input;
            }
        }

        return null;
    }

    function cmFindCheckboxByLabel(labelText) {
        const labelLower = labelText.toLowerCase();

        const labels = document.querySelectorAll('label');
        for (const label of labels) {
            if (label.textContent.toLowerCase().includes(labelLower)) {
                const cb = label.querySelector('input[type="checkbox"]');
                if (cb) return cb;

                const forId = label.getAttribute('for');
                if (forId) {
                    const el = document.getElementById(forId);
                    if (el && el.type === 'checkbox') return el;
                }
            }
        }

        const allElements = document.querySelectorAll('td, th, div, span, p');
        for (const el of allElements) {
            const text = el.textContent.trim().toLowerCase();
            if (text.includes(labelLower) && text.length < labelLower.length + 30) {
                const parent = el.closest('tr') || el.closest('div') || el.parentElement;
                if (parent) {
                    const cb = parent.querySelector('input[type="checkbox"]');
                    if (cb) return cb;
                }
            }
        }

        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        for (const cb of checkboxes) {
            const name = (cb.name || '').toLowerCase();
            const id = (cb.id || '').toLowerCase();
            if (name.includes(labelLower) || id.includes(labelLower)) {
                return cb;
            }
        }

        return null;
    }

    function cmFindButtonByText(buttonText) {
        const textLower = buttonText.toLowerCase();
        const buttons = document.querySelectorAll(
            'button, input[type="submit"], input[type="button"], kat-button'
        );
        for (const btn of buttons) {
            const text = (btn.textContent || btn.value || btn.getAttribute('label') || '')
                .trim()
                .toLowerCase();
            if (text === textLower || text.includes(textLower)) {
                if (btn.offsetParent !== null || window.getComputedStyle(btn).display !== 'none') {
                    return btn;
                }
            }
        }
        return null;
    }

    function cmIsAsin(value) {
        return !value.toUpperCase().startsWith('X00');
    }

    function cmDetectCurrency() {
        const pageText = document.body.innerText || '';

        if (/\bCAD\b/.test(pageText)) return 'CAD';
        if (/\bMXN\b/.test(pageText)) return 'MXN';
        if (/\bUSD\b/.test(pageText)) return 'USD';

        if (/CA\s*\$|C\s*\$/.test(pageText)) return 'CAD';
        if (/MX\s*\$/.test(pageText)) return 'MXN';

        return 'USD';
    }

    function cmGetAllFormInputs() {
        const form = document.querySelector('form');
        if (form) {
            return Array.from(form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]), select, textarea'));
        }
        return Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]), select, textarea'));
    }

    function cmFindFormInputByNearbyText(searchText) {
        const searchLower = searchText.toLowerCase();

        const formDivs = document.querySelectorAll('form div, form tr, form td, form label, form span');
        for (const el of formDivs) {
            const directText = Array.from(el.childNodes)
                .filter(n => n.nodeType === Node.TEXT_NODE)
                .map(n => n.textContent.trim())
                .join(' ')
                .toLowerCase();

            if (directText.includes(searchLower)) {
                const parent = el.closest('div') || el.parentElement;
                if (parent) {
                    const input = parent.querySelector('input:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]), select, textarea');
                    if (input) return input;
                }
            }

            if (el.textContent.trim().toLowerCase() === searchLower ||
                (el.textContent.trim().toLowerCase().includes(searchLower) && el.textContent.trim().length < searchLower.length + 15)) {
                const parent = el.closest('div') || el.parentElement;
                if (parent) {
                    const input = parent.querySelector('input:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]), select, textarea');
                    if (input) return input;
                }
            }
        }

        return null;
    }

    // ================================================
    // PART A: ILAC Page — Input + Button beside Copy MID
    // ================================================

    if (/paragon-.*\.amazon\.com\/ilac\/view-ilac-report\?/.test(location.href)) {
        console.log('[CheckMapping] Running on ILAC page');

        GM_addStyle(`
            #cm-check-mapping-container {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                margin-left: 15px;
                vertical-align: middle;
            }

            #cm-fnsku-asin-input {
                padding: 5px 10px;
                border: 2px solid #e1e5e9;
                border-radius: 6px;
                font-size: 13px;
                width: 150px;
                outline: none;
                transition: border-color 0.2s ease;
                font-family: 'Consolas', 'Monaco', monospace;
            }

            #cm-fnsku-asin-input:focus {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            #cm-check-mapping-btn {
                padding: 5px 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }

            #cm-check-mapping-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }

            #cm-check-mapping-btn:active {
                transform: translateY(0);
            }

            #cm-status-msg {
                font-size: 11px;
                font-weight: 600;
                padding: 3px 8px;
                border-radius: 4px;
                display: none;
            }

            #cm-status-msg.error {
                display: inline;
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }

            #cm-status-msg.success {
                display: inline;
                background: #dcfce7;
                color: #166534;
                border: 1px solid #bbf7d0;
            }
        `);

        async function cmExtractMID() {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const copyMIDBtn = buttons.find(
                (btn) => btn.textContent && btn.textContent.trim() === 'Copy MID'
            );
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
            const merchantPattern =
                /(?:Merchant[^\n]*?|Customer[^\n]*?ID:)\s*([A-Z0-9]+)\s*\(\s*(\d{7,15})\s*\)/i;
            const merchantMatch = pageText.match(merchantPattern);
            if (merchantMatch && merchantMatch[2]) return merchantMatch[2];

            return null;
        }

        function cmShowStatus(message, type) {
            const el = document.getElementById('cm-status-msg');
            if (!el) return;
            el.textContent = message;
            el.className = type;
            if (type) {
                setTimeout(() => {
                    el.className = '';
                    el.style.display = 'none';
                }, 4000);
            }
        }

        function cmAddCheckMappingUI() {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const copyMIDBtn = buttons.find(
                (btn) => btn.textContent && btn.textContent.trim() === 'Copy MID'
            );
            if (!copyMIDBtn || document.getElementById('cm-check-mapping-container')) return;

            const currency = cmDetectCurrency();
            const marketplaceId = CM_MARKETPLACE_MAP[currency] || CM_MARKETPLACE_MAP['USD'];

            const container = document.createElement('span');
            container.id = 'cm-check-mapping-container';

            const input = document.createElement('input');
            input.id = 'cm-fnsku-asin-input';
            input.type = 'text';
            input.placeholder = 'FNSKU / ASIN';

            const btn = document.createElement('button');
            btn.id = 'cm-check-mapping-btn';
            btn.textContent = 'Check Mapping';

            const statusMsg = document.createElement('span');
            statusMsg.id = 'cm-status-msg';

            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const value = input.value.trim();
                if (!value) {
                    cmShowStatus('Enter FNSKU/ASIN', 'error');
                    input.focus();
                    return;
                }

                const mid = await cmExtractMID();
                if (!mid) {
                    cmShowStatus('Could not extract MID', 'error');
                    return;
                }

                const type = cmIsAsin(value) ? 'ASIN' : 'FNSKU';

                console.log(
                    `[CheckMapping] MID: ${mid}, Value: ${value}, Type: ${type}, Currency: ${currency}, Marketplace: ${marketplaceId}`
                );

                btn.textContent = 'Opening...';
                btn.style.pointerEvents = 'none';

                const params = {
                    mid: mid,
                    value: value.trim(),
                    type: type,
                    marketplaceId: marketplaceId,
                    currency: currency
                };

                cmStoreParams(params);

                if (type === 'ASIN') {
                    window.open(
                        'https://fba-fnsku-commingling-console-na.aka.amazon.com/tool/get-uncommingleable-reasons-tool',
                        '_blank'
                    );
                }

                window.open(
                    'https://fba-fnsku-commingling-console-na.aka.amazon.com/tool/fnsku-mappings-tool',
                    '_blank'
                );

                setTimeout(() => {
                    btn.textContent = '✓ Opened';
                    btn.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
                    cmShowStatus(`${type} → ${type === 'ASIN' ? '2 tabs' : '1 tab'} opened`, 'success');

                    setTimeout(() => {
                        btn.textContent = 'Check Mapping';
                        btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                        btn.style.pointerEvents = 'auto';
                    }, 2000);
                }, 300);
            });

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') btn.click();
            });

            container.appendChild(input);
            container.appendChild(btn);
            container.appendChild(statusMsg);

            if (copyMIDBtn.nextSibling) {
                copyMIDBtn.parentNode.insertBefore(container, copyMIDBtn.nextSibling);
            } else {
                copyMIDBtn.parentNode.appendChild(container);
            }

            console.log('[CheckMapping] ✓ UI added to ILAC page');
        }

        setTimeout(cmAddCheckMappingUI, 1000);
        setTimeout(cmAddCheckMappingUI, 3000);
        setTimeout(cmAddCheckMappingUI, 5000);

        const cmIlacObserver = new MutationObserver(cmAddCheckMappingUI);
        cmIlacObserver.observe(document.body, { childList: true, subtree: true });
    }

    // ======================================================
    // PART B: Uncommingleable Reasons Tool — Auto-fill
    // ======================================================

    if (
        location.href.includes(
            'fba-fnsku-commingling-console-na.aka.amazon.com/tool/get-uncommingleable-reasons-tool'
        )
    ) {
        console.log('[CheckMapping] Running on Uncommingleable Reasons page');

        GM_addStyle(`
            #cm-autofill-status {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 99999;
                background: white;
                border-radius: 10px;
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.25);
                overflow: hidden;
                border: 1px solid #e1e5e9;
                min-width: 300px;
                animation: cmSlideIn 0.3s ease-out;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            @keyframes cmSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            #cm-autofill-status .cm-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 10px 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            #cm-autofill-status .cm-header .cm-title {
                color: white;
                font-weight: 700;
                font-size: 14px;
            }

            #cm-autofill-status .cm-header .cm-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
            }

            #cm-autofill-status .cm-body {
                padding: 12px 14px;
                font-size: 13px;
                color: #2d3748;
                line-height: 1.6;
            }

            .cm-step {
                padding: 4px 0;
            }

            .cm-step.done::before {
                content: '✓ ';
                color: #48bb78;
                font-weight: bold;
            }

            .cm-step.fail::before {
                content: '✗ ';
                color: #e53e3e;
                font-weight: bold;
            }

            .cm-step.pending::before {
                content: '⏳ ';
            }
        `);

        function cmCreateStatusToast() {
            const existing = document.getElementById('cm-autofill-status');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.id = 'cm-autofill-status';
            toast.innerHTML = `
                <div class="cm-header">
                    <span class="cm-title">Check Mapping — Uncommingleable</span>
                    <button class="cm-close" onclick="this.closest('#cm-autofill-status').remove()">✕</button>
                </div>
                <div class="cm-body" id="cm-status-body">
                    <div class="cm-step pending" id="cm-step-mid">Fill Merchant ID</div>
                    <div class="cm-step pending" id="cm-step-asin">Fill ASIN</div>
                    <div class="cm-step pending" id="cm-step-market">Fill Marketplace ID</div>
                    <div class="cm-step pending" id="cm-step-submit">Click Submit</div>
                </div>
            `;
            document.body.appendChild(toast);
        }

        function cmUpdateStep(stepId, status) {
            const el = document.getElementById(stepId);
            if (el) el.className = `cm-step ${status}`;
        }

        function cmAutoDismissToast(delay = 5000) {
            setTimeout(() => {
                const toast = document.getElementById('cm-autofill-status');
                if (toast) {
                    toast.style.animation = 'cmSlideIn 0.3s ease-out reverse';
                    setTimeout(() => toast.remove(), 280);
                }
            }, delay);
        }

        async function cmAutoFillUncommingleable() {
            const params = cmGetParams();
            if (!params || params.type !== 'ASIN') {
                console.log('[CheckMapping] No ASIN params for uncommingleable page, skipping');
                return;
            }

            console.log('[CheckMapping] Auto-filling uncommingleable reasons:', params);
            cmCreateStatusToast();

            await cmSleep(2500);

            const form = document.querySelector('form');
            const formInputs = form
                ? Array.from(form.querySelectorAll('input[type="text"], input:not([type]), textarea')).filter(el => {
                    return el.offsetParent !== null && window.getComputedStyle(el).display !== 'none';
                })
                : [];

            console.log('[CheckMapping] Visible form inputs/textareas:', formInputs.length);

            let midInput = formInputs[0] || null;

            if (midInput) {
                cmSetNativeValue(midInput, params.mid);
                cmUpdateStep('cm-step-mid', 'done');
                console.log('[CheckMapping] ✓ Filled Merchant ID:', params.mid);
            } else {
                cmUpdateStep('cm-step-mid', 'fail');
                console.error('[CheckMapping] ✗ Could not find Merchant ID input');
            }

            await cmSleep(400);

            let marketInput = formInputs[1] || null;

            if (marketInput) {
                cmSetNativeValue(marketInput, params.marketplaceId);
                cmUpdateStep('cm-step-market', 'done');
                console.log('[CheckMapping] ✓ Filled Marketplace ID:', params.marketplaceId);
            } else {
                cmUpdateStep('cm-step-market', 'fail');
                console.error('[CheckMapping] ✗ Could not find Marketplace ID input');
            }

            await cmSleep(400);

            let asinInput = formInputs[2] || null;

            if (!asinInput) {
                asinInput = form ? form.querySelector('textarea') : document.querySelector('form textarea, textarea');
            }

            if (asinInput) {
                cmSetNativeValue(asinInput, params.value);
                cmUpdateStep('cm-step-asin', 'done');
                console.log('[CheckMapping] ✓ Filled ASIN:', params.value);
            } else {
                cmUpdateStep('cm-step-asin', 'fail');
                console.error('[CheckMapping] ✗ Could not find ASIN textarea');
            }

            await cmSleep(500);

            let submitBtn = null;

            if (form) {
                const formButtons = Array.from(form.querySelectorAll('button'));
                submitBtn = formButtons.find(b => b.textContent.trim().toLowerCase() === 'submit');

                if (!submitBtn) {
                    submitBtn = formButtons.find(b => {
                        const text = b.textContent.trim().toLowerCase();
                        return text !== 'clear' && text !== 'cancel' && text !== 'reset';
                    });
                }
            }

            if (!submitBtn) {
                try {
                    const xpathResult = document.evaluate(
                        '/html/body/div[1]/div/div[1]/div/form/div[4]/button[2]',
                        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
                    );
                    submitBtn = xpathResult.singleNodeValue;
                } catch (e) {
                    console.log('[CheckMapping] XPath failed:', e);
                }
            }

            if (!submitBtn) {
                submitBtn = cmFindButtonByText('Submit');
            }

            if (submitBtn) {
                submitBtn.click();
                cmUpdateStep('cm-step-submit', 'done');
                console.log('[CheckMapping] ✓ Clicked Submit');
            } else {
                cmUpdateStep('cm-step-submit', 'fail');
                console.error('[CheckMapping] ✗ Could not find Submit button');
            }

            cmAutoDismissToast(6000);
        }

        cmAutoFillUncommingleable();
    }

    // ======================================================
    // PART C: FNSKU Mappings Tool — Auto-fill + MID Search
    // ======================================================

    if (
        location.href.includes(
            'fba-fnsku-commingling-console-na.aka.amazon.com/tool/fnsku-mappings-tool'
        )
    ) {
        console.log('[CheckMapping] Running on FNSKU Mappings Tool page');

        GM_addStyle(`
            #cm-mapping-status {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 99999;
                background: white;
                border-radius: 10px;
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.25);
                overflow: hidden;
                border: 1px solid #e1e5e9;
                min-width: 320px;
                max-width: 420px;
                animation: cmSlideIn 0.3s ease-out;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            @keyframes cmSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            #cm-mapping-status .cm-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 10px 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            #cm-mapping-status .cm-header .cm-title {
                color: white;
                font-weight: 700;
                font-size: 14px;
            }

            #cm-mapping-status .cm-header .cm-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
            }

            #cm-mapping-status .cm-body {
                padding: 12px 14px;
                font-size: 13px;
                color: #2d3748;
                line-height: 1.6;
                max-height: 500px;
                overflow-y: auto;
            }

            .cm-step {
                padding: 4px 0;
            }

            .cm-step.done::before {
                content: '✓ ';
                color: #48bb78;
                font-weight: bold;
            }

            .cm-step.fail::before {
                content: '✗ ';
                color: #e53e3e;
                font-weight: bold;
            }

            .cm-step.pending::before {
                content: '⏳ ';
            }

            .cm-step.searching::before {
                content: '🔍 ';
            }

            .cm-divider {
                border-top: 1px solid #e1e5e9;
                margin: 8px 0;
            }

            .cm-result-item {
                padding: 8px;
                margin-top: 8px;
                background: #f8fafc;
                border-radius: 6px;
                border-left: 3px solid #667eea;
                font-size: 12px;
            }

            .cm-result-title {
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 4px;
            }

            .cm-result-details {
                color: #64748b;
                line-height: 1.4;
            }

            .cm-match-badge {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 700;
            }

            .cm-match-badge.found {
                background: #dcfce7;
                color: #166534;
            }

            .cm-match-badge.not-found {
                background: #fef2f2;
                color: #dc2626;
            }

            .cm-search-log {
                padding: 3px 0;
                font-size: 11px;
                color: #6b7280;
                border-bottom: 1px solid #f1f5f9;
            }

            .cm-search-log:last-child {
                border-bottom: none;
            }

            .cm-highlight-row {
                background-color: #ffff00 !important;
                border: 3px solid #ff6b6b !important;
                box-shadow: 0 0 10px rgba(255, 107, 107, 0.5) !important;
            }
        `);

        function cmCreateMappingStatusToast() {
            const existing = document.getElementById('cm-mapping-status');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.id = 'cm-mapping-status';
            toast.innerHTML = `
                <div class="cm-header">
                    <span class="cm-title">Check Mapping — Mappings Tool</span>
                    <button class="cm-close" onclick="this.closest('#cm-mapping-status').remove()">✕</button>
                </div>
                <div class="cm-body" id="cm-mapping-body">
                    <div class="cm-step pending" id="cm-step-type">Select Mapping Type</div>
                    <div class="cm-step pending" id="cm-step-value">Fill ASIN / FNSKU</div>
                    <div class="cm-step pending" id="cm-step-inactive">Set Include Inactive</div>
                    <div class="cm-step pending" id="cm-step-internal">Set Include Internal Merchants</div>
                    <div class="cm-step pending" id="cm-step-get">Click Get</div>
                    <div class="cm-divider"></div>
                    <div class="cm-step pending" id="cm-step-search">MID Search</div>
                    <div id="cm-search-results"></div>
                </div>
            `;
            document.body.appendChild(toast);
        }

        function cmMappingUpdateStep(stepId, status, extraText) {
            const el = document.getElementById(stepId);
            if (!el) return;
            if (extraText) {
                el.textContent = extraText;
            }
            el.className = `cm-step ${status}`;
        }

        function cmAddSearchLog(text) {
            const resultsDiv = document.getElementById('cm-search-results');
            if (!resultsDiv) return;
            const line = document.createElement('div');
            line.className = 'cm-search-log';
            line.textContent = text;
            resultsDiv.appendChild(line);
            resultsDiv.scrollTop = resultsDiv.scrollHeight;
        }

        function cmAddSearchResult(result, index, isAsinMode) {
            const resultsDiv = document.getElementById('cm-search-results');
            if (!resultsDiv) return;

            const fnskuAsinMatch = result.fnsku === result.asin;
            let badge = '';
            if (isAsinMode) {
                badge = fnskuAsinMatch
                    ? '<span class="cm-match-badge found">FNSKU = ASIN</span>'
                    : '<span class="cm-match-badge not-found">FNSKU ≠ ASIN</span>';
            }

            const item = document.createElement('div');
            item.className = 'cm-result-item';
            item.innerHTML = `
                <div class="cm-result-title">Match ${index + 1} (Page ${result.page}) ${badge}</div>
                <div class="cm-result-details">
                    <strong>Merchant:</strong> ${result.merchantId}<br>
                    <strong>MSKU:</strong> ${result.msku}<br>
                    <strong>FNSKU:</strong> ${result.fnsku}<br>
                    <strong>ASIN:</strong> ${result.asin}<br>
                    <strong>Condition:</strong> ${result.condition}<br>
                    <strong>Status:</strong> ${result.status}
                </div>
            `;
            resultsDiv.appendChild(item);
        }

        function cmSearchCurrentPage(searchMIDLower) {
            const results = [];
            const tables = document.querySelectorAll('table');

            tables.forEach((table) => {
                const rows = table.querySelectorAll('tr');
                rows.forEach((row, rowIndex) => {
                    if (rowIndex === 0) return;

                    const cells = row.querySelectorAll('td');
                    if (cells.length < 4) return;

                    const merchantId = cells[0]?.textContent?.trim() || '';
                    const msku = cells[1]?.textContent?.trim() || '';
                    const fnsku = cells[2]?.textContent?.trim() || '';
                    const asin = cells[3]?.textContent?.trim() || '';
                    const condition = cells[4]?.textContent?.trim() || '';
                    const status = cells[5]?.textContent?.trim() || '';

                    if (merchantId.toLowerCase().includes(searchMIDLower)) {
                        results.push({
                            element: row,
                            row: rowIndex,
                            merchantId,
                            msku,
                            fnsku,
                            asin,
                            condition,
                            status
                        });
                    }
                });
            });

            return results;
        }

        function cmFindNextButton() {
            const allClickable = document.querySelectorAll('a, button, [role="button"], span');
            for (const el of allClickable) {
                const text = (el.textContent || '').trim();
                if (/^next\s*>?$/i.test(text) || /^>\s*$/i.test(text) || /^next\s*page$/i.test(text)) {
                    if (
                        !el.disabled &&
                        el.offsetParent !== null &&
                        window.getComputedStyle(el).display !== 'none' &&
                        window.getComputedStyle(el).visibility !== 'hidden' &&
                        !el.classList.contains('disabled')
                    ) {
                        console.log('[CheckMapping] Found next button:', text, el.tagName);
                        return el;
                    }
                }
            }

            for (const el of allClickable) {
                const text = (el.textContent || '').trim().toLowerCase();
                if (text.includes('next') && !text.includes('prev') && text.length < 30) {
                    if (
                        !el.disabled &&
                        el.offsetParent !== null &&
                        window.getComputedStyle(el).display !== 'none' &&
                        !el.classList.contains('disabled')
                    ) {
                        console.log('[CheckMapping] Found next button (partial):', text, el.tagName);
                        return el;
                    }
                }
            }

            const selectors = [
                'button[aria-label*="next" i]:not([disabled])',
                'a[aria-label*="next" i]:not(.disabled)',
                '.pagination a:not(.disabled):not(.active)',
                '[class*="pagination"] a:not(.disabled)'
            ];

            for (const selector of selectors) {
                try {
                    const el = document.querySelector(selector);
                    if (el && el.offsetParent !== null) return el;
                } catch (e) { }
            }

            console.log('[CheckMapping] No next button found');
            return null;
        }

        async function cmWaitForContentChange(oldSnapshot, timeout = 10000) {
            return new Promise((resolve) => {
                const startTime = Date.now();

                const checkInterval = setInterval(() => {
                    const elapsed = Date.now() - startTime;

                    const rows = document.querySelectorAll('table tr');
                    if (rows.length >= 2) {
                        const currentSnapshot = Array.from(rows).slice(1, 4).map(r => {
                            const cells = r.querySelectorAll('td');
                            return cells[0]?.textContent?.trim() || '';
                        }).join('|');

                        if (currentSnapshot !== oldSnapshot && currentSnapshot.length > 0) {
                            clearInterval(checkInterval);
                            resolve(true);
                            return;
                        }
                    }

                    const pageText = document.body.innerText.toLowerCase();
                    if (pageText.includes('no results') || pageText.includes('this operation returned no results')) {
                        clearInterval(checkInterval);
                        resolve('no_results');
                        return;
                    }

                    if (elapsed >= timeout) {
                        clearInterval(checkInterval);
                        resolve(false);
                        return;
                    }
                }, 200);
            });
        }

        function cmHighlightRow(row, searchTerm) {
            if (!row) return;
            row.classList.add('cm-highlight-row');

            const cells = row.querySelectorAll('td');
            cells.forEach((cell) => {
                if (cell.textContent.toLowerCase().includes(searchTerm)) {
                    cell.style.fontWeight = 'bold';
                    cell.style.textDecoration = 'underline';
                }
            });
        }

        function cmScrollToElement(element) {
            if (!element) return;
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.transition = 'background-color 0.5s';
            element.style.backgroundColor = '#ffff00';
            setTimeout(() => {
                element.style.backgroundColor = '';
                setTimeout(() => {
                    element.style.backgroundColor = '#ffff00';
                }, 500);
            }, 500);
        }

        async function cmRunMidSearch(mid, isAsinMode) {
            console.log('[CheckMapping] Starting MID search for:', mid);
            cmMappingUpdateStep('cm-step-search', 'searching', 'MID Search: Scanning...');

            const searchMIDLower = mid.toLowerCase();
            let pageCount = 0;
            const maxPages = 200;
            let found = false;
            let finalResults = [];

            function getPageSnapshot() {
                const rows = document.querySelectorAll('table tr');
                return Array.from(rows).slice(1, 4).map(r => {
                    const cells = r.querySelectorAll('td');
                    return cells[0]?.textContent?.trim() || '';
                }).join('|');
            }

            while (pageCount < maxPages) {
                pageCount++;
                cmMappingUpdateStep('cm-step-search', 'searching', `MID Search: Page ${pageCount}...`);
                console.log(`[CheckMapping] Searching page ${pageCount}...`);

                const pageText = document.body.innerText.toLowerCase();
                if (pageText.includes('this operation returned no results') ||
                    (pageCount > 1 && pageText.includes('no results'))) {
                    cmAddSearchLog(`Page ${pageCount}: "No results" detected — end of data`);
                    break;
                }

                const pageResults = cmSearchCurrentPage(searchMIDLower);
                pageResults.forEach((r) => { r.page = pageCount; });

                console.log(`[CheckMapping] Page ${pageCount}: ${pageResults.length} matches found`);

                if (pageResults.length > 0) {
                    if (isAsinMode) {
                        const matchingResults = pageResults.filter((r) => r.fnsku === r.asin);
                        if (matchingResults.length > 0) {
                            finalResults = matchingResults;
                            matchingResults.forEach((r) => cmHighlightRow(r.element, searchMIDLower));
                            cmScrollToElement(matchingResults[0].element);
                            cmAddSearchLog(`Page ${pageCount}: Found ${matchingResults.length} result(s) with FNSKU = ASIN`);
                            found = true;
                            break;
                        } else {
                            cmAddSearchLog(`Page ${pageCount}: Found ${pageResults.length} MID match(es) but FNSKU ≠ ASIN`);
                        }
                    } else {
                        finalResults = pageResults;
                        pageResults.forEach((r) => cmHighlightRow(r.element, searchMIDLower));
                        cmScrollToElement(pageResults[0].element);
                        cmAddSearchLog(`Page ${pageCount}: Found ${pageResults.length} MID match(es)`);
                        found = true;
                        break;
                    }
                } else {
                    cmAddSearchLog(`Page ${pageCount}: No matches`);
                }

                const nextBtn = cmFindNextButton();
                if (!nextBtn) {
                    cmAddSearchLog('No next button found — end of pages');
                    break;
                }

                const snapshotBefore = getPageSnapshot();

                console.log(`[CheckMapping] Clicking: "${nextBtn.textContent.trim()}" (${nextBtn.tagName})`);
                nextBtn.click();

                const changeResult = await cmWaitForContentChange(snapshotBefore, 10000);

                if (changeResult === 'no_results') {
                    cmAddSearchLog(`After page ${pageCount}: "No results" — end of data`);
                    break;
                }

                if (changeResult === false) {
                    cmAddSearchLog(`Page navigation stopped — content did not change after page ${pageCount}`);
                    break;
                }

                await cmSleep(500);
            }

            if (found) {
                cmMappingUpdateStep(
                    'cm-step-search',
                    'done',
                    `MID Search: Found on page ${finalResults[0]?.page || '?'} (${finalResults.length} match${finalResults.length > 1 ? 'es' : ''})`
                );
                finalResults.forEach((result, idx) => {
                    cmAddSearchResult(result, idx, isAsinMode);
                });
            } else {
                cmMappingUpdateStep(
                    'cm-step-search',
                    'fail',
                    `MID Search: Not found across ${pageCount} pages`
                );
            }

            return { found, results: finalResults, pages: pageCount };
        }

        async function cmWaitForTableData(timeout = 15000) {
            return new Promise((resolve) => {
                const startTime = Date.now();

                const checkInterval = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    const rows = document.querySelectorAll('table tr');

                    if (rows.length >= 2) {
                        const lastRow = rows[rows.length - 1];
                        const cells = lastRow.querySelectorAll('td');
                        if (cells.length >= 3) {
                            clearInterval(checkInterval);
                            resolve(true);
                            return;
                        }
                    }

                    const pageText = document.body.innerText.toLowerCase();
                    if (
                        pageText.includes('no results') ||
                        pageText.includes('no mappings') ||
                        pageText.includes('no data') ||
                        pageText.includes('this operation returned no results')
                    ) {
                        clearInterval(checkInterval);
                        resolve(false);
                        return;
                    }

                    if (elapsed >= timeout) {
                        clearInterval(checkInterval);
                        resolve(false);
                        return;
                    }
                }, 300);
            });
        }

        async function cmAutoFillMappingsTool() {
            const params = cmGetParams();
            if (!params) {
                console.log('[CheckMapping] No params for mappings tool, skipping auto-fill');
                return;
            }

            console.log('[CheckMapping] Auto-filling mappings tool:', params);
            cmCreateMappingStatusToast();

            await cmSleep(2000);

            const isAsinMode = params.type === 'ASIN';

            // 1. Select mapping type
            const mappingTypeDropdown = document.querySelector('#getMappingsType');
            if (mappingTypeDropdown) {
                const targetType = isAsinMode ? 'asin' : 'fnsku';
                cmSetSelectValue(mappingTypeDropdown, targetType);
                cmMappingUpdateStep('cm-step-type', 'done');
                console.log('[CheckMapping] ✓ Set mapping type:', params.type);
            } else {
                cmMappingUpdateStep('cm-step-type', 'fail');
                console.error('[CheckMapping] ✗ Could not find mapping type dropdown');
            }

            await cmSleep(800);

                        // 2. Fill ASIN or FNSKU
            const valueLabel = isAsinMode ? 'ASIN' : 'FNSKU';
            let valueInput = null;

            // Strategy 1: Find textarea or input by label text (e.g. "ASIN LIST" or "FNSKU LIST")
            valueInput = cmFindInputByLabel(valueLabel + ' LIST') || cmFindInputByLabel(valueLabel);

            // Strategy 2: Find textarea with matching placeholder
            if (!valueInput) {
                const textareas = document.querySelectorAll('textarea');
                for (const ta of textareas) {
                    const placeholder = (ta.placeholder || '').toLowerCase();
                    if (placeholder.includes(valueLabel.toLowerCase()) || placeholder.includes('per line')) {
                        valueInput = ta;
                        break;
                    }
                }
            }

            // Strategy 3: Find any input/textarea by id, name, or placeholder
            if (!valueInput) {
                const allFields = document.querySelectorAll('input[type="text"], input:not([type]), textarea');
                for (const inp of allFields) {
                    const id = (inp.id || '').toLowerCase();
                    const name = (inp.name || '').toLowerCase();
                    const placeholder = (inp.placeholder || '').toLowerCase();
                    if (
                        id.includes(valueLabel.toLowerCase()) ||
                        name.includes(valueLabel.toLowerCase()) ||
                        placeholder.includes(valueLabel.toLowerCase())
                    ) {
                        valueInput = inp;
                        break;
                    }
                }
            }

            // Strategy 4: First visible textarea in form
            if (!valueInput) {
                const visibleTextareas = Array.from(document.querySelectorAll('textarea')).filter(
                    el => el.offsetParent !== null
                );
                if (visibleTextareas.length >= 1) valueInput = visibleTextareas[0];
            }

            // Strategy 5: First visible text input not marketplace
            if (!valueInput) {
                const visibleInputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])')).filter(
                    el => el.offsetParent !== null && !el.id.toLowerCase().includes('marketplace')
                );
                if (visibleInputs.length >= 1) valueInput = visibleInputs[0];
            }


            if (valueInput) {
                cmSetNativeValue(valueInput, params.value);
                cmMappingUpdateStep('cm-step-value', 'done');
                console.log('[CheckMapping] ✓ Filled', valueLabel, ':', params.value);
            } else {
                cmMappingUpdateStep('cm-step-value', 'fail');
                console.error('[CheckMapping] ✗ Could not find', valueLabel, 'input');
            }

            await cmSleep(400);

            // 3. Set Include Inactive = True
            let inactiveCheckbox =
                cmFindCheckboxByLabel('Include Inactive') ||
                cmFindCheckboxByLabel('includeInactive') ||
                document.querySelector('#includeInactive input[type="checkbox"]') ||
                document.querySelector('input#includeInactive[type="checkbox"]');

            if (inactiveCheckbox) {
                cmSetCheckbox(inactiveCheckbox, true);
                cmMappingUpdateStep('cm-step-inactive', 'done');
                console.log('[CheckMapping] ✓ Set Include Inactive = True');
            } else {
                const inactiveSelect =
                    cmFindInputByLabel('Include Inactive') ||
                    document.querySelector('#includeInactive');
                if (inactiveSelect && inactiveSelect.tagName === 'SELECT') {
                    cmSetSelectValue(inactiveSelect, 'true');
                    cmMappingUpdateStep('cm-step-inactive', 'done');
                } else {
                    cmMappingUpdateStep('cm-step-inactive', 'fail');
                    console.error('[CheckMapping] ✗ Could not find Include Inactive control');
                }
            }

            await cmSleep(400);

            // 4. Set Include Internal Merchants = True (if available)
            let internalCheckbox =
                cmFindCheckboxByLabel('Include Internal') ||
                cmFindCheckboxByLabel('includeInternal') ||
                cmFindCheckboxByLabel('Internal Merchants');

            if (internalCheckbox) {
                cmSetCheckbox(internalCheckbox, true);
                cmMappingUpdateStep('cm-step-internal', 'done');
            } else {
                const internalSelect =
                    cmFindInputByLabel('Include Internal') ||
                    cmFindInputByLabel('Internal Merchants');
                if (internalSelect && internalSelect.tagName === 'SELECT') {
                    cmSetSelectValue(internalSelect, 'true');
                    cmMappingUpdateStep('cm-step-internal', 'done');
                } else {
                    cmMappingUpdateStep('cm-step-internal', 'done');
                    console.log('[CheckMapping] ℹ Include Internal Merchants not found (may not exist)');
                }
            }

            await cmSleep(500);

            // 5. Click Get
            let getBtn = document.getElementById('get');

            if (!getBtn) {
                getBtn = cmFindButtonByText('Get');
            }

            if (!getBtn) {
                getBtn = document.querySelector('form button[type="submit"], form input[type="submit"]');
            }

            if (!getBtn) {
                const allBtns = document.querySelectorAll('button, input[type="submit"]');
                for (const b of allBtns) {
                    if ((b.id || '').toLowerCase().includes('get') ||
                        (b.className || '').toLowerCase().includes('get')) {
                        getBtn = b;
                        break;
                    }
                }
            }

            if (getBtn) {
                getBtn.click();
                cmMappingUpdateStep('cm-step-get', 'done');
                console.log('[CheckMapping] ✓ Clicked Get');
            } else {
                cmMappingUpdateStep('cm-step-get', 'fail');
                console.error('[CheckMapping] ✗ Could not find Get button');
                return;
            }

            // 6. Wait for table data
            cmMappingUpdateStep('cm-step-search', 'pending', 'MID Search: Waiting for data...');

            const hasData = await cmWaitForTableData(15000);

            if (!hasData) {
                cmMappingUpdateStep('cm-step-search', 'fail', 'MID Search: No data returned');
                cmAddSearchLog('No mapping data was returned. The ASIN/FNSKU may not have any mappings.');
                return;
            }

            await cmSleep(500);

            // 7. Run MID Search
            await cmRunMidSearch(params.mid, isAsinMode);

            cmClearParams();
        }

        cmAutoFillMappingsTool();
    }

  } // end of isFeatureEnabled('checkMappingILAC')


})();
