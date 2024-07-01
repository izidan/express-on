import moment from 'moment';

const y = '[1-9][0-9]{3}';
const m29 = '02';
const m30 = '0[4|6|9]|11';
const m31 = '0[1|3|5|7|8]|1[0|2]';
const d29 = '0[1-9]|[12][0-9]';
const d30 = '0[1-9]|[12][0-9]|30';
const d31 = '0[1-9]|[12][0-9]|3[01]';
const hh = '[0-1][0-9]|2[0-3]';
const mm = '[0-5][0-9]';
const ss = '[0-5][0-9]';
const ms = '\\.{0,1}[0-9]*';
const zz = 'Z|[-\\+][0-9|:]*';
const day = 'Sun|Mon|Tue|Wed|Thu|Fri|Sat';
const month = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
const zone = '[-\\+][0-9]{2}[0-5][0-9]|(?:UT|GMT|(?:E|C|M|P)(?:ST|DT)|[A-IK-Z])';

const YMD = `^${y}[-/](?:(?:${m29})[-/](?:${d29})|(?:${m30})[-/](?:${d30})|(?:${m31})[-/](?:${d31}))$`;
const DMY = `^(?:(?:${d29})[-/](?:${m29})|(?:${d30})[-/](?:${m30})|(?:${d31})[-/](?:${m31}))[-/]${y}$`;
const MDY = `^(?:(?:${m29})[-/](?:${d29})|(?:${m30})[-/](?:${d30})|(?:${m31})[-/](?:${d31}))[-/]${y}$`;
//const ISO = `^${y}-(?:(?:${m29})-(?:${d29})|(?:${m30})-(?:${d30})|(?:${m31})-(?:${d31}))$`;

export const DATE = {
    YMD: YMD.replace(/\[-\/\]/g, '[-/]?'),//`^${y}[-/]?(?:(?:${m29})[-/]?(?:${d29})|(?:${m30})[-/]?(?:${d30})|(?:${m31})[-/]?(?:${d31}))$`,
    DMY: DMY.replace(/\[-\/\]/g, '[-/]?'),//`^(?:(?:${d29})[-/]?(?:${m29})|(?:${d30})[-/]?(?:${m30})|(?:${d31})[-/]?(?:${m31}))[-/]?${y}$`,
    MDY: MDY.replace(/\[-\/\]/g, '[-/]?'),//`^(?:(?:${m29})[-/]?(?:${d29})|(?:${m30})[-/]?(?:${d30})|(?:${m31})[-/]?(?:${d31}))[-/]?${y}$`,
    ISO: `^${y}-(?:(?:${m29})-(?:${d29})|(?:${m30})-(?:${d30})|(?:${m31})-(?:${d31}))$`,
};

export const TIME = {
    HMS: `(?:${hh})(?:${mm})(?:${ss})(?:${ms})?(?:${zz})?`,
    ISO: `(?:${hh}):(?:${mm}):(?:${ss})(?:${ms})?(?:${zz})?`,
};

export const ISO8601 = `^${DATE.ISO.substr(1, DATE.ISO.length - 2)}T${TIME.ISO}$`;

export const RFC822 = `^(?:\\s*(?:${day}),?\\s*)?(?:${month})\\s+(?:(?:${d29})|(?:${d30})|(?:${d31}))\\s+${y}\\s+${TIME.ISO}\\s+(?:${zone})`;

export const toObject = v => 'string' === typeof v ?
    v.match(ISO8601) || v.match(RFC822) ? new Date(v) :
        v.match(DATE.ISO) ? moment.utc(v, 'YYYY-MM-DD').toDate() :
            v.match(YMD) ? moment.utc(v, 'YYYY/MM/DD').toDate() :
                v.match(DMY) ? moment.utc(v, 'DD/MM/YYYY').toDate() :
                    v.match(MDY) ? moment.utc(v, 'MM/DD/YYYY').toDate() :
                        v.match(/^(true|false|null|undefined)$/i) ? JSON.parse(v.toLowerCase()) :
                            !!v && !isNaN(v) && !v.match(/^[-\+]?0[^\.]/) ? Number(v) :
                                v.match(/^(yes|no)$/i) ? Boolean(v.length - 2) :
                                    v.match(/^\s*$/) ? undefined : v : v

export const toDate = v => 'string' === typeof v ?
    v.match(ISO8601) || v.match(RFC822) ? new Date(v) :
        v.match(DATE.ISO) ? moment.utc(v, 'YYYY-MM-DD').toDate() :
            v.match(DATE.YMD) ? moment.utc(v, 'YYYY/MM/DD').toDate() :
                v.match(DATE.DMY) ? moment.utc(v, 'DD/MM/YYYY').toDate() :
                    v.match(DATE.MDY) ? moment.utc(v, 'MM/DD/YYYY').toDate() : undefined : undefined

export default Object.assign(RegExp, { RFC822, ISO8601, TIME, DATE, toObject, toDate })