import './assets/bootstrap.min';
import './assets/bootstrap.min.css';
import $ from 'jquery';
import i18n from 'i18next';
import { en, zh } from './assets/translation/translation';

const resources = {
    en: {
        translation: en,
    },
    zh: {
        translation: zh,
    },
};

i18n.init({
    resources,
}).then(t => {
    for (const key in en) {
        $(`.${key}`).html(i18n.t(key));
    }
});

location.search.substr(1).indexOf('lang=en') > -1 ? i18n.changeLanguage('en') : i18n.changeLanguage('zh');

export function getCgi(appId: number, serverUrl: string, cgi: string) {
    // 测试用代码，开发者请忽略
    // Test code, developers please ignore
    let appID: number = appId;
    let server: string = serverUrl;
    let cgiToken: string = cgi;
    if (location.search) {
        const arrConfig = location.search.substr(1).split('&');

        arrConfig.forEach(function(item) {
            const key = item.split('=')[0],
                value = item.split('=')[1];

            if (key == 'appid') {
                appID = Number(value);
            }

            if (key == 'server') {
                server = decodeURIComponent(value);
            }

            if (key == 'cgi_token') {
                cgiToken = decodeURIComponent(value);
            }
        });
    }
    return { appID, server, cgiToken };
    // 测试用代码 end
    // Test code end
}
