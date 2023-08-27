function validateParams({ pa, pn }: {pa: string | undefined, pn: string | undefined }): string {
    let error = ''
    if (!pa || !pn) return "Virtual Payee's Address/Payee's Name is compulsory"
    if (pa?.length < 5 || pn?.length < 4) return "Virtual Payee's Address/Payee's Name is too short."   
    return error
}

function buildUrl(this: string, params: object) {
    let url = this, qs = ""
    for(let [key, value] of Object.entries(params)) 
        qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&"
    if (qs.length > 0) url = url + qs
    return url
}
