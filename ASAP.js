
// ==UserScript==
// @name              ASAP
// @namespace         http://tampermonkey.net/
// @version           1.1.11
// @description       Combined: Auto Peek into seller accounts, Auto Populate MID & FRD, and AUX status enforcement
// @author            Abhinav
// @updateURL         https://raw.githubusercontent.com/Abhinav-VK/Productivity-Scripts/refs/heads/main/ASAP.js
// @downloadURL       https://raw.githubusercontent.com/Abhinav-VK/Productivity-Scripts/refs/heads/main/ASAP.js
// @match             https://t.corp.amazon.com/*
// @match             https://t.corp.amazon.com/overview
// @match             https://*.amazon.com/hz/*case?caseId=*
// @match             https://*.amazon.com/hz/view-case*
// @match             https://*.amazon.com/ilac/view-ilac-report*
// @match             https://beacon2.harmony.a2z.com/*
// @match             https://sellercentral.amazon.com/fba/inbound-shipment/summary/*
// @match             https://paragon-*.amazon.com/hz/lobby*
// @match             https://console.harmony.a2z.com/poportal/poallitems/*
// @match             https://console.harmony.a2z.com/poportal/na/poallitems*
// @match             https://moonraker-na.aka.amazon.com/serenity/open*
// @match             https://fba-fnsku-commingling-console-na.aka.amazon.com/tool/fnsku-mappings-tool*
// @match             https://console.harmony.a2z.com/beacon2/*
// @connect           sentry.amazon.com
// @connect           na.amzheimdall.com
// @connect           paragon-na.amazon.com
// @connect           paragon-eu.amazon.com
// @connect           midway-auth.amazon.com
// @connect           sellercentral.amazon.com
// @connect           sim-ticketing-graphql-fleet.corp.amazon.com
// @require           https://ajax.googleapis.com/ajax/libs/jquery/3.6.1/jquery.min.js
// @require           https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.8/purify.min.js
// @grant             GM_setValue
// @grant             GM_getValue
// @grant             GM_openInTab
// @grant             GM_xmlhttpRequest
// @grant             GM_addStyle
// @grant             unsafeWindow
// @grant             window.onurlchange
// @noframes
// ==/UserScript==

/* globals jQuery, DOMPurify, $ */
/* eslint-disable no-multi-spaces */


// ############################################################
// #                                                          #
// #                MODULE 1: AUTO PEEK                       #
// #                                                          #
// ############################################################

