// ==UserScript==
// @name              ASAP
// @version           1.0.0
// @description       Combined: Auto Peek into seller accounts, Auto Populate MID & FRD, and AUX status enforcement
// @author            Abhinav
// @updateURL         https://raw.githubusercontent.com/Abhinav-VK/Productivity-Scripts/refs/heads/main/ASAP
// @downloadURL       https://raw.githubusercontent.com/Abhinav-VK/Productivity-Scripts/refs/heads/main/ASAP
// @match             https://t.corp.amazon.com/*
// @match             https://t.corp.amazon.com/overview
// @match             https://*.amazon.com/hz/*case?caseId=*
// @match             https://*.amazon.com/hz/view-case*
// @match             https://*.amazon.com/ilac/view-ilac-report*
// @match             https://sellercentral.amazon.com/fba/inbound-shipment/summary/*
// @match             https://paragon-*.amazon.com/hz/lobby*
// @match             https://console.harmony.a2z.com/poportal/poallitems/*
// @match             https://console.harmony.a2z.com/poportal/na/poallitems*
// @match             https://moonraker-na.aka.amazon.com/serenity/open*
// @match             https://fba-fnsku-commingling-console-na.aka.amazon.com/tool/fnsku-mappings-tool*
// @match             https://console.harmony.a2z.com/beacon2/*
// @require           https://ajax.googleapis.com/ajax/libs/jquery/3.6.1/jquery.min.js
// @require           https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.8/purify.min.js
// @grant             GM_setValue
// @grant             GM_getValue
// @grant             GM_openInTab
// @grant             GM_xmlhttpRequest
// @grant             GM_addStyle
// @grant             unsafeWindow
// @grant             window.onurlchange
// @connect           sentry.amazon.com
// @connect           na.amzheimdall.com
// @connect           paragon-na.amazon.com
// @connect           paragon-eu.amazon.com
// @connect           midway-auth.amazon.com
// @connect           sellercentral.amazon.com
// @connect           sim-ticketing-graphql-fleet.corp.amazon.com
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

    function getMarketplaceFromFc(fc) {
        if (US_FCS.includes(fc)) return "amazon.com";
        if (CA_FCS.includes(fc)) return "amazon.ca";
        if (MX_FCS.includes(fc)) return "amazon.com.mx";
        return "amazon.com";
    }

    const REGION = document.URL.match(/na|eu/)?.[0] ?? "na";

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
        if (document.URL.includes("amazon.com/ilac/")) {
            return handleIlacReport();
        }
    });

    // ========================== Handle Seller Central ==========================

    function handleSellerCentral() {
        const currentUrl = document.URL;
        const lastAttempt = JSON.parse(GM_getValue('peekAttempt', '{}'));

        if (lastAttempt.url === currentUrl && lastAttempt.time > Date.now() - 60000) {
            console.log('[Auto Peek] Already attempted peek for this page. Skipping.');
            return;
        }

        const check404 = setInterval(() => {
            const pageText = document.body?.innerText || '';
            if (pageText.includes('Shipment does not exist') || pageText.includes('404')) {
                clearInterval(check404);
                clearTimeout(safetyTimeout);
                console.log('[Auto Peek] 404 detected on SellerCentral. Attempting to peek...');
                autoPeekAndRefresh(currentUrl);
            }
        }, 500);

        const safetyTimeout = setTimeout(() => {
            clearInterval(check404);
            console.log('[Auto Peek] No 404 detected. Page loaded normally.');
        }, 15000);
    }

    async function autoPeekAndRefresh(currentUrl) {
        GM_setValue('peekAttempt', JSON.stringify({ url: currentUrl, time: Date.now() }));

        try {
            const peeked = getPeeked();
            const token = await getToken();

            if (!token) {
                console.log('[Auto Peek] No Paragon token. Please log into Paragon.');
                return;
            }

            let caseId, tenantId, merchantId, customerId, status;

            if (peeked.caseId && peeked.tenantId && peeked.merchantIdLegacy) {
                caseId = peeked.caseId;
                tenantId = peeked.tenantId;
                merchantId = peeked.merchantIdLegacy;
                customerId = peeked.customerId || await getCustomerId(token, caseId, tenantId, merchantId);
                status = null;
            } else {
                const shipmentId = document.URL.match(/FBA[\w]+/)?.[0];
                if (!shipmentId) {
                    console.log('[Auto Peek] No shipment ID found in URL and no stored peek data.');
                    return;
                }
                const legacyMid = await getLegacyMid(token, shipmentId);
                if (!legacyMid) {
                    console.log('[Auto Peek] Could not find merchant ID for shipment.');
                    return;
                }
                const marketplace = "amazon.com";
                ({ caseId, tenantId, status } = await getCase(token, marketplace, legacyMid));
                customerId = await getCustomerId(token, caseId, tenantId, legacyMid);
                merchantId = legacyMid;
            }

            const result = await peekNow(token, caseId, tenantId, merchantId, customerId, status, false);

            if (result) {
                console.log('[Auto Peek] Peek successful. Refreshing page...');
                setTimeout(() => location.reload(), 1000);
            } else {
                console.log('[Auto Peek] Peek failed.');
            }
        } catch (e) {
            console.log('[Auto Peek] SellerCentral auto-peek error:', e);
        }
    }

    // ========================== Handle Paragon (Peek) ==========================

    function handleParagonPeek() {
        let clicked = false;

        const caseId = new URLSearchParams(window.location.search).get("caseId");
        const peeked = getPeeked();

        console.log('[Auto Peek] 📋 Current case ID:', caseId);
        console.log('[Auto Peek] 📦 Stored peek data:', JSON.stringify(peeked, null, 2));

        if (peeked.ttl && peeked.caseId) {
            const expired = peeked.ttl < Date.now();
            const sameCase = peeked.caseId === caseId;
            console.log(`[Auto Peek] ⏰ TTL: ${new Date(peeked.ttl).toLocaleTimeString()} | ${expired ? 'EXPIRED' : 'VALID'}`);
            console.log(`[Auto Peek] 🔍 Same case: ${sameCase}`);

            if (!expired && sameCase) {
                console.log('[Auto Peek] ✅ Already peeked for this case. Skipping.');
                return;
            }
        }

        console.log('[Auto Peek] 🔍 Not peeked yet. Watching for View seller account button...');

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
            console.log('[Auto Peek] 🎯 Button found. Clicking in 1.5s...');

            setTimeout(() => {
                const originalOpen = unsafeWindow.open;
                unsafeWindow.open = function (url, target, features) {
                    if (url) {
                        console.log('[Auto Peek] 🔗 Intercepted window.open:', url);
                        const newTab = GM_openInTab(url, { active: false, insert: true });

                        const checkAndClose = setInterval(() => {
                            try {
                                if (newTab.closed) {
                                    clearInterval(checkAndClose);
                                    console.log('[Auto Peek] Tab already closed.');
                                    return;
                                }
                                newTab.close();
                                clearInterval(checkAndClose);
                                console.log('[Auto Peek] 🔒 Tab closed.');
                            } catch (e) { }
                        }, 3000);

                        setTimeout(() => clearInterval(checkAndClose), 30000);

                        if (caseId) {
                            const currentPeeked = getPeeked();
                            currentPeeked.caseId = caseId;
                            currentPeeked.ttl = Date.now() + (20 * 60 * 1000);
                            GM_setValue("peeked", JSON.stringify(currentPeeked));
                            console.log('[Auto Peek] 💾 Saved peek data for case:', caseId);
                        }
                    }
                    return { focus() {}, close() {} };
                };

                button.click();
                console.log('[Auto Peek] ✅ Button clicked.');

                setTimeout(() => {
                    unsafeWindow.open = originalOpen;
                }, 5000);

                setTimeout(() => window.focus(), 1000);
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

    // ========================== Handle ILAC ==========================

    function handleIlacReport() {
        const loadPage = setInterval(async () => {
            if ($('.ilac-root').length) {
                clearInterval(loadPage);
                const fc = $("td:contains(FC destination:):last").next().text().match(/[\w]+/)?.[0];
                const marketplace = getMarketplaceFromFc(fc);
                const token = $(":contains(csrf)")?.[2]?.text?.split("'")?.[3];
                const sellerId = $("td:contains(Merchant Customer ID:):last").next().find('a').text();
                let caseId = document.URL.match(/(?<=caseId=|caseID=)[\w]+/)?.[0];
                let tenantId = document.URL.match(/(?<=tenantId=)[\w]+/)?.[0];
                let customerId;
                let status;

                try {
                    if (caseId && tenantId) {
                        customerId = await getCustomerId(token, caseId, tenantId, sellerId);
                        ({ status } = await getCase(token, marketplace, caseId));
                    } else {
                        ({ caseId, tenantId, status } = await getCase(token, marketplace, sellerId));
                        customerId = await getCustomerId(token, caseId, tenantId, sellerId);
                    }

                    await peekNow(token, caseId, tenantId, sellerId, customerId, status, false);
                } catch (e) {
                    console.log('[Auto Peek] ILAC auto-peek failed:', e);
                }
            }
        }, 25);
    }

    // ========================== Handle SIM ==========================

    function handleSim() {
        const loadPage = setInterval(() => {
            const title = $('#sim-title').text();
            const body = $('.sim-overview .content').text();
            const item = $('.issue-summary-cti .item').text();
            const ticket = $('.ticket-id').text().trim();
            if (title && body && item && ticket) {
                clearInterval(loadPage);
                if (title.includes("FIFA")) return handleFifaSim(body);
                if (title.includes("Rover")) return handleRoverSim(body);
                if (title.includes("HDSC")) return handleDefectAssuranceSim(body);
                if (item.includes("RVR")) return handleRefusedVendorReturnsSim(body);
                if (item.includes("Seller Coaching")) return handleSellerOutreachSim(body);
                if (item.includes("Partnered Carrier Refunds")) return handlePartneredCarrierProgramSim(body);
            }
        }, 25);
    }

    async function handleFifaSim(body) {
        try {
            const caseId = body.match(/(?<=Paragon case id: )[\d]+/)[0];
            const merchantId = body.match(/(?<=Merchant id: )[\d]+/)[0];
            const marketplaceId = body.match(/(?<=Marketplace id: )[\d]+/)[0];
            const marketplace = MARKETPLACE_ROUTES[marketplaceId];
            const region = PARAGON_ROUTES[marketplaceId];
            const token = await getToken();
            const { tenantId, status } = await getCase(token, marketplace, caseId, region);
            const customerId = await getCustomerId(token, caseId, tenantId, merchantId);
            const endpoint = "/inventoryplanning/manageinventoryhealth/";
            await peekNow(token, caseId, tenantId, merchantId, customerId, status, false, endpoint);
        } catch (e) {
            console.log('[Auto Peek] FIFA SIM auto-peek failed:', e);
        }
    }

    async function handleRoverSim(body) {
        try {
            const fc = $('#sim-sidebar .sim-problemLocation--container .info-value').text().split('-')?.[1]?.trim();
            const marketplace = (fc) ? MARKETPLACE_ROUTES[fc] : "amazon.com";
            const merchantId = body.match(/(?<=Merchant ID: )[\d]+/)[0];
            const token = await getToken();
            const { caseId, tenantId, status } = await getCase(token, marketplace, merchantId);
            const customerId = await getCustomerId(token, caseId, tenantId, merchantId);
            await peekNow(token, caseId, tenantId, merchantId, customerId, status, false);
        } catch (e) {
            console.log('[Auto Peek] Rover SIM auto-peek failed:', e);
        }
    }

    async function handleSellerOutreachSim(body) {
        try {
            const legacyMid = body.match(/MID:\s(\w+)/)[1];
            const marketplace = "amazon.com";
            const token = await getToken();
            const { caseId, tenantId, status } = await getCase(token, marketplace, legacyMid);
            const customerId = await getCustomerId(token, caseId, tenantId, legacyMid);
            await peekNow(token, caseId, tenantId, legacyMid, customerId, status, false);
        } catch (e) {
            console.log('[Auto Peek] Seller Outreach SIM auto-peek failed:', e);
        }
    }

    async function handleDefectAssuranceSim(body) {
        try {
            const merchantId = body.match(/MID:\s(\w+)/)[1];
            const shipmentId = body.match(/FBA[\w]{6,9}/)[0];
            const fc = body.match(/Warhouse ID:\s([\w]{3,4})/)[1];
            const marketplace = getMarketplaceFromFc(fc);
            const token = await getToken();
            const legacyMid = await getLegacyMid(token, shipmentId);
            const { caseId, tenantId, status } = await getCase(token, marketplace, legacyMid);
            const customerId = await getCustomerId(token, caseId, tenantId, legacyMid);
            const endpoint = (shipmentId) ? `/fba/inbound-shipment/summary/${shipmentId}/problems` : "";
            await peekNow(token, caseId, tenantId, legacyMid, customerId, status, false, endpoint);
        } catch (e) {
            console.log('[Auto Peek] Defect Assurance SIM auto-peek failed:', e);
        }
    }

    async function handleRefusedVendorReturnsSim(body) {
        try {
            body = body.toLowerCase();
            const marketplace = "amazon.com";
            const merchantId = body.match(/(?<=seller id:\s|merchant id:\s)[\d]+/g)[0];
            const caseIdRegex = body.match(/(?<=seller case:\s)[^\n]+/g)?.[0].split("caseid=")?.[1];
            const searchText = (caseIdRegex) ? caseIdRegex : merchantId;
            const token = await getToken();
            const { caseId, tenantId, status } = await getCase(token, marketplace, searchText);
            const customerId = await getCustomerId(token, caseId, tenantId, merchantId);
            const endpoint = "/fba/settings/index.html/";
            await peekNow(token, caseId, tenantId, merchantId, customerId, status, false, endpoint);
        } catch (e) {
            console.log('[Auto Peek] RVR SIM auto-peek failed:', e);
        }
    }

    async function handlePartneredCarrierProgramSim(body) {
        try {
            body = body.toLowerCase();
            const marketplace = "amazon.com";
            const caseIdRegex = body.match(/case([^\d]+)([\d]+)/)?.[2];
            const merchantId = body.match(/seller([^\d]+)([\d]+)/)?.[2];
            const shipmentId = body.match(/fba[\w]+/)?.[0]?.toUpperCase();
            const searchText = (caseIdRegex) ? caseIdRegex : merchantId;
            const token = await getToken();
            const { caseId, tenantId, status } = await getCase(token, marketplace, searchText);
            const customerId = await getCustomerId(token, caseId, tenantId, merchantId);
            const endpoint = (shipmentId) ? `/fba/inbound-shipment/summary/${shipmentId}/` : "";
            await peekNow(token, caseId, tenantId, merchantId, customerId, status, false, endpoint);
        } catch (e) {
            console.log('[Auto Peek] Partnered Carrier SIM auto-peek failed:', e);
        }
    }

    async function handleFreeReplacementRefundSim(body) {
        try {
            const merchantId = body.match(/(?<=Merchant Id: )[\d]+/)[0];
            const marketplace = body.match(/(?<=Marketplace: )[\w.]+/)[0];
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
        const token = res.match(/csrfToken:\s"([^\n]+)"/);
        if (!token) {
            console.log('[Auto Peek] Paragon token not found. Please log into Paragon.');
            return false;
        }
        return DOMPurify.sanitize(token[1]);
    }

    async function getCase(token, marketplace, searchText, region = `${REGION}`) {
        const res = await xhrPromise({
            method: "POST",
            url: `https://paragon-${region}.amazon.com/hz/api/search`,
            headers: { "Content-Type": "application/json;charset=UTF-8", "pgn-csrf-token": token },
            data: JSON.stringify({ "query": `${searchText}`, "searchAllTenants": true, "contentTypes": [{ "contentType": "CASE", "pageSize": 100, "pageNum": 1, "sortField": "queue", "sortOrder": "desc", "filters": ["status:resolved", "status:pending amazon action", "status:pending merchant action", "status:merchant action completed", "status:work-in-progress", "status:reopened", "status:pending deployment"] }] })
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
            return true;
        }
        const peekCheck = await xhrPromise({
            method: "GET",
            url: `https://paragon-${REGION}.amazon.com/hz/paragon/peeknow/ajax?caseId=${caseId}&merchantId=${merchantId}&caseStatus=${caseStatus}&marketplaceId=`,
            headers: { "Content-Type": "application/x-www-form-urlencoded", "pgn-csrf-token": token },
        });
        const data = JSON.parse(peekCheck);
        return (data.hasRight && data.validCaseStatus);
    }

    async function peekNow(token, caseId, tenantId, merchantId, customerId, caseStatus = null, newTab = false, endpoint = "") {
        try {
            if (!await checkCasePeekable(token, caseId, merchantId, caseStatus)) {
                return false;
            }
            const res = await xhrPromise({
                method: "POST",
                url: `https://paragon-${REGION}.amazon.com/hz/paragon/peeknow/invokepeeknow`,
                headers: { "Content-Type": "application/x-www-form-urlencoded", "pgn-csrf-token": token, "case-tenant-id": tenantId },
                data: `customerId=${customerId}&merchantId=${merchantId}&caseId=${caseId}&caseTenantId=${tenantId}`,
            });
            const data = JSON.parse(res).results.data;
            if (!data.success) {
                return false;
            }
            const landingPage = (!endpoint) ? data.scURL : data.scURL.replace('/home', endpoint);
            GM_setValue("peeked", JSON.stringify({
                ttl: new Date().setMinutes(new Date().getMinutes() + data.duration),
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
            console.log('[Auto Peek] peekNow failed:', e);
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
            } catch {
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
    // 3) SERENITY PAGE — Auto-populate FRD (with PO ID validation)
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

        function tryPopulateMID() {
            const input = document.getElementById('mid-search-input');
            if (!input) return;
            if (input.value) return;

            try {
                const stored = JSON.parse(GM_getValue('autoPopulate_MID', '{}'));
                const ageMs = Date.now() - (stored.timestamp || 0);

                if (stored.value && ageMs < THREE_HOURS) {
                    input.value = stored.value;
                    console.log('[AutoPopulate] MID auto-populated:', stored.value);
                }
            } catch (e) {
                console.log('[AutoPopulate] MID error:', e);
            }
        }

        const midPopObserver = new MutationObserver(tryPopulateMID);
        midPopObserver.observe(document.body, { childList: true, subtree: true });
    }

})();


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

        const overlay = document.createElement('div');
        overlay.id = 'aux-alert-overlay';
        overlay.innerHTML = `
            <div id="aux-alert-box">
                <div id="aux-alert-header">
                    🚫 AUX Not Available — Action Blocked
                </div>
                <div id="aux-alert-body">
                    <div class="aux-status-line">
                        Current AUX Status: <strong>${statusText}</strong>
                    </div>
                    <div class="aux-message">${message}</div>
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

        function updateParagonButtons() {
            const { available } = checkIsAvailable();

            // Review button
            document.querySelectorAll('kat-button[label="Review"]').forEach(btn => {
                if (!available) {
                    btn.classList.add('aux-disabled-btn');
                    const inner = btn.querySelector('button');
                    if (inner) inner.classList.add('aux-disabled-btn');
                    addShield(btn, showParagonAlert);
                } else {
                    removeShield(btn);
                }
            });

            // Transfer button
            document.querySelectorAll('kat-button[label="Transfer"]').forEach(btn => {
                if (!available) {
                    btn.classList.add('aux-disabled-btn');
                    const inner = btn.querySelector('button');
                    if (inner) inner.classList.add('aux-disabled-btn');
                    addShield(btn, showParagonAlert);
                } else {
                    removeShield(btn);
                }
            });

            // Send button
            document.querySelectorAll('kat-button[label="Send"]').forEach(btn => {
                if (!available) {
                    btn.classList.add('aux-disabled-btn');
                    const inner = btn.querySelector('button');
                    if (inner) inner.classList.add('aux-disabled-btn');
                    addShield(btn, showParagonAlert);
                } else {
                    removeShield(btn);
                }
            });
        }

        function attachParagonListeners() {
            setInterval(updateParagonButtons, 500);
            updateParagonButtons();

            const auxObserver = new MutationObserver(updateParagonButtons);
            auxObserver.observe(document.body, { childList: true, subtree: true });
        }

        waitForCCP(() => {
            attachParagonListeners();
        });
    }

    // ======================== BEACON 2.0 PAGE ======================== //

    if (/console\.harmony\.a2z\.com\/beacon2\//.test(location.href)) {

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

        setInterval(updateBeaconButtons, 500);

        const beaconObserver = new MutationObserver(updateBeaconButtons);
        beaconObserver.observe(document.body, { childList: true, subtree: true });

        setTimeout(updateBeaconButtons, 1000);
    }

})();
