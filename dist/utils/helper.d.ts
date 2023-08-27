declare function validateParams({ pa, pn }: {
    pa: string | undefined;
    pn: string | undefined;
}): string;
declare function buildUrl(this: string, params: object): string;
