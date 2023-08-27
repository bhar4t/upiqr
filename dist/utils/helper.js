"use strict";
function validateParams({ pa, pn }) {
    let error = '';
    if (!pa || !pn)
        return "Virtual Payee's Address/Payee's Name is compulsory";
    if ((pa === null || pa === void 0 ? void 0 : pa.length) < 5 || (pn === null || pn === void 0 ? void 0 : pn.length) < 4)
        return "Virtual Payee's Address/Payee's Name is too short.";
    return error;
}
function buildUrl(params) {
    let url = this, qs = "";
    for (let [key, value] of Object.entries(params))
        qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
    if (qs.length > 0)
        url = url + qs;
    return url;
}