(function AutoPeekModule() {
    'use strict';

    const MARKETPLACE_ROUTES = {
        "1": "amazon.com",
        "4": "amazon.de",
        "7": "amazon.ca",
        "771770": "amazon.com.mx"
    };

    const PARAGON_ROUTES = {
        "www.amazon.com": "na",
        "www.amazon.ca": "na",
        "www.amazon.de": "eu",
        "1": "na",
        "4": "eu",
        "7": "na",
        "771770": "na"
    };

    const US_FCS = ["ABE2","ABE3","ABE4","ABE8","ACY5","ATL1","ATL6","ATL7","ATL8","AVP1","AVP2","AVP6","AVP8","AZA1","BDL2","BDL3","BFI1","BFI3","BFI4","BFI5","BFIX","BNA2","BNA3","BNA5","BOS1","BOS5","BWI1","BWI2","BWI4","BWI5","CAE1","CAE3","CHA1","CHA2","CHS1","CLT3","CLT5","CMH1","CMH2","CVG1","CVG2","CVG3","CVG5","CVG7","CVG8","CVG9","DEN2","DET1","DET2","DFW5","DFW6","DFW7","DFW8","DFW9","DPH1","DTW5","EWR4","EWR5","EWR6","EWR7","EWR9","FTW1","FTW2","FTW3","FTW4","FTW6","GSP1","HOU1","HOU3","IND1","IND2","IND3","IND4","IND5","IND7","IVSA","IVSB","JAX3","JFK7","LAS2","LAS6","LAX9","LEX1","LEX2","LGA7","LGB4","LGB6","MCI5","MCI7","MCO5","MDT1","MDW2","MDW4","MDW6","MDW7","MDW9","MGE3","MIA5","MKC4","MKE1","MKE5","MSP1","MSP5","MSP9","OAK3","OAK4","OAK5","OAK6","OAK7","ONT2","ONT3","ONT4","ONT5","ONT6","ONT8","ONT9","PHL1","PHL4","PHL5","PHL6","PHL7","PHL9","PHX3","PHX5","PHX6","PHX7","PHX8","PIT5","RIC1","RIC2","RNO4","SAT1","SDF1","SDF2","SDF4","SDF6","SDF8","SDF9","SEA8","SJC7","SNA4","STL4","STL5","TEB3","TEB6","TPA1","TPA2","TUL1","TUS1","TUS2","XUSC","XUSD","XUSE","XUSN"];
    const CA_FCS = ["YOW1","YUL2","YVR2","YVR3","YVR4","YYC1","YYZ1","YYZ2","YYZ3","YYZ4","YYZ7","YYZ9"];
    const MX_FCS = ["MEX1","MEX2","MEX3"];

    // 🔧 FIX #1: Removed `const tabCreatedAt = Date.now();` from here.
    // It was being set at script load time, causing incorrect timeout calculations.
    // Moved inside startPeekProcess() where the tab is actually opened.

    function getMarketplaceFromFc(fc) {
        if (US_FCS.includes(fc)) return "amazon.com";
        if (CA_FCS.includes(fc)) return "amazon.ca";
        if (MX_FCS.includes(fc)) return "amazon.com.mx";
        return "amazon.com";
    }

    const REGION = document.URL.match(/na|eu/)?.[0] ?? "na";
    const ONE_DAY = 24 * 60 * 60 * 1000;

    // ========================== Main ==========================

    $(document).ready(() => {
        if (document.URL.includes("sellercentral.amazon.com/fba/inbound-shipment/summary")) {
            return handleSellerCentral();
        }
        if (document.URL.includes("t.corp.amazon")) {
            return handleSim();
        }
        if (document.URL.match(/view-case|case\?/)) {
            return handleParagonPeek();
        }
    });

    // ========================== Handle Seller Central ==========================

    function handleSellerCentral() {
        const currentUrl = document.URL;
        const lastAttempt = JSON.parse(GM_getValue('peekAttempt', '{}'));

        if (lastAttempt.url === currentUrl && lastAttempt.time > Date.now() - 60000) {
            console.log('[Auto Peek] Already attempted for this page. Skipping.');
            return;
        }

        const refreshKey = 'peekRefreshCount_' + currentUrl.replace(/[^a-zA-Z0-9]/g, '').slice(-30);
        const refreshCount = parseInt(GM_getValue(refreshKey, '0'));

        if (refreshCount >= 2) {
            console.log('[Auto Peek] Max refresh attempts reached. Stopping.');
            GM_setValue(refreshKey, '0');
            return;
        }

        const check404 = setInterval(() => {
            const pageText = document.body?.innerText || '';
            if (pageText.includes('Shipment does not exist') || pageText.includes('404')) {
                clearInterval(check404);
                clearTimeout(safetyTimeout);
                console.log('[Auto Peek] 404 detected on SellerCentral.');

                const peeked = getPeeked();
                const freshPeek = peeked.peekTimestamp && (Date.now() - peeked.peekTimestamp) < 30000;

                if (freshPeek) {
                    console.log('[Auto Peek] Fresh peek detected. Waiting for cookies, then refreshing...');
                    GM_setValue(refreshKey, String(refreshCount + 1));
                    setTimeout(() => location.reload(), 3000);
                } else {
                    console.log('[Auto Peek] No recent peek. Please peek from Paragon first.');
                    GM_setValue('peekAttempt', JSON.stringify({ url: currentUrl, time: Date.now() }));
                }
            }
        }, 500);

        const safetyTimeout = setTimeout(() => {
            clearInterval(check404);
            GM_setValue(refreshKey, '0');
            console.log('[Auto Peek] No 404 detected. Page loaded normally.');
        }, 15000);
    }

    // ========================== Handle Paragon (Peek) ==========================

    function handleParagonPeek() {
        let clicked = false;
        const ONE_HOUR = 60 * 60 * 1000;
        const caseId = new URLSearchParams(window.location.search).get("caseId");

        function getCurrentUser() {
            try {
                const userDetails = unsafeWindow?.userDetails || window?.userDetails;
                if (userDetails?.agentLogin) return userDetails.agentLogin;
            } catch (e) {}
            return null;
        }

        function getCaseOwner() {
            try {
                const caseData = (unsafeWindow?.deprecated_getViewCaseData || window?.deprecated_getViewCaseData)?.();
                if (caseData?.caseDetails?.owner) {
                    console.log('[Auto Peek] Owner from caseDetails:', caseData.caseDetails.owner);
                    return caseData.caseDetails.owner;
                }
            } catch (e) {}

            const rows = document.querySelectorAll('kat-table-body kat-table-row');
            for (const row of rows) {
                const cells = row.querySelectorAll('kat-table-cell');
                if (cells.length >= 2) {
                    const label = cells[0]?.textContent?.trim();
                    if (label === 'Owner' || label === 'Case Owner' || label === 'Owner:' || label === 'Case Owner:') {
                        const owner = cells[1]?.textContent?.trim();
                        if (owner && owner.length > 0 && owner.length < 30) {
                            console.log('[Auto Peek] Owner from DOM:', owner);
                            return owner;
                        }
                    }
                }
            }

            const allCells = document.querySelectorAll('kat-table-cell, td, th');
            for (let i = 0; i < allCells.length - 1; i++) {
                const text = allCells[i].textContent.trim();
                if (text === 'Owner' || text === 'Case Owner' || text === 'Owner:' || text === 'Case Owner:') {
                    const nextCell = allCells[i + 1];
                    const owner = nextCell?.textContent?.trim();
                    if (owner && owner.length > 0 && owner.length < 30 && /^[a-z0-9_-]+$/i.test(owner)) {
                        console.log('[Auto Peek] Owner from cells:', owner);
                        return owner;
                    }
                }
            }

            return null;
        }

        function getCaseStatus() {
            try {
                const caseData = (unsafeWindow?.deprecated_getViewCaseData || window?.deprecated_getViewCaseData)?.();
                if (caseData?.caseDetails?.status) {
                    console.log('[Auto Peek] Status from caseDetails:', caseData.caseDetails.status);
                    return caseData.caseDetails.status;
                }
            } catch (e) {}

            const rows = document.querySelectorAll('kat-table-body kat-table-row');
            for (const row of rows) {
                const cells = row.querySelectorAll('kat-table-cell');
                if (cells.length >= 2) {
                    const label = cells[0]?.textContent?.trim();
                    if (label === 'Status' || label === 'Case Status' || label === 'Status:' || label === 'Case Status:') {
                        const status = cells[1]?.textContent?.trim();
                        if (status && status.length > 0) {
                            console.log('[Auto Peek] Status from DOM:', status);
                            return status;
                        }
                    }
                }
            }

            const allCells = document.querySelectorAll('kat-table-cell, td, th');
            for (let i = 0; i < allCells.length - 1; i++) {
                const text = allCells[i].textContent.trim();
                if (text === 'Status' || text === 'Case Status' || text === 'Status:' || text === 'Case Status:') {
                    const nextCell = allCells[i + 1];
                    const status = nextCell?.textContent?.trim();
                    if (status && status.length > 0 && status.length < 50) {
                        console.log('[Auto Peek] Status from cells:', status);
                        return status;
                    }
                }
            }

            const statusElements = document.querySelectorAll('[class*="status"], [class*="Status"], [data-status]');
            for (const el of statusElements) {
                const text = el.textContent?.trim();
                if (text && (text.toLowerCase().includes('work in progress') ||
                             text.toLowerCase().includes('pending') ||
                             text.toLowerCase().includes('resolved') ||
                             text.toLowerCase().includes('closed'))) {
                    console.log('[Auto Peek] Status from badge:', text);
                    return text;
                }
            }

            return null;
        }

        function getPeekHistory() {
            try {
                return JSON.parse(GM_getValue('peekHistory', '{}'));
            } catch (e) {
                return {};
            }
        }

        function cleanPeekHistory() {
            const history = getPeekHistory();
            const now = Date.now();
            let cleaned = false;

            for (const key in history) {
                if ((now - history[key].peekTimestamp) > ONE_HOUR) {
                    delete history[key];
                    cleaned = true;
                }
            }

            if (cleaned) {
                GM_setValue('peekHistory', JSON.stringify(history));
            }

            return history;
        }

        function wasPeekedRecently() {
            if (!caseId) return false;

            const history = cleanPeekHistory();
            const entry = history[caseId];

            if (entry && (Date.now() - entry.peekTimestamp) < ONE_HOUR) {
                console.log('[Auto Peek] ✅ Case', caseId, 'was peeked', Math.round((Date.now() - entry.peekTimestamp) / 60000), 'min ago. Skipping.');
                return true;
            }

            return false;
        }

        function savePeekRecord() {
            const history = cleanPeekHistory();

            history[caseId] = {
                peekTimestamp: Date.now()
            };

            GM_setValue('peekHistory', JSON.stringify(history));
            console.log('[Auto Peek] 💾 Peek recorded for case:', caseId);
            console.log('[Auto Peek] 📊 Total entries:', Object.keys(history).length);
        }

        let dataCheckCount = 0;
        const dataCheckMax = 120;

        const waitForData = setInterval(() => {
            dataCheckCount++;

            if (dataCheckCount >= dataCheckMax) {
                clearInterval(waitForData);
                console.log('[Auto Peek] ⏱️ Timed out waiting for page data.');
                return;
            }

            const currentUser = getCurrentUser();
            const caseOwner = getCaseOwner();
            const caseStatus = getCaseStatus();

            if (!currentUser || !caseOwner) {
                if (dataCheckCount % 20 === 0) {
                    console.log(`[Auto Peek] ⏳ Waiting for page data... (attempt ${dataCheckCount}) user:`, currentUser, 'owner:', caseOwner);
                }
                return;
            }

            clearInterval(waitForData);

            console.log('[Auto Peek] 📋 Current user:', currentUser);
            console.log('[Auto Peek] 📋 Case owner:', caseOwner);
            console.log('[Auto Peek] 📋 Case status:', caseStatus);
            console.log('[Auto Peek] 📋 Case ID:', caseId);

            if (currentUser !== caseOwner) {
                console.log('[Auto Peek] ⏭️ Skipping — not the case owner.');
                console.log(`[Auto Peek]    Owner: "${caseOwner}", User: "${currentUser}"`);
                return;
            }
            console.log('[Auto Peek] ✅ User owns this case.');

            if (!caseStatus) {
                console.log('[Auto Peek] ⚠️ Could not determine case status. Proceeding anyway...');
            } else if (!caseStatus.toLowerCase().replace(/-/g, ' ').includes('work in progress')) {
                console.log('[Auto Peek] ⏭️ Skipping — case status is not "Work in Progress".');
                console.log(`[Auto Peek]    Status: "${caseStatus}"`);
                return;
            } else {
                console.log('[Auto Peek] ✅ Case is Work in Progress.');
            }

            if (wasPeekedRecently()) {
                return;
            }

            console.log('[Auto Peek] 🔍 Case not peeked recently. Starting peek process...');
            startPeekProcess();

        }, 500);

        // -------------------- Start Peek Process --------------------

        function startPeekProcess() {

            function tryClick() {
                if (clicked) return;

                const katButton = document.querySelector('kat-button[label="View seller account"]');
                if (!katButton) return;

                const button =
                    katButton.shadowRoot?.querySelector('button') ||
                    katButton.querySelector('button');

                if (!button) return;

                clicked = true;
                observer.disconnect();
                console.log('[Auto Peek] 🎯 Button found. Peeking silently for case:', caseId);

                setTimeout(() => {
                    const originalOpen = unsafeWindow.open;

                    // 🔧 FIX #1: tabCreatedAt now set HERE when the tab is actually opened,
                    // not at script load time. This ensures the 20s timeout is accurate.
                    const tabCreatedAt = Date.now();

                    unsafeWindow.open = function (url, target, features) {
                        if (url) {
                            console.log('[Auto Peek] 🔗 Intercepted SC URL:', url);

                            console.log('[Auto Peek] 🌐 Opening SC in background to set cookies...');
                            const scTab = GM_openInTab(url, { active: false, insert: true });

                            let scTabLoaded = false;

                            if (scTab && scTab.window) {
                                try {
                                    scTab.window.addEventListener('load', () => {
                                        if (scTabLoaded) return;
                                        scTabLoaded = true;
                                        console.log('[Auto Peek] ✅ SC page loaded. Closing tab...');
                                        scTab.close();
                                        clearInterval(closeTimer);
                                    });
                                } catch (e) {
                                    console.warn('[Auto Peek] ⚠️ Could not attach load listener:', e);
                                }
                            }

                            const closeTimer = setInterval(() => {
                                try {
                                    if (scTab.closed) {
                                        clearInterval(closeTimer);
                                        console.log('[Auto Peek] 🔒 SC tab already closed.');
                                        return;
                                    }

                                    if (scTabLoaded) {
                                        scTab.close();
                                        clearInterval(closeTimer);
                                        console.log('[Auto Peek] 🔒 SC tab closed (load confirmed).');
                                        return;
                                    }

                                    // 🔧 FIX #1 (cont.): Now correctly measures elapsed time
                                    // from when the tab was opened, not script load.
                                    const elapsed = Date.now() - tabCreatedAt;
                                    if (elapsed > 20000) {
                                        scTab.close();
                                        clearInterval(closeTimer);
                                        console.log('[Auto Peek] 🔒 SC tab closed (20s timeout).');
                                    }
                                } catch (e) {
                                    // Tab not accessible yet — keep retrying
                                }
                            }, 1000);

                            setTimeout(() => {
                                clearInterval(closeTimer);
                                if (!scTab.closed && !scTabLoaded) {
                                    try {
                                        scTab.close();
                                        console.log('[Auto Peek] 🔒 SC tab closed (25s hard timeout).');
                                    } catch (e) {}
                                }
                            }, 25000);
                        }
                        return { focus() {}, close() {} };
                    };

                    button.click();
                    console.log('[Auto Peek] ✅ Peek button clicked.');

                    savePeekRecord();

                    GM_setValue("peeked", JSON.stringify({
                        ttl: Date.now() + ONE_HOUR,
                        peekTimestamp: Date.now(),
                        caseId: caseId || '',
                    }));

                    GM_setValue('peekAttempt', '{}');

                    console.log('[Auto Peek] 💾 All peek data saved for case:', caseId);

                    setTimeout(() => {
                        unsafeWindow.open = originalOpen;
                        console.log('[Auto Peek] 🔓 window.open restored.');
                    }, 10000);

                    setTimeout(() => window.focus(), 1500);

                }, 1500);
            }

            const observer = new MutationObserver(tryClick);
            observer.observe(document.body, { childList: true, subtree: true });

            tryClick();

            setTimeout(() => {
                if (!clicked) {
                    observer.disconnect();
                    console.log('[Auto Peek] ⏱️ Button not found within 60s.');
                }
            }, 60000);
        }
    }

    // — continued in Part 2 —


    // (continuing from Part 2 — inside AutoPeekModule IIFE)

    async function handleFreeReplacementRefundSim(body) {
        try {
            const merchantId = body.match(/(?<=Merchant Id: )[\d]+/);
            const marketplace = body.match(/(?<=Marketplace: )[\w.]+/);
            const region = PARAGON_ROUTES[marketplace];
            const token = await getToken();
            const { caseId, tenantId, status } = await getCase(token, marketplace, merchantId, region);
            const customerId = await getCustomerId(token, caseId, tenantId, merchantId);
            await peekNow(token, caseId, tenantId, merchantId, customerId, status, false);
        } catch (e) {
            console.log('[Auto Peek] Free Replacement SIM auto-peek failed:', e);
        }
    }

    // ========================== Peek Helper Functions ==========================

    function getPeeked() {
        try {
            return JSON.parse(GM_getValue('peeked'));
        } catch (e) {
            return {};
        }
    }

    async function getToken() {
        const res = await xhrPromise({ method: "GET", url: `https://paragon-${REGION}.amazon.com/hz/search?searchQuery=&sortField=creationDate&sortOrder=desc` });
        const token = res.match(/csrfToken:\s"([^]+)"/);
        if (!token) {
            console.log('[Auto Peek] Paragon token not found. Please log into Paragon.');
            return false;
        }
        return DOMPurify.sanitize(token);
    }

    async function getCase(token, marketplace, searchText, region = `${REGION}`) {
        const res = await xhrPromise({
            method: "POST",
            url: `https://paragon-${region}.amazon.com/hz/api/search`,
            headers: { "Content-Type": "application/json;charset=UTF-8", "pgn-csrf-token": token },
            data: JSON.stringify({
                "query": `${searchText}`,
                "searchAllTenants": true,
                "contentTypes": [{
                    "contentType": "CASE",
                    "pageSize": 100,
                    "pageNum": 1,
                    "sortField": "queue",
                    "sortOrder": "desc",
                    "filters": [
                        "status:resolved",
                        "status:pending amazon action",
                        "status:pending merchant action",
                        "status:merchant action completed",
                        "status:work-in-progress",
                        "status:reopened",
                        "status:pending deployment"
                    ]
                }]
            })
        });
        try {
            let bestCase;
            const results = JSON.parse(res).payload.resultsByContentType.CASE.results;
            for (let i = 0; i < results.length; i++) {
                const { caseId, tenantId, status, queue } = results[i].document;
                if (queue.includes(marketplace)) {
                    return { caseId: DOMPurify.sanitize(caseId), tenantId: DOMPurify.sanitize(tenantId), status: DOMPurify.sanitize(status) };
                } else {
                    bestCase = { caseId: DOMPurify.sanitize(caseId), tenantId: DOMPurify.sanitize(tenantId), status: DOMPurify.sanitize(status) };
                }
            }
            return bestCase;
        } catch (e) {
            console.log('[Auto Peek] Error finding case:', e);
            return {};
        }
    }

    async function getLegacyMid(token, shipmentId) {
        const res = await xhrPromise({ method: "GET", url: `https://paragon-${REGION}.amazon.com/ilac/view-ilac-report?shipmentId=${shipmentId}`, headers: { "pgn-csrf-token": token } });
        const legacyMid = DOMPurify.sanitize($(res).find('a.a-link-normal:eq(4)').text());
        return legacyMid;
    }

    async function getCustomerId(token, caseId, tenantId, marketplaceId) {
        const res = await xhrPromise({
            method: "POST",
            url: `https://paragon-${REGION}.amazon.com/hz/paragon/peeknow/getcustomerdataforpeeknow`,
            headers: { "Content-Type": "application/x-www-form-urlencoded", "pgn-csrf-token": token },
            data: `marketplaceId=${marketplaceId}&caseId=${caseId}&caseTenantId=${tenantId}`
        });
        return DOMPurify.sanitize(JSON.parse(res).results.data.customerId);
    }

    function getCaseBaseData() {
        const baseData = localStorage.getItem("caseBaseData") ?? "{}";
        const parsedBaseData = JSON.parse(baseData);
        const expectedCaseId = new URLSearchParams(window.location.search).get("caseId");
        if (parsedBaseData?.caseId === expectedCaseId) {
            return {
                caseId: parsedBaseData.caseId,
                userLogin: parsedBaseData.userLogin,
                marketplaceId: parsedBaseData.marketPlaceId,
                caseStatus: parsedBaseData.caseStatus,
                tenantId: parsedBaseData.tenantId
            };
        }
        return {};
    }

    async function checkCasePeekable(token, caseId, merchantId, caseStatus) {
        if (!caseStatus) {
            console.log('[Auto Peek] ⏭️ No caseStatus — skipping peekable check');
            return true;
        }
        try {
            const peekCheck = await xhrPromise({
                method: "GET",
                url: `https://paragon-${REGION}.amazon.com/hz/paragon/peeknow/ajax?caseId=${caseId}&merchantId=${merchantId}&caseStatus=${caseStatus}&marketplaceId=`,
                headers: { "Content-Type": "application/x-www-form-urlencoded", "pgn-csrf-token": token },
            });
            const data = JSON.parse(peekCheck);
            console.log('[Auto Peek] �� Peekable check — hasRight:', data.hasRight, '| validCaseStatus:', data.validCaseStatus);
            return (data.hasRight && data.validCaseStatus);
        } catch (e) {
            console.log('[Auto Peek] ⚠️ Peekable check error — proceeding anyway:', e);
            return true;
        }
    }

    async function peekNow(token, caseId, tenantId, merchantId, customerId, caseStatus = null, newTab = false, endpoint = "") {
        try {
            console.log('[Auto Peek] �� peekNow params — caseId:', caseId, '| tenantId:', tenantId, '| merchantId:', merchantId, '| customerId:', customerId, '| status:', caseStatus);

            const peekable = await checkCasePeekable(token, caseId, merchantId, caseStatus);
            if (!peekable) {
                console.log('[Auto Peek] ❌ checkCasePeekable returned false — trying to peek anyway...');
            }

            const res = await xhrPromise({
                method: "POST",
                url: `https://paragon-${REGION}.amazon.com/hz/paragon/peeknow/invokepeeknow`,
                headers: { "Content-Type": "application/x-www-form-urlencoded", "pgn-csrf-token": token, "case-tenant-id": tenantId },
                data: `customerId=${customerId}&merchantId=${merchantId}&caseId=${caseId}&caseTenantId=${tenantId}`,
            });

            console.log('[Auto Peek] �� invokepeeknow raw response:', res);

            const data = JSON.parse(res).results.data;
            console.log('[Auto Peek] �� invokepeeknow parsed — success:', data.success, '| duration:', data.duration, '| scURL:', data.scURL);

            if (!data.success) {
                console.log('[Auto Peek] ❌ invokepeeknow returned success=false');
                return false;
            }

            const landingPage = (!endpoint) ? data.scURL : data.scURL.replace('/home', endpoint);
            GM_setValue("peeked", JSON.stringify({
                ttl: Date.now() + ONE_DAY,
                peekTimestamp: Date.now(),
                caseId: caseId,
                tenantId: tenantId,
                customerId: customerId,
                landingPage: DOMPurify.sanitize(landingPage),
                merchantIdLegacy: merchantId,
                merchantIdEncrypted: '',
            }));
            if (newTab) {
                setTimeout(() => GM_openInTab(landingPage, { active: false, insert: true }), 500);
            }
            return true;
        } catch (e) {
            console.log('[Auto Peek] ❌ peekNow exception:', e);
            return false;
        }
    }

    function xhrPromise({ method, url, headers, data }) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: method,
                url: url,
                data: data,
                headers: headers,
                onload: function (response) {
                    resolve(response.responseText);
                },
                onerror: function (error) {
                    reject(error);
                }
            });
        });
    }

})();
// ============ END OF MODULE 1 ============


// ############################################################
// #                                                          #
// #          MODULE 2: AUTO POPULATE MID & FRD               #
// #                                                          #
// ############################################################

(function AutoPopulateModule() {
    'use strict';

    const THREE_HOURS = 3 * 60 * 60 * 1000;

    // =============================================
    // 0) PARAGON CASE PAGE — Heartbeat with Shipment IDs
    // =============================================

    if (/paragon-.*\.amazon\.com\/hz\/(view-case|case)\?caseId=/.test(location.href)) {

        function extractShipmentIds() {
            const text = document.body.innerText || '';
            const matches = text.match(/FBA[A-Z0-9]{7,12}/gi) || [];
            return [...new Set(matches.map(id => id.toUpperCase()))];
        }

        function updateParagonHeartbeat() {
            const shipmentIds = extractShipmentIds();
            if (shipmentIds.length > 0) {
                GM_setValue('autoPopulate_ActiveParagon', JSON.stringify({
                    shipmentIds: shipmentIds,
                    timestamp: Date.now()
                }));
                console.log('[AutoPopulate] Paragon heartbeat — Shipments:', shipmentIds);
            }
        }

        setTimeout(updateParagonHeartbeat, 3000);
        setTimeout(updateParagonHeartbeat, 8000);
        setInterval(updateParagonHeartbeat, 5000);

        window.addEventListener('beforeunload', () => {
            GM_setValue('autoPopulate_ActiveParagon', JSON.stringify({
                shipmentIds: [],
                timestamp: 0
            }));
            console.log('[AutoPopulate] Paragon heartbeat cleared');
        });
    }

    // =============================================
    // 1) ILAC PAGE — Extract & Store MID + Page Text
    // =============================================

    if (/paragon-.*\.amazon\.com\/ilac\/view-ilac-report/.test(location.href)) {

        const urlParams = new URLSearchParams(window.location.search);
        const ilacShipmentId = (urlParams.get('shipmentId') || '').toUpperCase();

        function isRelatedParagonOpen() {
            if (!ilacShipmentId) return false;

            try {
                const paragonData = JSON.parse(GM_getValue('autoPopulate_ActiveParagon', '{}'));
                const age = Date.now() - (paragonData.timestamp || 0);

                if (age > 15000) {
                    console.log('[AutoPopulate] No active Paragon page (heartbeat expired)');
                    return false;
                }

                if (!paragonData.shipmentIds || !paragonData.shipmentIds.includes(ilacShipmentId)) {
                    console.log('[AutoPopulate] Shipment', ilacShipmentId, 'not found in active Paragon:', paragonData.shipmentIds);
                    return false;
                }

                return true;
            } catch (e) {
                return false;
            }
        }

        function storeMID() {
            if (!isRelatedParagonOpen()) return;

            const buttons = Array.from(document.querySelectorAll('button, a'));
            const copyMIDBtn = buttons.find(btn => btn.textContent && btn.textContent.trim() === 'Copy MID');
            if (!copyMIDBtn) return;

            const parentElement = copyMIDBtn.closest('tr') || copyMIDBtn.parentElement;
            if (!parentElement) return;

            const text = parentElement.textContent;
            const midMatch = text.match(/\((\d{7,15})\)/);
            if (!midMatch || !midMatch[1]) return;

            const mid = midMatch[1];
            console.log('[AutoPopulate] MID stored:', mid, '(Paragon verified)');
            GM_setValue('autoPopulate_MID', JSON.stringify({ value: mid, timestamp: Date.now() }));
        }

        function storeILACText() {
            if (!document.hasFocus()) return;
            if (!isRelatedParagonOpen()) {
                console.log('[AutoPopulate] ILAC text skipped — related Paragon not open');
                return;
            }

            const pageText = document.body.innerText || '';
            if (pageText.length > 100) {
                GM_setValue('autoPopulate_ILAC_Text', JSON.stringify({ value: pageText, timestamp: Date.now() }));
                console.log('[AutoPopulate] ILAC page text stored (Paragon verified)');
            }
        }

        setTimeout(storeMID, 2000);
        setTimeout(storeMID, 4000);

        setTimeout(storeILACText, 3000);
        setTimeout(storeILACText, 8000);
        setTimeout(storeILACText, 15000);

        const midObserver = new MutationObserver(storeMID);
        midObserver.observe(document.body, { childList: true, subtree: true });

        window.addEventListener('focus', storeILACText);

        let ilacTextTimer = null;
        const ilacTextObserver = new MutationObserver(() => {
            if (ilacTextTimer) clearTimeout(ilacTextTimer);
            ilacTextTimer = setTimeout(storeILACText, 5000);
        });
        ilacTextObserver.observe(document.body, { childList: true, subtree: true });
    }

    // =============================================
    // 2) PO PORTAL PAGE — Extract & Store FRD + PO ID
    // =============================================

    if (/console\.harmony\.a2z\.com\/poportal\/(na\/)?poallitems/.test(location.href)) {

        let frdFound = false;

        function storeFRD() {
            if (frdFound) return;

            const text = document.body.innerText || '';
            const frdMatch = text.match(/First\s+Receive\s+Date[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i);
            if (!frdMatch || !frdMatch[1]) return;

            const frd = frdMatch[1];

            const urlParams = new URLSearchParams(window.location.search);
            const poId = urlParams.get('poId') || '';

            frdFound = true;
            console.log('[AutoPopulate] FRD stored:', frd, '| PO ID:', poId);
            GM_setValue('autoPopulate_FRD', JSON.stringify({ value: frd, poId: poId, timestamp: Date.now() }));
            frdObserver.disconnect();
        }

        const frdRetry = setInterval(() => {
            storeFRD();
            if (frdFound) clearInterval(frdRetry);
        }, 2000);

        setTimeout(() => clearInterval(frdRetry), 60000);

        const frdObserver = new MutationObserver(storeFRD);
        frdObserver.observe(document.body, { childList: true, subtree: true });
    }

    // =============================================
    // 3) SERENITY PAGE — Auto-populate FRD
    // =============================================

    if (/moonraker-na\.aka\.amazon\.com\/serenity\/open/.test(location.href)) {

        function tryPopulateFRD() {
            const input = document.getElementById('serenity-date-input');
            if (!input) return;
            if (input.value) return;

            try {
                const frdData = JSON.parse(GM_getValue('autoPopulate_FRD', '{}'));
                const ilacData = JSON.parse(GM_getValue('autoPopulate_ILAC_Text', '{}'));
                const ageMs = Date.now() - (frdData.timestamp || 0);

                if (!frdData.value || ageMs >= THREE_HOURS) return;

                if (!frdData.poId || !ilacData.value || !ilacData.value.includes(frdData.poId)) {
                    console.log('[AutoPopulate] PO ID "' + (frdData.poId || 'none') + '" not found in current ILAC — FRD skipped');
                    return;
                }

                input.value = frdData.value;
                console.log('[AutoPopulate] FRD auto-populated:', frdData.value, '(PO ID matched)');
            } catch (e) {
                console.log('[AutoPopulate] FRD error:', e);
            }
        }

        const frdPopObserver = new MutationObserver(tryPopulateFRD);
        frdPopObserver.observe(document.body, { childList: true, subtree: true });
    }

    // =============================================
    // 4) MAPPINGS PAGE — Auto-populate MID
    // =============================================

    if (/fba-fnsku-commingling-console-na\.aka\.amazon\.com\/tool\/fnsku-mappings-tool/.test(location.href)) {

        let midPopulated = false;

        function tryPopulateMID() {
            if (midPopulated) return;

            const input = document.getElementById('mid-search-input');

            if (!input) {
                console.log('[AutoPopulate] MID input not found yet...');
                return;
            }

            if (input.value) {
                console.log('[AutoPopulate] MID input already has value:', input.value);
                return;
            }

            try {
                const stored = JSON.parse(GM_getValue('autoPopulate_MID', '{}'));
                const ageMs = Date.now() - (stored.timestamp || 0);

                console.log('[AutoPopulate] Stored MID data:', stored);
                console.log('[AutoPopulate] Age (ms):', ageMs);

                if (stored.value && ageMs < THREE_HOURS) {
                    const nativeSetter = Object.getOwnPropertyDescriptor(
                        window.HTMLInputElement.prototype, 'value'
                    ).set;
                    nativeSetter.call(input, stored.value);

                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
                    input.focus();

                    midPopulated = true;
                    console.log('[AutoPopulate] ✅ MID auto-populated:', stored.value);
                } else {
                    console.log('[AutoPopulate] MID not available or expired');
                }
            } catch (e) {
                console.log('[AutoPopulate] MID error:', e);
            }
        }

        const midPopObserver = new MutationObserver(tryPopulateMID);
        midPopObserver.observe(document.body, { childList: true, subtree: true });

        const midRetry = setInterval(() => {
            tryPopulateMID();
            if (midPopulated) {
                clearInterval(midRetry);
                midPopObserver.disconnect();
            }
        }, 1000);

        setTimeout(() => {
            clearInterval(midRetry);
            midPopObserver.disconnect();
        }, 60000);
    }


})();
// ============ END OF MODULE 2 ============


// ############################################################
// #                                                          #
// #               MODULE 3: AUX ALERT                        #
// #                                                          #
// ############################################################

(function AuxAlertModule() {
    'use strict';

    // ======================== Styles ======================== //

    GM_addStyle(`
        #aux-alert-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #aux-alert-box {
            background: #fff;
            border-radius: 10px;
            max-width: 480px;
            width: 90%;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        #aux-alert-header {
            background: #d32f2f;
            color: #fff;
            padding: 16px 20px;
            font-size: 18px;
            font-weight: 700;
        }
        #aux-alert-body {
            padding: 20px;
            font-size: 14px;
            color: #333;
            line-height: 1.6;
        }
        .aux-status-line {
            background: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 8px 12px;
            margin: 12px 0;
            font-weight: 600;
            border-radius: 0 4px 4px 0;
        }
        .aux-message { margin-top: 12px; }
        #aux-alert-footer {
            padding: 12px 20px;
            text-align: right;
            border-top: 1px solid #eee;
        }
        #aux-alert-ok-btn {
            background: #d32f2f;
            color: #fff;
            border: none;
            padding: 10px 28px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }
        #aux-alert-ok-btn:hover { background: #b71c1c; }
        .aux-disabled-btn {
            opacity: 0.5 !important;
            pointer-events: none !important;
            cursor: not-allowed !important;
        }
        .aux-block-shield {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 99999;
            cursor: not-allowed;
            background: transparent;
        }
    `);

    // ======================== CCP Status Detection ======================== //
    console.log('[AUX ALERT] Script loaded on:', location.href);

    function getCCPStatus() {
        try {
            const conn = unsafeWindow.connect;
            if (!conn) return null;

            if (typeof conn.Agent === 'function') {
                try {
                    const agent = new conn.Agent();
                    if (agent && typeof agent.getState === 'function') {
                        const state = agent.getState();
                        if (state && state.name) {
                            return { name: state.name, type: state.type };
                        }
                    }
                } catch (e) {}
            }

            if (typeof conn.agent === 'function') {
                let result = null;
                conn.agent(function (agent) {
                    const state = agent.getState();
                    if (state && state.name) {
                        result = { name: state.name, type: state.type };
                    }
                });
                if (result) return result;
            }
        } catch (e) {}
        return null;
    }

    function checkIsAvailable() {
        const ccp = getCCPStatus();

        if (!ccp) {
            const stored = GM_getValue('aux_status', null);
            const storedTs = GM_getValue('aux_status_ts', 0);
            const ageMin = (Date.now() - storedTs) / (60 * 1000);

            if (stored && ageMin <= 10) {
                return { available: stored.type === 'routable', status: stored.name };
            }
            return { available: false, status: 'Not Detected' };
        }

        GM_setValue('aux_status', { name: ccp.name, type: ccp.type });
        GM_setValue('aux_status_ts', Date.now());

        return { available: ccp.type === 'routable', status: ccp.name };
    }

    // ======================== Custom Modal ======================== //

    let modalOpen = false;

    function showAuxModal(statusText, message) {
        if (modalOpen) return;

        const existing = document.getElementById('aux-alert-overlay');
        if (existing) existing.remove();

        modalOpen = true;

        // 🔧 FIX #4: Sanitize statusText and message with DOMPurify before innerHTML.
        const safeStatus = DOMPurify.sanitize(statusText);
        const safeMessage = DOMPurify.sanitize(message, { ALLOWED_TAGS: ['strong', 'br'] });

        const overlay = document.createElement('div');
        overlay.id = 'aux-alert-overlay';
        overlay.innerHTML = `
            <div id="aux-alert-box">
                <div id="aux-alert-header">
                    🚫 AUX Not Available — Action Blocked
                </div>
                <div id="aux-alert-body">
                    <div class="aux-status-line">
                        Current AUX Status: <strong>${safeStatus}</strong>
                    </div>
                    <div class="aux-message">${safeMessage}</div>
                </div>
                <div id="aux-alert-footer">
                    <button id="aux-alert-ok-btn">I Understand</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('aux-alert-ok-btn').addEventListener('click', function () {
            overlay.remove();
            modalOpen = false;
        });
    }

    // ======================== Shared: Shield helper ======================== //

    function addShield(btn, alertFn) {
        if (btn.querySelector('.aux-block-shield')) return;
        btn.style.position = 'relative';
        const shield = document.createElement('div');
        shield.className = 'aux-block-shield';
        shield.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const { available, status } = checkIsAvailable();
            if (!available) {
                alertFn(status);
            } else {
                shield.remove();
                btn.classList.remove('aux-disabled-btn');
                btn.style.position = '';
                const inner = btn.querySelector('button');
                if (inner) inner.classList.remove('aux-disabled-btn');
            }
        }, true);
        btn.appendChild(shield);
    }

    function removeShield(btn) {
        const shield = btn.querySelector('.aux-block-shield');
        if (shield) shield.remove();
        btn.classList.remove('aux-disabled-btn');
        btn.style.position = '';
        const inner = btn.querySelector('button');
        if (inner) inner.classList.remove('aux-disabled-btn');
    }

    // 🔧 FIX #3: Debounce helper to prevent excessive DOM queries
    // from MutationObserver firing on every single DOM change.
    function debounce(fn, delay) {
        let timer = null;
        return function (...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // ======================== PARAGON PAGE (AUX) ======================== //

    if (/paragon-.*\.amazon\.com\/hz\/(view-case|case)\?caseId=/.test(location.href)) {

        function waitForCCP(callback) {
            let attempts = 0;
            const check = setInterval(() => {
                attempts++;
                try {
                    if (unsafeWindow.connect && unsafeWindow.connect.Agent) {
                        const agent = new unsafeWindow.connect.Agent();
                        if (agent.getState && agent.getState().name) {
                            clearInterval(check);
                            callback();
                            return;
                        }
                    }
                } catch (e) {}
                if (attempts >= 60) {
                    clearInterval(check);
                    callback();
                }
            }, 500);
        }

        function showParagonAlert(status) {
            showAuxModal(
                status,
                'You must be in <strong>"Available"</strong> status to perform this action.<br><br>' +
                'Please change your AUX status to Available before reviewing or resolving.'
            );
        }

        // 🔧 FIX #5: Refactored 3 identical copy-pasted blocks into a single loop.
        function updateParagonButtons() {
            const { available } = checkIsAvailable();

            ['Review', 'Transfer', 'Send'].forEach(label => {
                document.querySelectorAll(`kat-button[label="${label}"]`).forEach(btn => {
                    if (!available) {
                        btn.classList.add('aux-disabled-btn');
                        const inner = btn.querySelector('button');
                        if (inner) inner.classList.add('aux-disabled-btn');
                        addShield(btn, showParagonAlert);
                    } else {
                        removeShield(btn);
                    }
                });
            });
        }

        function attachParagonListeners() {
            // 🔧 FIX #3: Reduced polling from 500ms to 2000ms since the
            // debounced MutationObserver now handles rapid DOM changes.
            setInterval(updateParagonButtons, 2000);
            updateParagonButtons();

            // 🔧 FIX #3: Debounced MutationObserver callback (300ms).
            // Previously every single DOM mutation triggered full button
            // scanning + checkIsAvailable(). Now batches rapid mutations.
            const debouncedUpdate = debounce(updateParagonButtons, 300);
            const auxObserver = new MutationObserver(debouncedUpdate);
            auxObserver.observe(document.body, { childList: true, subtree: true });
        }

        waitForCCP(() => {
            attachParagonListeners();
        });
    }

    // ======================== BEACON 2.0 PAGE ======================== //

    // 🔧 FIX #6: Broadened Beacon URL regex to also match paths without
    // the trailing /beacon2/ segment. The @match already uses
    // beacon2.harmony.a2z.com/* but the old regex required /beacon2/ in path.
    if (/beacon2\.harmony\.a2z\.com/.test(location.href)) {

        function showBeaconAlert(status) {
            showAuxModal(
                status,
                'You must be in <strong>"Available"</strong> status to submit blurb.<br><br>' +
                'Please change your AUX status to Available before submitting.'
            );
        }

        function updateBeaconButtons() {
            const { available } = checkIsAvailable();

            const allButtons = document.querySelectorAll('button, kat-button, [role="button"]');
            allButtons.forEach(btn => {
                const text = (btn.textContent || btn.getAttribute('label') || '')
                    .replace(/\s+/g, ' ').trim().toLowerCase();

                if (text.includes('submit blurb')) {
                    if (!available) {
                        btn.classList.add('aux-disabled-btn');
                        addShield(btn, showBeaconAlert);
                    } else {
                        removeShield(btn);
                    }
                }
            });
        }

        // 🔧 FIX #3: Reduced polling from 500ms to 2000ms, debounced observer.
        setInterval(updateBeaconButtons, 2000);

        const debouncedBeaconUpdate = debounce(updateBeaconButtons, 300);
        const beaconObserver = new MutationObserver(debouncedBeaconUpdate);
        beaconObserver.observe(document.body, { childList: true, subtree: true });

        setTimeout(updateBeaconButtons, 1000);
    }

})();
// ============ END OF MODULE 3 ============



// ############################################################
// #                                                          #
// #            MODULE 4: OPEN ALL LINKS (ILAC)               #
// #                                                          #
// ############################################################

(function OpenAllLinksModule() {
    'use strict';

    if (!/paragon-.*\.amazon\.com\/ilac\/view-ilac-report/.test(location.href)) return;

    console.log('[OpenAllLinks] Module loaded on ILAC page');

    const TARGET_LINK_TEXTS = ['Summary', 'Search Paragon', 'Check SANTOS', 'PO All Items'];
    let openAllBtnAdded = false;

    // ======================== Styles ======================== //

    GM_addStyle(`
        #oal-open-all-btn {
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
            margin-left: 8px;
            vertical-align: middle;
        }

        #oal-open-all-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        #oal-open-all-btn:active {
            transform: translateY(0);
        }

        #oal-open-all-btn.oal-success {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        }

        #oal-open-all-btn.oal-error {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
    `);

    // ======================== Find Check Mapping Button ======================== //

    function findCheckMappingButton() {
        // Look for the Check Mapping button by its known ID first
        const byId = document.getElementById('cm-check-mapping-btn');
        if (byId) return byId;

        // Fallback: search by text content
        const allClickables = document.querySelectorAll('button, a, kat-button, [role="button"]');
        for (const el of allClickables) {
            const text = (el.textContent || el.getAttribute('label') || '').trim();
            if (text === 'Check Mapping' || text === 'Check Mappings') {
                return el;
            }
        }
        return null;
    }

    // ======================== Find Target Links on ILAC Page ======================== //

    function findTargetLinks() {
        const links = [];
        const allAnchors = document.querySelectorAll('a[href], button[onclick], kat-button');

        for (const anchor of allAnchors) {
            const text = (anchor.textContent || anchor.getAttribute('label') || '').trim();
            for (const target of TARGET_LINK_TEXTS) {
                if (text === target || text.toLowerCase() === target.toLowerCase()) {
                    links.push({ text: target, element: anchor });
                    break;
                }
            }
        }
        return links;
    }

    // ======================== Create & Insert Button ======================== //

    function createOpenAllButton(referenceBtn) {
        if (openAllBtnAdded) return;

        const btn = document.createElement('button');
        btn.id = 'oal-open-all-btn';
        btn.textContent = 'Open All';
        btn.title = 'Opens: Summary, Search Paragon, Check SANTOS, PO All Items';

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const targetLinks = findTargetLinks();
            const foundTexts = targetLinks.map(l => l.text);
            const missingTexts = TARGET_LINK_TEXTS.filter(t => !foundTexts.includes(t));

            // No links found at all
            if (targetLinks.length === 0) {
                console.log('[OpenAllLinks] ❌ No target links found on page.');
                btn.textContent = '❌ No Links Found';
                btn.classList.add('oal-error');
                setTimeout(() => {
                    btn.textContent = 'Open All';
                    btn.classList.remove('oal-error');
                }, 2000);
                return;
            }

            // Log any missing links
            if (missingTexts.length > 0) {
                console.log('[OpenAllLinks] ⚠️ Missing links:', missingTexts.join(', '));
            }

            // Open all found links
            let opened = 0;
            for (const link of targetLinks) {
                const el = link.element;

                if (el.tagName === 'A' && el.href) {
                    // <a> tags — open href in new tab
                    window.open(el.href, '_blank');
                    opened++;
                    console.log('[OpenAllLinks] ✅ Opened:', link.text, '→', el.href);
                } else {
                    // Buttons / kat-buttons — simulate click
                    el.click();
                    opened++;
                    console.log('[OpenAllLinks] ✅ Clicked:', link.text);
                }
            }

            // Visual feedback
            btn.textContent = `✅ Opened ${opened}/${TARGET_LINK_TEXTS.length}`;
            btn.classList.add('oal-success');
            setTimeout(() => {
                btn.textContent = 'Open All';
                btn.classList.remove('oal-success');
            }, 2500);

            console.log(`[OpenAllLinks] 🎯 Opened ${opened} of ${TARGET_LINK_TEXTS.length} links.`);
        });

        // Insert right beside Check Mapping button
        // Try to insert into the same container if it exists
        const container = referenceBtn.closest('#cm-check-mapping-container');
        if (container) {
            container.appendChild(btn);
        } else {
            referenceBtn.parentNode.insertBefore(btn, referenceBtn.nextSibling);
        }

        openAllBtnAdded = true;
        console.log('[OpenAllLinks] ✅ "Open All" button added beside Check Mapping.');
    }

    // ======================== Wait for Check Mapping & Insert ======================== //

    function tryAddButton() {
        if (openAllBtnAdded) return;

        const checkMappingBtn = findCheckMappingButton();
        if (!checkMappingBtn) return;

        createOpenAllButton(checkMappingBtn);
    }

    // Poll every 1s until Check Mapping button appears
    const openAllRetry = setInterval(() => {
        tryAddButton();
        if (openAllBtnAdded) clearInterval(openAllRetry);
    }, 1000);

    // Also watch DOM changes for dynamically loaded content
    const openAllObserver = new MutationObserver(() => {
        tryAddButton();
        if (openAllBtnAdded) openAllObserver.disconnect();
    });
    openAllObserver.observe(document.body, { childList: true, subtree: true });

    // Safety timeout — stop after 60s
    setTimeout(() => {
        clearInterval(openAllRetry);
        openAllObserver.disconnect();
        if (!openAllBtnAdded) {
            console.log('[OpenAllLinks] ⏱️ Check Mapping button not found within 60s.');
        }
    }, 60000);

})();
